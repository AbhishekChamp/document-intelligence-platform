import type { ValidationEngine, ValidationIssue, NormalizedDocument, GrammarRule } from '../../shared/types/domain.types';
import { generateId } from '../../shared/utils/id';

const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'repeated-words',
    name: 'Repeated Words',
    pattern: /\b(\w+)\s+\1\b/gi,
    severity: 'high',
    message: 'Repeated word detected',
    suggestion: 'Remove one occurrence of the repeated word'
  },
  {
    id: 'extra-spaces',
    name: 'Extra Spaces',
    pattern: /\s{2,}/g,
    severity: 'low',
    message: 'Multiple consecutive spaces',
    suggestion: 'Use a single space'
  },
  {
    id: 'multiple-punctuation',
    name: 'Multiple Punctuation',
    pattern: /([.!?]){2,}/g,
    severity: 'medium',
    message: 'Multiple consecutive punctuation marks',
    suggestion: 'Use a single punctuation mark'
  },
  {
    id: 'missing-space-after-period',
    name: 'Missing Space After Period',
    pattern: /\.[a-zA-Z]/g,
    severity: 'high',
    message: 'Missing space after period',
    suggestion: 'Add a space after the period'
  },
  {
    id: 'space-before-punctuation',
    name: 'Space Before Punctuation',
    pattern: /\s+([.,;:!?])/g,
    severity: 'medium',
    message: 'Space before punctuation',
    suggestion: 'Remove the space before punctuation'
  },
  {
    id: 'lowercase-start',
    name: 'Lowercase Start of Sentence',
    pattern: /(?:^|[.!?]\s+)([a-z])/g,
    severity: 'high',
    message: 'Sentence should start with capital letter',
    suggestion: 'Capitalize the first letter'
  },
  {
    id: 'a-before-vowel',
    name: 'A Before Vowel',
    pattern: /\ba\s+([aeiou]\w+)\b/gi,
    severity: 'medium',
    message: 'Use "an" before words starting with a vowel sound',
    suggestion: 'Replace "a" with "an"'
  },
  {
    id: 'an-before-consonant',
    name: 'An Before Consonant',
    pattern: /\ban\s+([^aeiou\s]\w+)\b/gi,
    severity: 'medium',
    message: 'Use "a" before words starting with a consonant sound',
    suggestion: 'Replace "an" with "a"'
  },
  {
    id: 'double-negative',
    name: 'Double Negative',
    pattern: /\b(not|no|never|nothing|nowhere|noone|none|neither|nor)\s+\w*\s+(not|no|never|nothing|nowhere|noone|none|neither|nor)\b/gi,
    severity: 'high',
    message: 'Double negative detected',
    suggestion: 'Use only one negative or rephrase'
  },
  {
    id: 'missing-apostrophe',
    name: 'Missing Apostrophe',
    pattern: /\b(dont|doesnt|didnt|wont|wouldnt|shouldnt|couldnt|cant|isnt|arent|wasnt|werent|havent|hasnt|hadnt)\b/gi,
    severity: 'high',
    message: 'Missing apostrophe in contraction',
    suggestion: 'Add an apostrophe before "t"'
  },
  {
    id: 'its-vs-it-is',
    name: 'Its vs It\'s',
    pattern: /\bits\s+(a|an|the|not|very|so|just|only|always|never|often|sometimes)\b/gi,
    severity: 'medium',
    message: 'Did you mean "it\'s" (it is/it has)?',
    suggestion: 'Use "it\'s" for "it is" or "it has"'
  },
  {
    id: 'your-vs-you-are',
    name: 'Your vs You\'re',
    pattern: /\byour\s+(welcome|right|wrong|here|there|good|bad|the best|the worst)\b/gi,
    severity: 'medium',
    message: 'Did you mean "you\'re" (you are)?',
    suggestion: 'Use "you\'re" for "you are"'
  },
  {
    id: 'there-vs-their',
    name: 'There vs Their vs They\'re',
    pattern: /\bthere\s+(is|are|was|were|has|have|had|will|would|could|should)\s+\w+\b/gi,
    severity: 'low',
    message: 'Check if "their" or "they\'re" is more appropriate',
    suggestion: 'Verify the correct word choice'
  }
];

export class GrammarEngine implements ValidationEngine {
  name = 'Grammar Engine';
  version = '1.0.0';
  enabled = true;
  rules: GrammarRule[] = GRAMMAR_RULES;

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const text = document.rawText;

    for (const rule of this.rules) {
      const matches = text.matchAll(rule.pattern);
      
      for (const match of matches) {
        const startIndex = match.index || 0;
        const endIndex = startIndex + match[0].length;
        const confidence = this.calculateConfidence(rule);
        
        issues.push({
          id: generateId(),
          type: 'grammar',
          severity: rule.severity,
          message: rule.message,
          suggestions: rule.suggestion ? [rule.suggestion] : [],
          startIndex,
          endIndex,
          confidence,
          engine: this.name,
          rule: rule.id
        });
      }
    }

    return issues;
  }

  private calculateConfidence(rule: GrammarRule): number {
    switch (rule.id) {
      case 'repeated-words': return 0.95;
      case 'extra-spaces': return 0.99;
      case 'missing-space-after-period': return 0.9;
      case 'missing-apostrophe': return 0.95;
      case 'lowercase-start': return 0.85;
      default: return 0.75;
    }
  }
}

export const grammarEngine = new GrammarEngine();
