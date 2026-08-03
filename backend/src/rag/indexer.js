import Repository from '../models/Repository.js';
import User from '../models/User.js';
import { getOctokitClient, fetchRepoTree, fetchFileContent } from '../utils/github.util.js';
import { chunkFile } from '../utils/chunker.js';
import { generateEmbeddings } from './embedder.js';
import { Pinecone } from '@pinecone-database/pinecone';

const getPineconeIndex = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not defined in environment variables');
  }
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pc.index(process.env.PINECONE_INDEX || 'ai-engineer-agent');
};

const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx', '.py', '.md', '.json', '.go', '.html', '.css'];

export const indexRepository = async (repoId) => {
  try {
    const repo = await Repository.findById(repoId);
    if (!repo) throw new Error('Repository not found');

    const user = await User.findById(repo.userId);
    if (!user) throw new Error('Owner profile not found');

    const octokit = getOctokitClient(user.accessToken);
    const tree = await fetchRepoTree(octokit, repo.owner, repo.name, repo.defaultBranch);
    
    // Exclude docs, tests, third-party libraries, etc., to minimize API requests
    const excludedPatterns = [
      'node_modules', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'dist/', 'build/', '.git/', 'vendor/', 'docs/', 'test/', 'spec/', 
      'site/', 'static/', 'public/', 'assets/', 'min.js', 'min.css'
    ];

    const filteredFiles = tree.filter((node) => 
      node.type === 'blob' && 
      SUPPORTED_EXTENSIONS.some((ext) => node.path.endsWith(ext)) &&
      !excludedPatterns.some((pattern) => node.path.includes(pattern))
    );

    // Prioritize source code files over configurations/markdown, and shorter paths first (usually core files)
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.go'];
    const sortedFiles = filteredFiles.sort((a, b) => {
      const aIsCode = codeExtensions.some((ext) => a.path.endsWith(ext));
      const bIsCode = codeExtensions.some((ext) => b.path.endsWith(ext));
      if (aIsCode && !bIsCode) return -1;
      if (!aIsCode && bIsCode) return 1;
      return a.path.length - b.path.length;
    });

    // Limit to top 150 files to prevent hitting GitHub API rate limits on larger codebases
    const maxFilesToFetch = 150;
    const textFiles = sortedFiles.slice(0, maxFilesToFetch);
    console.log(`Filtered and selected ${textFiles.length} files (out of ${filteredFiles.length} found) for repository: ${repo.fullName}`);

    const allChunks = [];

    // Create repository metadata chunk
    const repoInfoText = `Repository Information:
Full Name: ${repo.fullName || repo.name}
Owner: ${repo.owner}
Name: ${repo.name}
Description: ${repo.description || 'No description provided.'}
Primary Language: ${repo.language || 'Not specified'}
Stars: ${repo.stars || 0}
Forks: ${repo.forks || 0}
Open Issues Count: ${repo.openIssuesCount || 0}
GitHub URL: ${repo.githubUrl}
Default Branch: ${repo.defaultBranch || 'main'}`;

    allChunks.push({
      filePath: 'REPOSITORY_METADATA.md',
      text: repoInfoText,
      chunkIndex: 0,
      language: 'markdown',
    });

    let rateLimitExceeded = false;
    for (const file of textFiles) {
      if (rateLimitExceeded) break;
      try {
        const fileContent = await fetchFileContent(octokit, repo.owner, repo.name, file.path, repo.defaultBranch);
        const fileChunks = chunkFile(file.path, fileContent);
        allChunks.push(...fileChunks);
      } catch (fileErr) {
        console.warn(`Skipping file index error for ${file.path}:`, fileErr.message);
        
        // Detect rate limit error
        const errMsg = fileErr.message || '';
        const isRateLimit = fileErr.status === 403 || fileErr.status === 429 || errMsg.includes('rate limit') || errMsg.includes('Rate limit');
        if (isRateLimit) {
          console.error(`[Indexer] GitHub API rate limit hit. Halting further file fetches to preserve tokens. Proceeding to index already fetched files.`);
          rateLimitExceeded = true;
        }
      }
    }

    if (allChunks.length === 0) {
      console.log('No text content available to chunk/index.');
      repo.isIndexed = true;
      repo.indexedAt = new Date();
      await repo.save();
      return;
    }

    const textsToEmbed = allChunks.map((c) => `File: ${c.filePath}\n\n${c.text}`);
    const embeddings = await generateEmbeddings(textsToEmbed);
    
    const pineconeIndex = getPineconeIndex();
    const records = [];

    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i];
      const vector = embeddings[i];
      const vectorId = `${repoId}_${chunk.filePath.replace(/[^a-zA-Z0-9]/g, '_')}_${chunk.chunkIndex}`;

      records.push({
        id: vectorId,
        values: vector,
        metadata: {
          repoId: repoId.toString(),
          filePath: chunk.filePath,
          chunkIndex: chunk.chunkIndex,
          language: chunk.language,
          text: chunk.text,
        },
      });
    }

    const pineconeBatchSize = 100;
    for (let i = 0; i < records.length; i += pineconeBatchSize) {
      const batch = records.slice(i, i + pineconeBatchSize);
      await pineconeIndex.upsert(batch);
    }

    repo.isIndexed = true;
    repo.indexedAt = new Date();
    repo.totalChunks = allChunks.length;
    await repo.save();

    console.log(`Successfully indexed repo: ${repo.fullName}. Total vector chunks: ${allChunks.length}`);
  } catch (error) {
    console.error('Error in indexRepository pipeline:', error);
    throw error;
  }
};
