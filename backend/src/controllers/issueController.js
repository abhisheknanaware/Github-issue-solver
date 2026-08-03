import Issue from "../model/Issue.js";
import Repository from "../model/Repository.js";
import Plan from "../model/Plan.js";

export const listIssues = async (req, res) => {
  const { repositoryId } = req.params;
  try {
    const issues = await Issue.find({ repositoryId }).sort({ number: 1 });
    res.status(200).json({ success: true, issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const analyzeIssue = async (req, res) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const repo = await Repository.findById(issue.repositoryId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    // Keyword matching algorithm to identify candidate file
    const keywords = `${issue.title} ${issue.body}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let bestFile = null;
    let maxMatch = 0;

    repo.files.forEach((file) => {
      if (!file.content) return;
      let matches = 0;
      keywords.forEach((keyword) => {
        if (file.path.toLowerCase().includes(keyword)) matches += 3;
        if (file.content.toLowerCase().includes(keyword)) matches += 1;
      });

      if (matches > maxMatch) {
        maxMatch = matches;
        bestFile = file;
      }
    });

    if (!bestFile && repo.files.length > 0) {
      bestFile = repo.files.find((f) => !f.path.endsWith(".md") && !f.path.endsWith(".json")) || repo.files[0];
    }

    if (!bestFile) {
      return res.status(400).json({
        success: false,
        message: "No files in repository index to analyze.",
      });
    }

    const fileContent = bestFile.content || "";
    const lines = fileContent.split("\n");
    let startLine = Math.floor(lines.length / 3);
    let numLines = Math.min(8, Math.max(3, lines.length - startLine));
    
    let targetContent = lines.slice(startLine, startLine + numLines).join("\n");
    if (!targetContent.trim()) {
      targetContent = "// Empty codebase reference file";
    }

    let replacementContent = "";
    if (bestFile.path.endsWith(".js") || bestFile.path.endsWith(".jsx") || bestFile.path.endsWith(".ts")) {
      replacementContent = `// [AI AGENT WORKSPACE PLAN] Fix for: "${issue.title}"
if (typeof data === 'undefined' || data === null) {
  console.warn("AI Warning: Undefined payload input intercepted.");
  throw new Error("Payload cannot be undefined or null");
}
${targetContent}`;
    } else {
      replacementContent = `/* AI PATCH: Fix for "${issue.title}" */
${targetContent}`;
    }

    let plan = await Plan.findOne({ issueId: issue._id });
    if (plan) {
      plan.title = `Fix: ${issue.title}`;
      plan.goal = `Resolve the issue regarding: ${issue.title}. Modify ${bestFile.path} to implement validation check layers.`;
      plan.changes = [
        {
          path: bestFile.path,
          action: "modify",
          targetContent,
          replacementContent,
        },
      ];
      plan.status = "pending";
      plan.testStatus = "idle";
      plan.branchName = `agent-patch-issue-${issue.number}`;
      await plan.save();
    } else {
      plan = new Plan({
        issueId: issue._id,
        repositoryId: repo._id,
        title: `Fix: ${issue.title}`,
        goal: `Resolve the issue regarding: ${issue.title}. Modify ${bestFile.path} to implement validation check layers.`,
        changes: [
          {
            path: bestFile.path,
            action: "modify",
            targetContent,
            replacementContent,
          },
        ],
        branchName: `agent-patch-issue-${issue.number}`,
      });
      await plan.save();
    }

    res.status(200).json({ success: true, plan, targetFile: bestFile.path });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyPlan = async (req, res) => {
  const { id } = req.params;

  try {
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    plan.testStatus = "running";
    await plan.save();

    const change = plan.changes[0];
    let isSyntaxOk = true;

    if (change && (change.path.endsWith(".js") || change.path.endsWith(".jsx"))) {
      try {
        new Function(change.replacementContent);
      } catch (err) {
        isSyntaxOk = false;
      }
    }

    setTimeout(async () => {
      plan.testStatus = isSyntaxOk ? "passed" : "failed";
      await plan.save();
    }, 1500);

    res.status(200).json({ success: true, message: "Testing pipeline initiated", testStatus: "running" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPR = async (req, res) => {
  const { id } = req.params;

  try {
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const repo = await Repository.findById(plan.repositoryId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    const issue = await Issue.findById(plan.issueId);
    const owner = repo.owner;
    const repoName = repo.name;
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "DevAgent-App",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    };

    // 1. Get default branch info
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoDetailsRes.ok) {
      return res.status(400).json({ success: false, message: "Failed to access GitHub. Check GITHUB_TOKEN." });
    }
    const repoDetails = await repoDetailsRes.json();
    const defaultBranch = repoDetails.default_branch || "main";

    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`,
      { headers }
    );
    if (!branchRes.ok) {
      return res.status(400).json({ success: false, message: `Failed to find default branch.` });
    }
    const branchData = await branchRes.json();
    const latestCommitSha = branchData.object.sha;

    // 2. Create head branch ref on GitHub
    const branchName = plan.branchName || `agent-patch-issue-${Date.now()}`;
    const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: latestCommitSha }),
    });

    if (!createBranchRes.ok && createBranchRes.status !== 422) {
      const err = await createBranchRes.json().catch(() => ({}));
      return res.status(createBranchRes.status).json({ success: false, message: err.message || "Branch error" });
    }

    // 3. Commit code change to the branch
    const fileChange = plan.changes[0];
    const fileInfoRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${fileChange.path}?ref=${branchName}`,
      { headers }
    );

    let fileSha = null;
    let currentContent = "";
    if (fileInfoRes.ok) {
      const fileInfo = await fileInfoRes.json();
      fileSha = fileInfo.sha;
      if (fileInfo.encoding === "base64" && fileInfo.content) {
        currentContent = Buffer.from(fileInfo.content.replace(/\s/g, ""), "base64").toString("utf-8");
      }
    }

    let updatedContent = "";
    if (currentContent && fileChange.targetContent && currentContent.includes(fileChange.targetContent)) {
      updatedContent = currentContent.replace(fileChange.targetContent, fileChange.replacementContent);
    } else {
      updatedContent = fileChange.replacementContent;
    }

    const putFileRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${fileChange.path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `fix: AI patch for issue #${issue?.number || "code"}`,
        content: Buffer.from(updatedContent).toString("base64"),
        sha: fileSha,
        branch: branchName,
      }),
    });

    if (!putFileRes.ok) {
      const err = await putFileRes.json().catch(() => ({}));
      return res.status(putFileRes.status).json({ success: false, message: err.message || "Failed commit" });
    }

    // 4. Create GitHub Draft PR
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: plan.title,
        body: `### AI-Agent Code Contribution Summary\nThis Pull Request was generated automatically by the **AI Software Engineer Agent** to resolve issue: **"${issue?.title || "Code optimization patch"}"**`,
        head: branchName,
        base: defaultBranch,
        draft: true,
      }),
    });

    if (!prRes.ok) {
      const err = await prRes.json().catch(() => ({}));
      return res.status(prRes.status).json({ success: false, message: err.message || "PR Error" });
    }

    const prData = await prRes.json();
    plan.status = "completed";
    plan.prUrl = prData.html_url;
    await plan.save();

    res.status(200).json({ success: true, prUrl: prData.html_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
