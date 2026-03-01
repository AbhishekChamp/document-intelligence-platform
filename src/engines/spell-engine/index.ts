import type { ValidationEngine, ValidationIssue, NormalizedDocument } from '../../shared/types/domain.types';
import { generateId } from '../../shared/utils/id';

const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'were',
  'been', 'has', 'had', 'did', 'does', 'doing', 'done', 'being', 'am', 'having',
  'hello', 'world', 'welcome', 'thank', 'please', 'sorry', 'yes', 'no', 'okay', 'ok', 'hi', 'hey',
  'document', 'analysis', 'report', 'data', 'information', 'system', 'platform', 'application',
  'software', 'hardware', 'network', 'internet', 'computer', 'technology', 'digital', 'online',
  'business', 'company', 'organization', 'enterprise', 'customer', 'client', 'user', 'team',
  'management', 'project', 'service', 'product', 'solution', 'process', 'strategy', 'plan',
  'meeting', 'email', 'phone', 'address', 'contact', 'support', 'help', 'guide', 'manual',
  'file', 'folder', 'directory', 'storage', 'backup', 'security', 'password', 'login',
  'account', 'profile', 'settings', 'configuration', 'option', 'feature', 'function',
  'module', 'component', 'interface', 'design', 'development', 'testing', 'deployment',
  'production', 'environment', 'server', 'database', 'api', 'integration', 'automation',
  'analytics', 'metrics', 'performance', 'optimization', 'improvement', 'enhancement',
  'error', 'issue', 'problem', 'bug', 'fix', 'solution', 'resolution', 'troubleshooting',
  'maintenance', 'upgrade', 'update', 'version', 'release', 'changelog', 'documentation'
]);

const COMMON_MISSPELLINGS: Record<string, string> = {
  'teh': 'the', 'hte': 'the', 'thier': 'their', 'recieve': 'receive',
  'seperate': 'separate', 'occured': 'occurred', 'definately': 'definitely',
  'occurence': 'occurrence', 'accomodate': 'accommodate', 'acommodate': 'accommodate',
  'acheive': 'achieve', 'accross': 'across', 'adress': 'address', 'adresses': 'addresses',
  'appearence': 'appearance', 'appearences': 'appearances', 'arguement': 'argument',
  'arguements': 'arguments', 'assasination': 'assassination', 'basicly': 'basically',
  'beleive': 'believe', 'beleives': 'believes', 'beleiving': 'believing',
  'benifit': 'benefit', 'benifits': 'benefits', 'becomeing': 'becoming',
  'becuase': 'because', 'begining': 'beginning', 'beleived': 'believed',
  'calender': 'calendar', 'catagory': 'category', 'cemetary': 'cemetery',
  'changable': 'changeable', 'cheif': 'chief', 'colllect': 'collect',
  'comming': 'coming', 'commited': 'committed', 'completely': 'completely',
  'concious': 'conscious', 'copywrite': 'copyright', 'curiousity': 'curiosity',
  'decieve': 'deceive', 'definate': 'definite',
  'desireable': 'desirable', 'diarhea': 'diarrhea', 'dissapoint': 'disappoint',
  'ecstacy': 'ecstasy', 'embarass': 'embarrass', 'enviroment': 'environment',
  'equiped': 'equipped', 'existance': 'existence', 'experiance': 'experience',
  'finaly': 'finally', 'folowing': 'following', 'foriegn': 'foreign',
  'freind': 'friend', 'goverment': 'government', 'gracefull': 'graceful',
  'garantee': 'guarantee', 'happyness': 'happiness', 'harrass': 'harass',
  'heighth': 'height', 'heirarchy': 'hierarchy', 'humerous': 'humorous',
  'imediately': 'immediately', 'independant': 'independent', 'indispensible': 'indispensable',
  'innoculate': 'inoculate', 'inteligence': 'intelligence', 'intresting': 'interesting',
  'irresistable': 'irresistible', 'knowlege': 'knowledge', 'liason': 'liaison',
  'libary': 'library', 'lisence': 'license', 'maintainance': 'maintenance',
  'managment': 'management', 'millenium': 'millennium', 'miniture': 'miniature',
  'miniscule': 'minuscule', 'mispell': 'misspell', 'neccessary': 'necessary',
  'noticable': 'noticeable', 'occassion': 'occasion',
  'occurance': 'occurrence', 'ocurring': 'occurring', 'paralell': 'parallel',
  'paticular': 'particular', 'peice': 'piece', 'percieve': 'perceive',
  'perserverance': 'perseverance', 'posession': 'possession', 'prefered': 'preferred',
  'presance': 'presence', 'priviledge': 'privilege', 'publically': 'publicly',
  'recogize': 'recognize', 'recomend': 'recommend',
  'relevent': 'relevant', 'religous': 'religious', 'repetion': 'repetition',
  'restarant': 'restaurant', 'rythm': 'rhythm', 'sacreligious': 'sacrilegious',
  'sieze': 'seize', 'sillhouette': 'silhouette',
  'similiar': 'similar', 'sincerly': 'sincerely', 'speach': 'speech',
  'stratagy': 'strategy', 'sucess': 'success', 'suprise': 'surprise',
  'tommorow': 'tomorrow', 'tongue': 'tongue', 'truely': 'truly',
  'unforseen': 'unforeseen', 'unfortunatly': 'unfortunately', 'untill': 'until',
  'wierd': 'weird', 'wether': 'whether', 'wich': 'which', 'withdrawl': 'withdrawal',
  'writting': 'writing', 'yeild': 'yield'
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
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
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findSimilarWords(word: string, maxDistance: number = 2): string[] {
  const suggestions: string[] = [];
  const lowerWord = word.toLowerCase();
  
  for (const dictWord of COMMON_WORDS) {
    const distance = levenshteinDistance(lowerWord, dictWord);
    if (distance <= maxDistance && distance > 0) {
      suggestions.push(dictWord);
    }
    if (suggestions.length >= 3) break;
  }
  
  return suggestions;
}

export class SpellEngine implements ValidationEngine {
  name = 'Spell Engine';
  version = '1.0.0';
  enabled = true;

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const words = document.tokens.filter(t => t.type === 'word');

    for (const token of words) {
      const word = token.text.toLowerCase();
      
      if (word.length <= 2 || /^\d+$/.test(word)) continue;
      if (COMMON_WORDS.has(word)) continue;
      
      if (COMMON_MISSPELLINGS[word]) {
        issues.push({
          id: generateId(),
          type: 'spell',
          severity: 'medium',
          message: `Possible misspelling: "${token.text}"`,
          suggestions: [COMMON_MISSPELLINGS[word]],
          startIndex: token.startIndex,
          endIndex: token.endIndex,
          confidence: 0.95,
          engine: this.name,
          rule: 'common-misspelling'
        });
        continue;
      }

      const suggestions = findSimilarWords(word);
      if (suggestions.length > 0) {
        const confidence = Math.max(0.6, 0.9 - (suggestions.length * 0.1));
        issues.push({
          id: generateId(),
          type: 'spell',
          severity: suggestions.length === 1 ? 'medium' : 'low',
          message: `Possible misspelling: "${token.text}"`,
          suggestions,
          startIndex: token.startIndex,
          endIndex: token.endIndex,
          confidence,
          engine: this.name,
          rule: 'dictionary-check'
        });
      }
    }

    return issues;
  }
}

export const spellEngine = new SpellEngine();
