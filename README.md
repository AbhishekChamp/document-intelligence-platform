# DocuIntel - Document Intelligence Platform

[![CI](https://github.com/AbhishekChamp/document-intelligence-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/AbhishekChamp/document-intelligence-platform/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)

> A modern, privacy-first document quality analysis platform built with React, TypeScript, and enterprise-grade architecture.

## 🌟 Features

### Document Analysis

- **Spell Checking** — Comprehensive US-English dictionary with intelligent suggestions
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

## 🌐 Language Support

**Primary Language: US-English**

This application is specifically optimized for **United States English** text analysis.

- Spelling verification uses a comprehensive US-English dictionary
- Grammar rules follow American English conventions
- OCR text recognition is calibrated for US-English character recognition
- Readability metrics use US grade-level standards

> **Note:** While the application may work with other English variants and languages, accuracy is guaranteed only for US-English content.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/document-intelligence-platform.git
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

## 🧪 Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Open Vitest UI
pnpm test:ui
```

## 🏗️ Tech Stack

| Category             | Technology                     |
| -------------------- | ------------------------------ |
| **Framework**        | React 19 + TypeScript          |
| **Build Tool**       | Vite 7                         |
| **Styling**          | Tailwind CSS                   |
| **Routing**          | TanStack Router                |
| **State Management** | Zustand                        |
| **Data Fetching**    | TanStack Query                 |
| **Charts**           | Recharts                       |
| **OCR**              | Tesseract.js                   |
| **PDF Parsing**      | PDF.js                         |
| **Storage**          | IndexedDB                      |
| **Testing**          | Vitest + React Testing Library |

## 📁 Architecture

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

## 📝 Usage

1. **Select Analysis Mode** — Choose from Full, Spell, Grammar, Readability, or Compliance
2. **Upload Document** — Drag & drop or click to browse (supports TXT, HTML, PDF, images)
3. **View Results** — See highlighted issues with suggestions
4. **Export** — Download analysis results as JSON
5. **Track History** — View past analyses in the History page

## 🛠️ Development

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
  name = "My Engine";
  version = "1.0.0";
  enabled = true;

  async analyze(document: NormalizedDocument): Promise<ValidationIssue[]> {
    // Your logic here
  }
}
```

3. Register in `analysis-orchestrator.ts`

## 🔒 Security

- **Content Security Policy** — Strict CSP headers configured
- **No Data Transmission** — All processing happens locally
- **XSS Protection** — Proper sanitization of user input
- **No External Tracking** — No analytics or tracking scripts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Ensure all tests pass before submitting PR
- Update documentation as needed

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tesseract.js](https://github.com/naptha/tesseract.js) for OCR capabilities
- [PDF.js](https://github.com/mozilla/pdf.js) for PDF parsing
- [React](https://react.dev/) for the UI framework

---

Built with ❤️ using React, TypeScript, and modern web technologies.
