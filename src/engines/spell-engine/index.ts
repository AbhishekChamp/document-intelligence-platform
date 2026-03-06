/**
 * Spell Engine - Typo.js Implementation
 *
 * Exports the Typo.js-based spell engine for professional-grade spell checking.
 * Pure JavaScript implementation - no WASM required.
 */

// Main export: Typo.js engine
export { TypoEngine, typoEngine, cleanupTypo } from "./typo-engine";

// For backward compatibility, also export as spellEngine
export { typoEngine as spellEngine } from "./typo-engine";
