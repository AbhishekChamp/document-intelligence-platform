export const APP_NAME = 'DocuIntel';
export const APP_VERSION = '1.0.0';

export const DEFAULT_ENGINE_CONFIG = {
  spell: { enabled: true, version: '1.0.0' },
  grammar: { enabled: true, version: '1.0.0' },
  readability: { enabled: true, version: '1.0.0' },
  compliance: { enabled: true, version: '1.0.0' },
  confidence: { enabled: true, version: '1.0.0' }
};

export const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444'
};

export const ISSUE_TYPE_COLORS = {
  spell: '#3b82f6',
  grammar: '#8b5cf6',
  readability: '#06b6d4',
  compliance: '#f59e0b',
  confidence: '#10b981'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/html',
  'image/svg+xml',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp'
];

export const DB_NAME = 'DocuIntelDB';
export const DB_VERSION = 1;
export const STORE_NAMES = {
  documents: 'documents',
  analyses: 'analyses',
  settings: 'settings'
};
