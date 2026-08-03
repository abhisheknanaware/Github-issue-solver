import OpenAI from 'openai';

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

export const generateEmbeddings = async (texts) => {
  const openai = getOpenAIClient();
  const embeddings = [];
  const batchSize = 100;

  for (let i = 0; i < texts.length; i += batchSize) {
    const textBatch = texts.slice(i, i + batchSize);
    const cleanedBatch = textBatch.map((t) => (t.trim() === '' ? ' ' : t));
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: cleanedBatch,
    });

    const batchEmbeddings = response.data.map((item) => item.embedding);
    embeddings.push(...batchEmbeddings);
  }

  return embeddings;
};
