import { AnswerComparison, AnswerVerdict, WordDifference } from '../types';

const normalizeSpacing = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s*([/-])\s*/g, '$1')
    .replace(/\s+/g, ' ');

export const normalizeAnswer = (value: string) => normalizeSpacing(value);

const stripOptionalArticles = (value: string) =>
  normalizeSpacing(value)
    .split(' ')
    .filter((word) => word !== 'the')
    .join(' ');

const tokenize = (value: string) =>
  stripOptionalArticles(value)
    .split(' ')
    .filter(Boolean);

const levenshtein = (left: string, right: string) => {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );

  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
};

const getDifferences = (input: string, answer: string): WordDifference[] => {
  const inputWords = tokenize(input);
  const answerWords = tokenize(answer);
  const maxLength = Math.max(inputWords.length, answerWords.length);
  const differences: WordDifference[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const actual = inputWords[index] ?? '∅';
    const expected = answerWords[index] ?? '∅';
    if (actual !== expected) {
      differences.push({ expected, actual });
    }
  }

  return differences;
};

const evaluateAgainstAnswer = (
  input: string,
  answer: string,
): AnswerComparison & { score: number } => {
  const normalizedInput = normalizeAnswer(input);
  const normalizedAnswer = normalizeAnswer(answer);
  const articleSafeInput = stripOptionalArticles(input);
  const articleSafeAnswer = stripOptionalArticles(answer);

  if (
    normalizedInput === normalizedAnswer ||
    articleSafeInput === articleSafeAnswer
  ) {
    return {
      verdict: 'correct',
      matchedAnswer: answer,
      normalizedInput,
      differences: [],
      score: 0,
    };
  }

  const differences = getDifferences(input, answer);
  const charDistance = levenshtein(articleSafeInput, articleSafeAnswer);
  const longPhrase = articleSafeAnswer.length >= 18;
  const typoOnly =
    differences.length <= 2 &&
    differences.every(
      ({ actual, expected }) => levenshtein(actual, expected) <= 2,
    );

  const verdict: AnswerVerdict =
    (longPhrase && charDistance <= 2) || typoOnly ? 'almost' : 'incorrect';

  return {
    verdict,
    matchedAnswer: answer,
    normalizedInput,
    differences,
    score: charDistance + differences.length,
  };
};

export const compareAnswer = (
  input: string,
  possibleAnswers: string[],
): AnswerComparison => {
  const ranked = possibleAnswers
    .map((answer) => evaluateAgainstAnswer(input, answer))
    .sort((left, right) => {
      const verdictOrder = { correct: 0, almost: 1, incorrect: 2 };
      if (verdictOrder[left.verdict] !== verdictOrder[right.verdict]) {
        return verdictOrder[left.verdict] - verdictOrder[right.verdict];
      }

      return left.score - right.score;
    });

  const bestMatch = ranked[0];

  return {
    verdict: bestMatch.verdict,
    matchedAnswer: bestMatch.matchedAnswer,
    normalizedInput: bestMatch.normalizedInput,
    differences: bestMatch.differences,
  };
};

export const buildHint = (answer: string) => {
  const words = answer.split(' ');
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += 2) {
    chunks.push(words.slice(index, index + 2).join(' '));
  }

  return chunks.join(' • ');
};
