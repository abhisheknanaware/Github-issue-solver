import { indexRepository } from '../rag/indexer.js';
import { retrieveContext } from '../rag/retriever.js';
import Repository from '../models/Repository.js';
import OpenAI from 'openai';

export const triggerIndexing = async (req, res, next) => {
  const { repoId } = req.params;
  try {
    indexRepository(repoId)
      .then(() => console.log(`Finished indexing background for ${repoId}`))
      .catch((err) => console.error(`Failed indexing background for ${repoId}:`, err));

    res.status(202).json({ success: true, message: 'Repository indexing triggered. Processing in background...' });
  } catch (error) {
    next(error);
  }
};

export const queryRepository = async (req, res, next) => {
  const { repoId, query } = req.body;
  try {
    if (!query) return res.status(400).json({ success: false, message: 'Query cannot be empty.' });

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, message: 'Repository not found.' });
    }

    // Attempt semantic retrieval from Pinecone
    const chunks = await retrieveContext(repoId, query, 8);
    const hasChunks = chunks && chunks.length > 0;

    let contextText;
    if (hasChunks) {
      // Use real RAG context
      contextText = chunks.map((c) => `File: ${c.filePath}\nCode snippet:\n${c.text}`).join('\n\n');
    } else {
      // Fallback: build context from repository metadata stored in MongoDB
      contextText = `Repository Metadata (no code chunks matched your query):
Full Name: ${repo.fullName}
Owner: ${repo.owner}
Description: ${repo.description || 'No description provided.'}
Primary Language: ${repo.language || 'Not specified'}
Stars: ${repo.stars || 0} | Forks: ${repo.forks || 0}
Open Issues: ${repo.openIssuesCount || 0}
Default Branch: ${repo.defaultBranch || 'main'}
GitHub URL: ${repo.githubUrl}
Indexed: ${repo.isIndexed ? 'Yes' : 'No (indexing may still be in progress)'}`;
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OPENAI_API_KEY is not defined.' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful Codebase Assistant for the GitHub repository: "${repo.fullName}".

Your behaviour rules:
1. If the user greets you or asks who you are, introduce yourself warmly as the codebase assistant for "${repo.fullName}".
2. When codebase context (code snippets) is provided, use it to answer the question accurately. Cite the source file paths in your answer.
3. When only repository metadata is provided (no matching code snippets), answer using that metadata and be transparent: say that you couldn't find relevant code snippets for that specific query, and suggest the user try rephrasing or ask about the repository's general purpose instead.
4. ${repo.isIndexed
  ? 'The repository has been indexed. If no code snippets matched, the query may be too specific or the relevant files were not included in the index.'
  : 'Note: This repository has not been fully indexed yet. Semantic code search will be limited until indexing is complete.'
}
5. Never fabricate code or make up file paths. Only cite what is present in the provided context.
6. Be concise, friendly, and developer-focused in tone.`,
        },
        {
          role: 'user',
          content: `Context:
${contextText}

Question: ${query}`,
        },
      ],
      temperature: 0.2,
    });

    const answer = response.choices[0].message.content;
    const sources = hasChunks
      ? [...new Map(chunks.map((c) => [c.filePath, { filePath: c.filePath, chunkIndex: c.chunkIndex }])).values()]
      : [];

    res.status(200).json({
      success: true,
      data: { answer, sources },
    });
  } catch (error) {
    next(error);
  }
};


export const explainFile = async (req, res, next) => {
  const { path: filePath, content } = req.body;
  try {
    if (!content) return res.status(400).json({ success: false, message: 'Content is required.' });
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, message: 'OPENAI_API_KEY is not defined.' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software developer explaining code files to beginner developers.',
        },
        {
          role: 'user',
          content: `Explain what this file (${filePath}) does in simple terms. Describe its purpose, key functions, and how it fits into the overall project. Be concise and beginner-friendly.\n\nCode:\n${content}`,
        },
      ],
      temperature: 0.2,
    });

    res.status(200).json({ success: true, data: { explanation: response.choices[0].message.content } });
  } catch (error) {
    next(error);
  }
};
