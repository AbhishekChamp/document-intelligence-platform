# DocuIntel - Document Intelligence Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)

> A modern, privacy-first document quality analysis platform built with React, TypeScript, and enterprise-grade architecture.

![DocuIntel Screenshot](https://via.placeholder.com/800x400/8b5cf6/ffffff?text=DocuIntel)

## Features

### Document Analysis
- **Spell Checking** — Levenshtein distance algorithm with intelligent suggestions
- **Grammar Analysis** — Detects repeated words, punctuation errors, contractions
- **Readability Metrics** — Flesch Reading Ease, grade level, sentence complexity
- **Compliance Checking** — Enterprise policy simulation, PII detection, tone analysis
- **Quality Scoring** — Aggregated scores with confidence ratings

### Supported Formats
- **Text**: `.txt`, `.html`, `.svg`
- **Documents**: `.pdf`
- **Images**: `.png`, `.jpg`, `.webp` (with OCR)

### Analysis Modes
- **Full Analysis** — Run all engines for comprehensive checking
- **Individual Modes** — Spell, Grammar, Readability, or Compliance only
- **Real-time Progress** — Step-by-step progress with status messages

### Privacy & Security
- **100% Client-Side** — No data leaves your browser
- **No External APIs** — All processing is local
- **IndexedDB Storage** — Analysis history stored locally
- **MIT Licensed** — Open source and free to use

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS |
| **Routing** | TanStack Router |
| **State Management** | Zustand |
| **Data Fetching** | TanStack Query |
| **Charts** | Recharts |
| **OCR** | Tesseract.js |
| **PDF Parsing** | PDF.js |
| **Storage** | IndexedDB |

## Architecture

```
src/
├── app/                 # Application layer
│   ├── layout/         # Layout components
│   ├── pages/          # Page components
│   ├── providers/      # Context providers
│   └── router/         # Route configuration
├── domains/            # Domain-driven modules
│   ├── analysis/       # Analysis orchestration
│   ├── dashboard/      # Analytics & insights
│   └── document/       # Document processing
├── engines/            # Validation engines
│   ├── spell-engine/   # Spell checking
│   ├── grammar-engine/ # Grammar rules
│   ├── readability/    # Readability metrics
│   ├── compliance/     # Policy checking
│   └── confidence/     # Score aggregation
├── infrastructure/     # Infrastructure layer
│   ├── caching/        # IndexedDB storage
│   ├── extraction/     # File parsing (PDF, OCR)
│   └── workers/        # Web workers
└── shared/             # Shared resources
    ├── components/     # UI components
    ├── hooks/          # Custom hooks
    ├── types/          # TypeScript types
    └── utils/          # Utilities
```

### Key Architectural Decisions

- **Domain-Driven Design** — Clear separation between business domains
- **Plugin Architecture** — Validation engines are interchangeable modules
- **Type Safety** — Strict TypeScript with comprehensive type definitions
- **Performance** — Code splitting, lazy loading, and efficient re-renders
- **Accessibility** — ARIA labels, keyboard navigation, focus management

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd document-intelligence-platform

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Usage

1. **Select Analysis Mode** — Choose from Full, Spell, Grammar, Readability, or Compliance
2. **Upload Document** — Drag & drop or click to browse (supports TXT, HTML, PDF, images)
3. **View Results** — See highlighted issues with suggestions
4. **Export** — Download analysis results as JSON
5. **Track History** — View past analyses in the History page

## Development

### Project Structure Principles

- **No Business Logic in UI** — All logic lives in domain layer
- **Strong Typing** — Types defined in `shared/types/`
- **Composition over Inheritance** — React components use composition patterns
- **Minimal Dependencies** — Only essential packages included

### Adding a New Validation Engine

1. Create a new folder in `src/engines/`
2. Implement the `ValidationEngine` interface:

```typescript
export class MyEngine implements ValidationEngine {
  name = 'My Engine';
  version = '1.0.0';
  enabled = true;
  
  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    // Your logic here
  }
}
```

3. Register in `analysis-orchestrator.ts`

## For Hiring Managers

This project demonstrates:

- **Enterprise Architecture** — Domain-driven design with clear separation of concerns
- **Modern React Patterns** — Hooks, context, composition, performance optimization
- **TypeScript Mastery** — Strict types, generics, advanced type patterns
- **Plugin System Design** — Modular, extensible validation engine architecture
- **State Management** — Zustand with persistence, IndexedDB integration
- **UI/UX Excellence** — Responsive design, dark mode, accessibility, animations
- **Performance Engineering** — Lazy loading, code splitting, memoization
- **Testing Readiness** — Architecture supports unit and integration testing

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ using React, TypeScript, and modern web technologies.
