/**
 * Spell Check Worker
 * Performs levenshtein distance calculations off the main thread
 */

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarWords(word, wordList, maxDistance = 1) {
  const lowerWord = word.toLowerCase();
  const scoredSuggestions = [];

  // Don't suggest short words as corrections for longer words
  const minLength = Math.max(2, lowerWord.length - 1);
  const maxLength = lowerWord.length + 1;

  for (const dictWord of wordList) {
    // Skip words that are too different in length
    if (dictWord.length < minLength || dictWord.length > maxLength) continue;

    // Skip very short dictionary words as suggestions for longer words
    if (dictWord.length <= 3 && lowerWord.length > 4) continue;

    const distance = levenshteinDistance(lowerWord, dictWord);
    if (distance <= maxDistance && distance > 0) {
      // Prioritize same-length words or words with similar length
      const lengthDiff = Math.abs(dictWord.length - lowerWord.length);
      const score = distance + lengthDiff * 0.5;
      scoredSuggestions.push({ word: dictWord, score });
    }
  }

  // Sort by score (lower is better) and return top 3
  scoredSuggestions.sort((a, b) => a.score - b.score);
  return scoredSuggestions.slice(0, 3).map((s) => s.word);
}

// Handle messages from main thread
self.addEventListener("message", (event) => {
  const { type, payload, id } = event.data;

  if (type === "FIND_SIMILAR") {
    const { word, wordList, maxDistance } = payload;
    const suggestions = findSimilarWords(word, wordList, maxDistance);

    self.postMessage({
      type: "RESULT",
      id,
      payload: suggestions,
    });
  }
});
