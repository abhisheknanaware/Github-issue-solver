import { generateEmbeddings } from './embedder.js';
import { Pinecone } from '@pinecone-database/pinecone';

const getPineconeIndex = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not defined in environment variables');
  }
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pc.index(process.env.PINECONE_INDEX || 'ai-engineer-agent');
};

export const retrieveContext = async (repoId, query, topK = 8) => {
  try {
    const [queryVector] = await generateEmbeddings([query]);
    const pineconeIndex = getPineconeIndex();

    const queryResponse = await pineconeIndex.query({
      vector: queryVector,
      topK,
      filter: { repoId: { $eq: repoId.toString() } },
      includeMetadata: true,
    });

    const chunks = (queryResponse.matches || []).map((match) => ({
      text: match.metadata.text,
      filePath: match.metadata.filePath,
      chunkIndex: match.metadata.chunkIndex,
      language: match.metadata.language,
      score: match.score,
    }));

    return chunks;
  } catch (error) {
    console.error('Error in RAG retrieveContext:', error);
    return [];
  }
};
