import Repository from '../models/Repository.js';
import Issue from '../models/Issue.js';
import Contribution from '../models/Contribution.js';
import PRDraft from '../models/PRDraft.js';
import { retrieveContext } from '../rag/retriever.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';

const agentEvents = new EventEmitter();

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

export const startAgentPipeline = async (req, res, next) => {
  const { repoId, issueId } = req.body;
  try {
    const repo = await Repository.findById(repoId);
    const issue = await Issue.findById(issueId);

    if (!repo || !issue) {
      return res.status(404).json({ success: false, message: 'Repository or Issue references not found.' });
    }

    const query = `${issue.title} ${issue.body}`;
    const ragContext = await retrieveContext(repoId, query, 8);

    const contribution = await Contribution.create({
      userId: req.user._id,
      repositoryId: repoId,
      issueId: issueId,
      status: 'running',
      currentStage: 'issueScout',
    });

    const inputPayload = {
      repo: { owner: repo.owner, name: repo.name, fullName: repo.fullName, language: repo.language },
      issue: { title: issue.title, body: issue.body, labels: issue.labels, number: issue.number },
      ragContext,
    };

    const pythonExecutable = getPythonPath();
    const scriptPath = path.resolve('src/agents/pipeline.py');
    const pyProcess = spawn(pythonExecutable, [scriptPath, JSON.stringify(inputPayload)]);

    let stderr = '';

    pyProcess.stdout.on('data', async (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const update = JSON.parse(line);
          const { stage, status, output, error } = update;

          if (stage === 'pipeline') continue;

          console.log(`[Python Agent Update] Stage: ${stage}, Status: ${status}`);

          agentEvents.emit(`update:${contribution._id}`, { stage, status, output, error });

          const contr = await Contribution.findById(contribution._id);
          if (contr) {
            contr.currentStage = stage;
            contr.stages[stage].status = status;
            
            if (status === 'completed') {
              contr.stages[stage].output = output;
              contr.stages[stage].completedAt = new Date();
            } else if (status === 'failed') {
              contr.stages[stage].error = error || 'Substage execution failed';
              contr.status = 'failed';
              contr.error = error || 'Execution failed';
            }
            await contr.save();
          }

          if (stage === 'prDraft' && status === 'completed') {
            const contr = await Contribution.findById(contribution._id);
            contr.status = 'completed';
            contr.completedAt = new Date();
            await contr.save();

            const parsedCodeDiffs = (contr.stages && contr.stages.coder && Array.isArray(contr.stages.coder.output)) 
              ? contr.stages.coder.output 
              : [];
            const parsedTestFiles = (contr.stages && contr.stages.testGenerator && Array.isArray(contr.stages.testGenerator.output)) 
              ? contr.stages.testGenerator.output 
              : [];
            const parsedDocumentation = (contr.stages && contr.stages.documentation && contr.stages.documentation.output && typeof contr.stages.documentation.output === 'object')
              ? contr.stages.documentation.output
              : { inlineComments: [], readmeSection: '' };

            await PRDraft.create({
              contributionId: contribution._id,
              userId: contr.userId,
              repositoryId: contr.repositoryId,
              issueId: contr.issueId,
              title: output?.title || 'No Title Generated',
              body: output?.body || 'No Description Generated',
              labels: output?.labels || [],
              branchName: output?.branchName || 'main',
              linkedIssue: output?.linkedIssue || '',
              codeDiffs: parsedCodeDiffs,
              testFiles: parsedTestFiles,
              documentation: parsedDocumentation,
              status: 'draft',
            });
          }

        } catch (e) {
          console.error('[Python Console Parser/DB Error]:', e);
          console.log(`[Python Console]: ${line}`);
        }
      }
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('close', async (code) => {
      console.log(`Python process finished with exit code: ${code}`);
      if (code !== 0) {
        console.error('Python execution error log:', stderr);
        
        const contr = await Contribution.findById(contribution._id);
        if (contr && contr.status === 'running') {
          contr.status = 'failed';
          contr.error = stderr || 'Pipeline process terminated unexpectedly.';
          await contr.save();
        }
        agentEvents.emit(`update:${contribution._id}`, { status: 'failed', error: stderr || 'Subprocess error' });
      }
    });

    res.status(202).json({ success: true, data: { contributionId: contribution._id } });

  } catch (error) {
    next(error);
  }
};

export const streamPipelineProgress = async (req, res) => {
  const { contributionId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const pingInterval = setInterval(() => {
    res.write(':\n\n');
  }, 10000);

  const contr = await Contribution.findById(contributionId);
  if (!contr) {
    res.write(`data: ${JSON.stringify({ error: 'Contribution record not found.' })}\n\n`);
    clearInterval(pingInterval);
    return res.end();
  }

  res.write(`data: ${JSON.stringify({ event: 'sync', currentStage: contr.currentStage, status: contr.status, stages: contr.stages })}\n\n`);

  if (contr.status === 'completed' || contr.status === 'failed') {
    clearInterval(pingInterval);
    return res.end();
  }

  const handleUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === 'failed' || (data.stage === 'prDraft' && data.status === 'completed')) {
      cleanup();
    }
  };

  const cleanup = () => {
    agentEvents.off(`update:${contributionId}`, handleUpdate);
    clearInterval(pingInterval);
    res.end();
  };

  agentEvents.on(`update:${contributionId}`, handleUpdate);

  req.on('close', () => {
    agentEvents.off(`update:${contributionId}`, handleUpdate);
    clearInterval(pingInterval);
  });
};

export const getContributionStatus = async (req, res, next) => {
  const { contributionId } = req.params;
  try {
    const contribution = await Contribution.findById(contributionId);
    if (!contribution) return res.status(404).json({ success: false, message: 'Contribution not found.' });
    res.status(200).json({ success: true, data: contribution });
  } catch (error) {
    next(error);
  }
};

export const getFullContributionDetails = async (req, res, next) => {
  const { id } = req.params;
  try {
    const contribution = await Contribution.findById(id).populate('issueId').populate('repositoryId');
    if (!contribution) return res.status(404).json({ success: false, message: 'Contribution not found.' });

    const draft = await PRDraft.findOne({ contributionId: id });
    res.status(200).json({ success: true, data: { contribution, draft } });
  } catch (error) {
    next(error);
  }
};

export const getRecentContributions = async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate('repositoryId', 'owner name fullName')
      .populate('issueId', 'title number');

    res.status(200).json({ success: true, data: contributions });
  } catch (error) {
    next(error);
  }
};
