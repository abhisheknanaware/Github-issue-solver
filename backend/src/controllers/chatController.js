import Repository from "../model/Repository.js";
import Chat from "../model/Chat.js";

export const chatWithCodebase = async (req, res) => {
  const { repositoryId, message } = req.body;

  if (!repositoryId || !message) {
    return res.status(400).json({ success: false, message: "Missing repositoryId or query message" });
  }

  try {
    const repo = await Repository.findById(repositoryId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    const userChat = new Chat({ repositoryId, role: "user", message });
    await userChat.save();

    const keywords = message
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let citations = [];
    let matchSnippet = "";

    if (keywords.length > 0) {
      for (const file of repo.files) {
        if (!file.content) continue;
        const fileLines = file.content.split("\n");
        let foundLine = -1;
        let lineText = "";

        for (let i = 0; i < fileLines.length; i++) {
          const line = fileLines[i].toLowerCase();
          if (keywords.some((k) => line.includes(k))) {
            foundLine = i + 1;
            lineText = fileLines[i];
            break;
          }
        }

        if (foundLine !== -1) {
          citations.push({ path: file.path, line: foundLine, snippet: lineText.trim() });
          if (!matchSnippet) {
            const start = Math.max(0, foundLine - 3);
            const end = Math.min(fileLines.length, foundLine + 4);
            matchSnippet = fileLines.slice(start, end).join("\n");
          }
        }
        if (citations.length >= 3) break;
      }
    }

    let agentResponse = "";
    if (citations.length > 0) {
      const citList = citations.map((c) => `\`${c.path}\` (Line ${c.line})`).join(", ");
      agentResponse = `Based on my codebase RAG analysis, I found relevant segments in: ${citList}.

Here is the context snippet from \`${citations[0].path}\`:
\`\`\`javascript
${matchSnippet}
\`\`\`

You can refer to these files to modify configurations or verify implementations! Let me know if you need help planning code changes here.`;
    } else {
      agentResponse = `I scanned the repository files for keywords matching your query, but could not find specific matches. Try querying for folders or files like routing setup, DB connection configs, or routers.`;
    }

    const agentChat = new Chat({ repositoryId, role: "agent", message: agentResponse });
    await agentChat.save();

    res.status(200).json({ success: true, reply: agentResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatLogs = async (req, res) => {
  const { repositoryId } = req.params;
  try {
    const logs = await Chat.find({ repositoryId }).sort({ timestamp: 1 });
    res.status(200).json({ success: true, chatLogs: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
