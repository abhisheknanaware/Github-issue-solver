import Repository from "../models/Repository.js";
import Issue from "../models/Issue.js";

const parseRepoUrl = (url) => {
    const cleanUrl = url.trim().replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    if (parts.length >= 2) {
        const repo = parts.pop();
        const owner = parts.pop();
        return { owner, repo };
    }
    return null;
};

export const syncRepository = async (req, res) => {
    const { githubUrl } = req.body;

    if (!githubUrl) {
        return res.status(400).json({ success: false, message: "GitHub URL is required" });
    }

    const parsed = parseRepoUrl(githubUrl);
    if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid GitHub URL format" });
    }

    const { owner, repo } = parsed;
    const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "DevAgent-App",
    };

    if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
        // 1. Fetch Repository Info
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!repoRes.ok) {
            const errData = await repoRes.json().catch(() => ({}));
            return res.status(repoRes.status).json({
                success: false,
                message: errData.message || `Failed to fetch repo: ${repoRes.statusText}`,
            });
        }
        const repoData = await repoRes.json();

        // 2. Fetch Recursive Directory Files Tree
        const defaultBranch = repoData.default_branch || "main";
        const treeRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=true`,
            { headers }
        );

        let indexedFiles = [];
        if (treeRes.ok) {
            const treeData = await treeRes.json();
            const rawFiles = treeData.tree || [];

            // Filter indexable files
            const allowedExtensions = [".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".md", ".html", ".py", ".go"];
            const codeFiles = rawFiles.filter(
                (f) =>
                    f.type === "blob" &&
                    allowedExtensions.some((ext) => f.path.endsWith(ext)) &&
                    !f.path.includes("node_modules/") &&
                    !f.path.includes("package-lock.json") &&
                    !f.path.includes("dist/") &&
                    !f.path.includes("build/") &&
                    !f.path.includes(".git/")
            );

            // Cache contents of first 30 files
            const filesToSync = codeFiles.slice(0, 30);
            for (const file of filesToSync) {
                try {
                    const contentRes = await fetch(
                        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
                        { headers }
                    );
                    if (contentRes.ok) {
                        const contentData = await contentRes.json();
                        let text = "";
                        if (contentData.encoding === "base64" && contentData.content) {
                            text = Buffer.from(contentData.content.replace(/\s/g, ""), "base64").toString("utf-8");
                        } else if (contentData.content) {
                            text = contentData.content;
                        }
                        indexedFiles.push({
                            path: file.path,
                            content: text,
                            type: "file",
                            size: file.size || text.length,
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch file context: ${file.path}:`, e.message);
                }
            }
        }

        // 3. Upsert Repository in MongoDB
        let dbRepo = await Repository.findOne({ githubUrl: repoData.html_url });
        if (dbRepo) {
            dbRepo.owner = repoData.owner.login;
            dbRepo.name = repoData.name;
            dbRepo.description = repoData.description || "";
            dbRepo.stars = repoData.stargazers_count;
            dbRepo.forks = repoData.forks_count;
            dbRepo.language = repoData.language || "";
            dbRepo.files = indexedFiles;
            dbRepo.indexedAt = new Date();
            await dbRepo.save();
        } else {
            dbRepo = new Repository({
                owner: repoData.owner.login,
                name: repoData.name,
                description: repoData.description || "",
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                language: repoData.language || "",
                githubUrl: repoData.html_url,
                files: indexedFiles,
            });
            await dbRepo.save();
        }

        // 4. Fetch Open Issues (top 10)
        const issuesRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`,
            { headers }
        );
        let syncedIssuesCount = 0;

        if (issuesRes.ok) {
            const issuesData = await issuesRes.json();
            await Issue.deleteMany({ repositoryId: dbRepo._id });

            for (const iss of issuesData) {
                if (iss.pull_request) continue;

                const labels = iss.labels.map((l) => l.name);
                const hasGoodFirstLabel = labels.some((l) =>
                    ["good first issue", "easy", "beginner", "help wanted"].includes(l.toLowerCase())
                );

                let difficulty = "Medium";
                if (hasGoodFirstLabel || (iss.body && iss.body.length < 300 && labels.length <= 2)) {
                    difficulty = "Easy";
                } else if (iss.body && iss.body.length > 1500) {
                    difficulty = "Hard";
                }

                let readinessScore = 65;
                if (iss.body && iss.body.length > 500) readinessScore += 15;
                if (labels.length > 0) readinessScore += 10;
                if (iss.comments > 0) readinessScore += 10;
                readinessScore = Math.min(readinessScore, 100);

                const matchScore = hasGoodFirstLabel ? 95 : difficulty === "Easy" ? 88 : difficulty === "Medium" ? 75 : 55;

                const dbIssue = new Issue({
                    repositoryId: dbRepo._id,
                    number: iss.number,
                    title: iss.title,
                    body: iss.body || "",
                    state: iss.state,
                    labels,
                    difficulty,
                    readinessScore,
                    matchScore,
                });
                await dbIssue.save();
                syncedIssuesCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: "Repository and issues synced successfully",
            repository: {
                id: dbRepo._id,
                owner: dbRepo.owner,
                name: dbRepo.name,
                stars: dbRepo.stars,
                language: dbRepo.language,
                filesCount: dbRepo.files.length,
                issuesCount: syncedIssuesCount,
            },
        });
    } catch (error) {
        console.error("Repository Sync Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const listRepositories = async (req, res) => {
    try {
        const repos = await Repository.find({}, { files: 0 });
        res.status(200).json({ success: true, repositories: repos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRepository = async (req, res) => {
    const { id } = req.params;
    try {
        const repo = await Repository.findById(id);
        if (!repo) {
            return res.status(404).json({ success: false, message: "Repository not found" });
        }
        res.status(200).json({ success: true, repository: repo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
