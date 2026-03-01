import type { ValidationEngine, ValidationIssue, NormalizedDocument, ComplianceRule } from '../../shared/types/domain.types';
import { generateId } from '../../shared/utils/id';

const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'profanity-check',
    name: 'Profanity Check',
    pattern: /\b(darn|heck|shoot|dang|gosh)\b/gi,
    severity: 'medium',
    message: 'Mild profanity or euphemism detected',
    category: 'language'
  },
  {
    id: 'confidential-marking',
    name: 'Confidential Marking Required',
    pattern: /^(?!.*confidential).*$/is,
    severity: 'high',
    message: 'Document may require confidential marking',
    category: 'classification'
  },
  {
    id: 'casual-language',
    name: 'Casual Language Check',
    pattern: /\b(yeah|yep|nope|gonna|wanna|gotta|dunno|sorta|kinda|lol|omg|btw)\b/gi,
    severity: 'medium',
    message: 'Overly casual language detected',
    category: 'tone'
  },
  {
    id: 'inclusive-language',
    name: 'Inclusive Language Check',
    pattern: /\b(mankind|chairman|policeman|fireman|mailman|stewardess|actress|waitress)\b/gi,
    severity: 'medium',
    message: 'Consider using gender-neutral terms',
    category: 'inclusivity'
  },
  {
    id: 'legal-disclaimer',
    name: 'Legal Disclaimer Check',
    pattern: /\b(advice|recommendation|consult.*professional|legal.*advice|financial.*advice|medical.*advice)\b/gi,
    severity: 'low',
    message: 'Content may require legal disclaimer',
    category: 'legal'
  },
  {
    id: 'data-privacy',
    name: 'Data Privacy Check',
    pattern: /\b(ssn|social security|credit card|password|api.?key|secret.?key|private.?key)\b/gi,
    severity: 'high',
    message: 'Sensitive data pattern detected',
    category: 'privacy'
  },
  {
    id: 'pii-check',
    name: 'PII Check',
    pattern: /\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/gi,
    severity: 'high',
    message: 'Potential personally identifiable information detected',
    category: 'privacy'
  },
  {
    id: 'copyright-check',
    name: 'Copyright Check',
    pattern: /\b(copyright|©|all rights reserved|trademark|™|®)\b/gi,
    severity: 'low',
    message: 'Copyright material detected',
    category: 'legal'
  },
  {
    id: 'opinion-disclaimer',
    name: 'Opinion Disclaimer',
    pattern: /\b(in my opinion|i believe|i think|personally|from my perspective)\b/gi,
    severity: 'low',
    message: 'Personal opinions expressed',
    category: 'tone'
  },
  {
    id: 'exclamation-overuse',
    name: 'Exclamation Overuse',
    pattern: /!{2,}/g,
    severity: 'low',
    message: 'Multiple exclamation marks may appear unprofessional',
    category: 'tone'
  },
  {
    id: 'all-caps',
    name: 'All Caps Check',
    pattern: /\b[A-Z]{4,}\b/g,
    severity: 'low',
    message: 'ALL CAPS word detected',
    category: 'formatting'
  }
];

export class ComplianceEngine implements ValidationEngine {
  name = 'Compliance Engine';
  version = '1.0.0';
  enabled = true;
  rules: ComplianceRule[] = COMPLIANCE_RULES;

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const text = document.rawText;

    for (const rule of this.rules) {
      if (rule.id === 'confidential-marking') {
        if (this.shouldCheckConfidentiality(text) && !text.toLowerCase().includes('confidential')) {
          issues.push({
            id: generateId(),
            type: 'compliance',
            severity: rule.severity,
            message: rule.message,
            suggestions: ['Add "Confidential" marking if document contains sensitive information'],
            startIndex: 0,
            endIndex: text.length,
            confidence: 0.6,
            engine: this.name,
            rule: rule.id
          });
        }
        continue;
      }

      const pattern = typeof rule.pattern === 'string' 
        ? new RegExp(rule.pattern, 'gi') 
        : rule.pattern;

      const matches = text.matchAll(pattern);

      for (const match of matches) {
        const startIndex = match.index || 0;
        const endIndex = startIndex + match[0].length;

        issues.push({
          id: generateId(),
          type: 'compliance',
          severity: rule.severity,
          message: rule.message,
          suggestions: this.getSuggestions(rule),
          startIndex,
          endIndex,
          confidence: this.calculateConfidence(rule),
          engine: this.name,
          rule: rule.id
        });
      }
    }

    return issues;
  }

  private shouldCheckConfidentiality(text: string): boolean {
    const sensitivePatterns = [
      /\b(strategy|roadmap|financial|revenue|profit|budget|forecast)\b/gi,
      /\b(confidential|proprietary|internal use only|not for distribution)\b/gi,
      /\b(customer data|user data|employee data|personnel)\b/gi
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  private getSuggestions(rule: ComplianceRule): string[] {
    const suggestionMap: Record<string, string[]> = {
      'profanity-check': ['Use professional language', 'Remove or replace the term'],
      'confidential-marking': ['Add "Confidential" header/footer', 'Apply document classification'],
      'casual-language': ['Use formal alternatives', 'Replace with professional terms'],
      'inclusive-language': [
        'Use "humankind" instead of "mankind"',
        'Use "chairperson" instead of "chairman"',
        'Use "police officer" instead of "policeman"',
        'Use "flight attendant" instead of "stewardess"'
      ],
      'legal-disclaimer': ['Add "This is not professional advice" disclaimer'],
      'data-privacy': ['Remove sensitive data', 'Redact information', 'Use placeholder values'],
      'pii-check': ['Remove PII', 'Mask sensitive numbers', 'Use anonymized data'],
      'copyright-check': ['Add proper attribution', 'Verify usage rights'],
      'opinion-disclaimer': ['Add "Opinions expressed are personal" disclaimer'],
      'exclamation-overuse': ['Use single exclamation mark', 'Replace with period'],
      'all-caps': ['Use sentence case or title case', 'Apply proper formatting']
    };

    return suggestionMap[rule.id] || ['Review and revise as needed'];
  }

  private calculateConfidence(rule: ComplianceRule): number {
    switch (rule.category) {
      case 'privacy': return 0.9;
      case 'legal': return 0.75;
      case 'inclusivity': return 0.85;
      case 'tone': return 0.7;
      default: return 0.8;
    }
  }

  addRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  setRules(rules: ComplianceRule[]): void {
    this.rules = rules;
  }
}

export const complianceEngine = new ComplianceEngine();
