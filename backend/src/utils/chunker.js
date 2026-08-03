export const estimateTokens = (text) => {
  return Math.ceil(text.split(/[\s,()\[\]{}+*/%=&|^!~;<>:-]+/).length * 1.1);
};

export const chunkFile = (filePath, content, chunkSize = 500, overlap = 50) => {
  const words = content.split(/(\s+)/); 
  const chunks = [];
  let currentWords = [];
  let currentTokenCount = 0;
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const tokenEst = estimateTokens(word);
    
    currentWords.push(word);
    currentTokenCount += tokenEst;

    if (currentTokenCount >= chunkSize) {
      chunks.push({
        text: currentWords.join(''),
        filePath,
        chunkIndex: chunkIndex++,
        language: filePath.split('.').pop() || 'txt',
      });

      const overlapWords = [];
      let overlapTokens = 0;
      for (let j = currentWords.length - 1; j >= 0; j--) {
        const w = currentWords[j];
        const t = estimateTokens(w);
        if (overlapTokens + t > overlap) break;
        overlapWords.unshift(w);
        overlapTokens += t;
      }
      currentWords = overlapWords;
      currentTokenCount = overlapTokens;
    }
  }

  if (currentWords.length > 0) {
    chunks.push({
      text: currentWords.join(''),
      filePath,
      chunkIndex: chunkIndex++,
      language: filePath.split('.').pop() || 'txt',
    });
  }

  return chunks;
};
