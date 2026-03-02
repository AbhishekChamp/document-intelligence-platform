import type { Token } from '../types/domain.types';

export function tokenize(inputText: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  
  while (index < inputText.length) {
    const char = inputText[index];
    const startIndex = index;
    
    if (/\s/.test(char)) {
      let text = char;
      index++;
      while (index < inputText.length && /\s/.test(inputText[index])) {
        text += inputText[index];
        index++;
      }
      tokens.push({ text, startIndex, endIndex: index, type: 'whitespace' });
      continue;
    }
    
    if (/\d/.test(char)) {
      let text = char;
      index++;
      while (index < inputText.length && /[\d.,]/.test(inputText[index])) {
        text += inputText[index];
        index++;
      }
      tokens.push({ text, startIndex, endIndex: index, type: 'number' });
      continue;
    }
    
    if (/[a-zA-Z]/.test(char)) {
      let text = char;
      index++;
      while (index < inputText.length && /[a-zA-Z']/.test(inputText[index])) {
        text += inputText[index];
        index++;
      }
      tokens.push({ text, startIndex, endIndex: index, type: 'word' });
      continue;
    }
    
    if (/[.!?;:,]/.test(char)) {
      tokens.push({ text: char, startIndex, endIndex: index + 1, type: 'punctuation' });
      index++;
      continue;
    }
    
    tokens.push({ text: char, startIndex, endIndex: index + 1, type: 'symbol' });
    index++;
  }
  
  return tokens;
}

export function getWords(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

export function getSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function getParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

export function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/e$/, '');
  
  const vowelGroups = word.match(/[aeiouy]+/g);
  return vowelGroups ? vowelGroups.length : 1;
}

export function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
