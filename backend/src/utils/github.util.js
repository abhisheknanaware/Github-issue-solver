import { Octokit } from '@octokit/rest';

export const getOctokitClient = (accessToken) => {
  return new Octokit({ auth: accessToken });
};

export const fetchRepoTree = async (octokit, owner, repo, branch = 'main') => {
  try {
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commitSha,
      recursive: 'true',
    });

    return treeData.tree; 
  } catch (error) {
    console.error('Error in fetchRepoTree:', error);
    throw error;
  }
};

export const fetchFileContent = async (octokit, owner, repo, path, branch = 'main') => {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(data)) {
      throw new Error(`Path ${path} is a directory, not a file.`);
    }

    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`Error loading file path ${path}:`, error.message);
    throw error;
  }
};

export const createGitHubPullRequest = async (octokit, { owner, repo, baseBranch, branchName, title, body, fileChanges }) => {
  // Get the authenticated user's name and email for commit sign-off (DCO)
  const { data: authUser } = await octokit.users.getAuthenticated();
  const authorName = authUser.name || authUser.login;
  const authorEmail = authUser.email || `${authUser.login}@users.noreply.github.com`;

  const { data: baseRef } = await octokit.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
  const baseCommitSha = baseRef.object.sha;

  let targetOwner = owner;
  let targetBaseCommitSha = baseCommitSha;
  let isFork = false;

  try {
    // Try to create the branch directly on the original repository
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseCommitSha,
    });
  } catch (error) {
    // If we lack permission (404/403/422), attempt to fork the repository and work on the fork
    if (error.status === 404 || error.status === 403 || error.status === 422) {
      console.log(`[GitHub Util] Direct push not allowed (status ${error.status}). Forking repository ${owner}/${repo}...`);
      
      const forkOwner = authUser.login;
      
      // Request a fork creation
      await octokit.repos.createFork({ owner, repo });
      
      // Poll to wait for the fork to be fully provisioned
      let forkReady = false;
      for (let i = 0; i < 10; i++) {
        try {
          await octokit.repos.get({ owner: forkOwner, repo });
          forkReady = true;
          break;
        } catch (e) {
          // Wait 2 seconds before checking again
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      
      if (!forkReady) {
        throw new Error(`Fork creation timed out for ${forkOwner}/${repo}`);
      }
      
      targetOwner = forkOwner;
      isFork = true;
      console.log(`[GitHub Util] Repository forked successfully. Working on fork: ${forkOwner}/${repo}`);

      // Retrieve the base commit SHA on the newly created fork
      const { data: forkBaseRef } = await octokit.git.getRef({ owner: forkOwner, repo, ref: `heads/${baseBranch}` });
      targetBaseCommitSha = forkBaseRef.object.sha;

      // Create the reference branch on the fork
      await octokit.git.createRef({
        owner: forkOwner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: targetBaseCommitSha,
      });
    } else {
      throw error;
    }
  }

  let currentTreeSha = targetBaseCommitSha;
  for (const change of fileChanges) {
    const { filePath, modifiedCode } = change;

    const { data: newBlob } = await octokit.git.createBlob({
      owner: targetOwner,
      repo,
      content: Buffer.from(modifiedCode).toString('base64'),
      encoding: 'base64',
    });

    const { data: newTree } = await octokit.git.createTree({
      owner: targetOwner,
      repo,
      base_tree: currentTreeSha,
      tree: [
        {
          path: filePath,
          mode: '100644', 
          type: 'blob',
          sha: newBlob.sha,
        },
      ],
    });
    currentTreeSha = newTree.sha;
  }

  const signOff = `Signed-off-by: ${authorName} <${authorEmail}>`;
  const commitMessage = `🤖 AI Software Engineer: Automated issue resolution\n\n${title}\n\n${signOff}`;

  const { data: newCommit } = await octokit.git.createCommit({
    owner: targetOwner,
    repo,
    message: commitMessage,
    tree: currentTreeSha,
    parents: [targetBaseCommitSha],
    author: {
      name: authorName,
      email: authorEmail,
    },
    committer: {
      name: authorName,
      email: authorEmail,
    },
  });

  await octokit.git.updateRef({
    owner: targetOwner,
    repo,
    ref: `heads/${branchName}`,
    sha: newCommit.sha,
  });

  const { data: pullRequest } = await octokit.pulls.create({
    owner, // Original parent repo owner
    repo,  // Original parent repo name
    title,
    body,
    head: isFork ? `${targetOwner}:${branchName}` : branchName,
    base: baseBranch,
  });

  return pullRequest;
};

