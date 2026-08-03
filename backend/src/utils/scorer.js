export const calculateReadinessScore = (issue) => {
  let score = 50; // Base score
  const labels = issue.labels || [];
  const body = issue.body || '';
  const commentCount = issue.commentCount || 0;

  // Has beginner label?
  const hasGoodFirstLabel = labels.some((l) =>
    ['good first issue', 'easy', 'beginner', 'help wanted', 'first-timers-only'].includes(l.toLowerCase())
  );
  if (hasGoodFirstLabel) score += 25;

  // Detail check
  if (body.length > 500 && body.length < 2000) {
    score += 15;
  } else if (body.length >= 2000) {
    score += 10; // too long might represent too much clutter
  }

  // Active collaboration indicates details are fleshed out
  if (commentCount > 0 && commentCount < 5) {
    score += 10;
  } else if (commentCount >= 5) {
    score += 5; // too many comments could mean debate/ambiguity
  }

  return Math.min(Math.max(score, 0), 100);
};

export const getDifficulty = (labels, body) => {
  const hasGoodFirstLabel = labels.some((l) =>
    ['good first issue', 'easy', 'beginner', 'help wanted'].includes(l.toLowerCase())
  );

  if (hasGoodFirstLabel || (body && body.length < 300 && labels.length <= 2)) {
    return 'Easy';
  } else if (body && body.length > 1500) {
    return 'Hard';
  }
  return 'Medium';
};
