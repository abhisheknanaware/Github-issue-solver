import Repository from '../models/Repository.js';
import Issue from '../models/Issue.js';
import PRDraft from '../models/PRDraft.js';
import Contribution from '../models/Contribution.js';
import User from '../models/User.js';
import { getOctokitClient, fetchRepoTree, fetchFileContent, createGitHubPullRequest } from '../utils/github.util.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const getPythonPath = () => {
  const venvWin = path.resolve('..', '.venv', 'Scripts', 'python.exe');
  const venvUnix = path.resolve('..', '.venv', 'bin', 'python');
  if (process.platform === 'win32' && fs.existsSync(venvWin)) {
    return venvWin;
  }
  if (process.platform !== 'win32' && fs.existsSync(venvUnix)) {
    return venvUnix;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
};

const runPythonIssueScout = (repoInfo, issueInfo) => {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath();
    const wrapperPath = path.resolve('src/agents/issue_scout_agent_wrapper.py');
    const payload = JSON.stringify({ repo: repoInfo, issue: issueInfo });
    
    const py = spawn(pythonPath, [wrapperPath, payload]);
    
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d) => (stdout += d.toString()));
    py.stderr.on('data', (d) => (stderr += d.toString()));

    py.on('close', (code) => {
      if (code !== 0) {
        try {
          const parsed = JSON.parse(stdout);
          if (parsed && parsed.error) {
            return reject(new Error(parsed.error));
          }
        } catch (e) {}
        return reject(new Error(stderr || stdout || 'Scout wrapper subprocess crash.'));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const getUserRepos = async (req, res, next) => {
  try {
    const octokit = getOctokitClient(req.user.accessToken);
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      visibility: 'public',
      sort: 'updated',
      per_page: 50,
    });

    const formatted = repos.map((r) => ({
      name: r.name,
      owner: r.owner.login,
      fullName: r.full_name,
      description: r.description,
      language: r.language || 'JavaScript',
      stars: r.stargazers_count,
      repoUrl: r.html_url,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const connectRepo = async (req, res, next) => {
  const { owner, repo } = req.body;
  try {
    const octokit = getOctokitClient(req.user.accessToken);
    const { data } = await octokit.repos.get({ owner, repo });
    
    let repository = await Repository.findOne({ fullName: data.full_name });
    
    if (repository) {
      repository.userId = req.user._id;
      await repository.save();
    } else {
      repository = await Repository.create({
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description || '',
        language: data.language || 'Unknown',
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssuesCount: data.open_issues_count,
        githubUrl: data.html_url,
        cloneUrl: data.clone_url,
        defaultBranch: data.default_branch,
        userId: req.user._id,
        isIndexed: false,
      });
    }

    import('../rag/indexer.js')
      .then((m) => m.indexRepository(repository._id))
      .catch((err) => console.error('Background index process failed:', err));

    res.status(201).json({ success: true, data: repository });
  } catch (error) {
    next(error);
  }
};

const triggerBackgroundScout = async (dbIssueId, repoInfo, issueInfo) => {
  try {
    const analysis = await runPythonIssueScout(repoInfo, issueInfo);
    const readinessScore = Math.round(analysis.score * 10);
    const scoreBreakdown = {
      labelClarity: analysis.labelClarity * 10,
      issueAge: analysis.issueAge * 10,
      commentCount: analysis.commentCount * 10,
      bodyClarity: analysis.bodyClarity * 10,
      fileComplexity: analysis.fileComplexity * 10,
    };
    const advice = analysis.advice;
    const hints = analysis.reasoning ? [analysis.reasoning] : [];

    await Issue.findByIdAndUpdate(dbIssueId, {
      readinessScore,
      scoreBreakdown,
      advice,
      hints,
    });
  } catch (scoutErr) {
    console.warn(`[Background Scout] Failed for issue ${dbIssueId}:`, scoutErr.message);
  }
};

export const getRepoIssues = async (req, res, next) => {
  const { repoId } = req.params;
  try {
    const repository = await Repository.findById(repoId);
    if (!repository) return res.status(404).json({ success: false, message: 'Repo not found.' });

    const octokit = getOctokitClient(req.user.accessToken);
    const { data: issues } = await octokit.issues.listForRepo({
      owner: repository.owner,
      repo: repository.name,
      state: 'open',
      per_page: 30,
    });

    const filteredIssues = issues.filter((i) => !i.pull_request);
    const results = [];

    for (const issue of filteredIssues) {
      let dbIssue = await Issue.findOne({ githubIssueId: issue.id, repositoryId: repository._id });
      
      if (!dbIssue) {
        dbIssue = await Issue.create({
          githubIssueId: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body || '',
          labels: issue.labels.map((l) => l.name),
          state: 'open',
          url: issue.html_url,
          readinessScore: 50,
          scoreBreakdown: { labelClarity: 50, issueAge: 50, commentCount: 50, bodyClarity: 50, fileComplexity: 50 },
          advice: 'Evaluating readiness score...',
          hints: [],
          createdByLogin: issue.user.login,
          githubCreatedAt: new Date(issue.created_at),
          commentCount: issue.comments,
          repositoryId: repository._id,
        });

        triggerBackgroundScout(
          dbIssue._id,
          { language: repository.language },
          { title: issue.title, body: issue.body || '', labels: issue.labels.map((l) => l.name) }
        ).catch((err) => console.error('Error triggering background scout:', err));
      }
      results.push(dbIssue);
    }

    results.sort((a, b) => b.readinessScore - a.readinessScore);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const getFileTree = async (req, res, next) => {
  const { repoId } = req.params;
  try {
    const repo = await Repository.findById(repoId);
    if (!repo) return res.status(404).json({ success: false, message: 'Repo not found' });

    const octokit = getOctokitClient(req.user.accessToken);
    const tree = await fetchRepoTree(octokit, repo.owner, repo.name, repo.defaultBranch);
    
    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

export const getFileContent = async (req, res, next) => {
  const { repoId } = req.params;
  const { path } = req.query;
  try {
    const repo = await Repository.findById(repoId);
    if (!repo) return res.status(404).json({ success: false, message: 'Repo not found' });

    const octokit = getOctokitClient(req.user.accessToken);
    const content = await fetchFileContent(octokit, repo.owner, repo.name, path, repo.defaultBranch);

    res.status(200).json({
      success: true,
      data: {
        path,
        content,
        language: path.split('.').pop() || 'txt',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitPullRequest = async (req, res, next) => {
  const { contributionId } = req.body;
  try {
    const draft = await PRDraft.findOne({ contributionId });
    if (!draft) return res.status(404).json({ success: false, message: 'PR Draft not found.' });

    const repo = await Repository.findById(draft.repositoryId);
    const user = await User.findById(draft.userId);

    const octokit = getOctokitClient(user.accessToken);

    const fileChanges = [];

    // 1. Process code modifications (apply diffs to original files)
    for (const diff of draft.codeDiffs || []) {
      let originalContent = '';
      try {
        originalContent = await fetchFileContent(octokit, repo.owner, repo.name, diff.filePath, repo.defaultBranch);
      } catch (err) {
        console.log(`[Submit PR] File ${diff.filePath} not found on GitHub, assuming new file.`);
      }

      let modifiedCode = diff.modifiedCode;
      if (originalContent) {
        // Apply patch
        if (diff.originalCode && originalContent.includes(diff.originalCode)) {
          modifiedCode = originalContent.replace(diff.originalCode, diff.modifiedCode);
        } else if (diff.originalCode && originalContent.includes(diff.originalCode.trim())) {
          modifiedCode = originalContent.replace(diff.originalCode.trim(), diff.modifiedCode);
        } else {
          console.warn(`[Submit PR] Could not find exact match for originalCode in ${diff.filePath}. Appending/replacing.`);
          modifiedCode = originalContent.replace(diff.originalCode, diff.modifiedCode);
        }
      }

      fileChanges.push({
        filePath: diff.filePath,
        modifiedCode,
      });
    }

    // 2. Add generated test files
    for (const testFile of draft.testFiles || []) {
      fileChanges.push({
        filePath: testFile.filePath,
        modifiedCode: testFile.content,
      });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const branchName = draft.branchName ? `${draft.branchName}-${randomSuffix}` : `ai-agent/fix-issue-${randomSuffix}`;

    console.log(`Submitting GitHub PR under branch: ${branchName} in repo ${repo.fullName}`);
    
    const githubPr = await createGitHubPullRequest(octokit, {
      owner: repo.owner,
      repo: repo.name,
      baseBranch: repo.defaultBranch,
      branchName,
      title: draft.title,
      body: draft.body,
      fileChanges,
    });

    draft.prUrl = githubPr.html_url;
    draft.prNumber = githubPr.number;
    draft.status = 'submitted';
    await draft.save();

    const contribution = await Contribution.findById(contributionId);
    contribution.status = 'completed';
    await contribution.save();

    res.status(200).json({ success: true, data: { prUrl: githubPr.html_url, prNumber: githubPr.number } });
  } catch (error) {
    next(error);
  }
};
