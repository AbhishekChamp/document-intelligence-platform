import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../shared/components/Card";
import {
    CheckCircle,
    BookOpen,
    ShieldAlert,
    BarChart3,
    Gauge,
    FileText,
    Image,
    Zap,
    Lock,
    Github,
    Sparkles,
    Code2,
    Layers,
    Cpu,
} from "lucide-react";

const FEATURES = [
    {
        icon: CheckCircle,
        title: "Spell Checking",
        description:
            "Advanced spell checking with Levenshtein distance algorithm for intelligent suggestions.",
        color: "text-blue-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
        icon: BookOpen,
        title: "Grammar Analysis",
        description:
            "Detects repeated words, punctuation errors, contractions, and sentence structure issues.",
        color: "text-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        icon: BarChart3,
        title: "Readability Metrics",
        description:
            "Flesch Reading Ease score, grade level, sentence length analysis, and complexity detection.",
        color: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
        icon: ShieldAlert,
        title: "Compliance Checking",
        description:
            "Enterprise policy simulation including tone detection, PII patterns, and inclusive language.",
        color: "text-rose-500",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
    },
    {
        icon: Gauge,
        title: "Quality Scoring",
        description:
            "Aggregated scoring from all engines with confidence ratings and trend analysis.",
        color: "text-violet-500",
        bgColor: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
        icon: FileText,
        title: "Multi-Format Support",
        description:
            "Analyze TXT, HTML, SVG, PDF, and images (PNG, JPG, WEBP) with OCR capabilities.",
        color: "text-cyan-500",
        bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
    },
];

const TECH_STACK = [
    {
        name: "React 19",
        category: "Framework",
        description: "Modern React with hooks and concurrent features",
    },
    {
        name: "TypeScript",
        category: "Language",
        description: "Type-safe development with strict typing",
    },
    {
        name: "Vite 7",
        category: "Build Tool",
        description: "Fast development and optimized production builds",
    },
    {
        name: "Tailwind CSS",
        category: "Styling",
        description: "Utility-first CSS with dark mode support",
    },
    {
        name: "TanStack Router",
        category: "Routing",
        description: "Type-safe routing with code splitting",
    },
    {
        name: "Zustand",
        category: "State Management",
        description: "Lightweight state management with persistence",
    },
    {
        name: "Tesseract.js",
        category: "OCR",
        description: "Client-side optical character recognition",
    },
    {
        name: "PDF.js",
        category: "PDF Parsing",
        description: "Mozilla PDF parsing library",
    },
    {
        name: "Recharts",
        category: "Visualization",
        description: "Interactive charts and analytics dashboards",
    },
    {
        name: "IndexedDB",
        category: "Storage",
        description: "Client-side database for analysis history",
    },
];

const ARCHITECTURE_POINTS = [
    {
        icon: Layers,
        title: "Domain-Driven Architecture",
        description:
            "Clear separation between domains (document, analysis, dashboard) with feature isolation.",
    },
    {
        icon: Code2,
        title: "Plugin-Based Engine System",
        description:
            "Each validation engine is independently replaceable with a standard interface.",
    },
    {
        icon: Cpu,
        title: "Client-Side Processing",
        description:
            "All analysis happens in the browser. No data ever leaves the user device.",
    },
    {
        icon: Lock,
        title: "Privacy by Design",
        description:
            "Documents are never uploaded to servers. Everything is processed locally.",
    },
];

export const AboutPage: React.FC = () => {
    return (
        <div className='space-y-8 max-w-5xl'>
            {/* Hero Section */}
            <div className='text-center py-8'>
                <div className='inline-flex items-center justify-center w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/25'>
                    <Sparkles className='w-12 h-12 text-white' />
                </div>
                <h1 className='text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent mb-4'>
                    DocuIntel
                </h1>
                <p className='text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
                    A modern, privacy-first document intelligence platform for
                    quality analysis and compliance checking.
                </p>
                <div className='flex items-center justify-center gap-4 mt-6'>
                    <span className='px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium'>
                        MIT License
                    </span>
                    <span className='px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium'>
                        Privacy First
                    </span>
                    <span className='px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium'>
                        Open Source
                    </span>
                </div>
            </div>

            {/* Key Features */}
            <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                    Key Features
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <Card
                                key={feature.title}
                                className='group hover:shadow-lg transition-all duration-300'
                            >
                                <CardContent className='p-6'>
                                    <div
                                        className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                                    >
                                        <Icon
                                            className={`w-7 h-7 ${feature.color}`}
                                        />
                                    </div>
                                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                                        {feature.title}
                                    </h3>
                                    <p className='text-gray-500 dark:text-gray-400 text-sm'>
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Architecture */}
            <Card className='bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border-violet-100 dark:border-violet-800'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-3 text-2xl'>
                        <Layers className='w-6 h-6 text-violet-500' />
                        Architecture Highlights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {ARCHITECTURE_POINTS.map((point) => {
                            const Icon = point.icon;
                            return (
                                <div key={point.title} className='flex gap-4'>
                                    <div className='w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm'>
                                        <Icon className='w-6 h-6 text-violet-500' />
                                    </div>
                                    <div>
                                        <h3 className='font-semibold text-gray-900 dark:text-white mb-1'>
                                            {point.title}
                                        </h3>
                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                            {point.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Tech Stack */}
            <div>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
                    Technology Stack
                </h2>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
                    {TECH_STACK.map((tech) => (
                        <div
                            key={tech.name}
                            className='p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800 transition-colors'
                        >
                            <p className='text-xs text-violet-500 font-medium mb-1'>
                                {tech.category}
                            </p>
                            <h3 className='font-semibold text-gray-900 dark:text-white'>
                                {tech.name}
                            </h3>
                            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                {tech.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Supported Formats */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-3'>
                        <FileText className='w-6 h-6 text-violet-500' />
                        Supported Document Formats
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-4 md:grid-cols-7 gap-4'>
                        {[
                            {
                                name: "TXT",
                                icon: FileText,
                                color: "text-gray-600",
                                bg: "bg-gray-100",
                            },
                            {
                                name: "HTML",
                                icon: FileText,
                                color: "text-orange-500",
                                bg: "bg-orange-100",
                            },
                            {
                                name: "SVG",
                                icon: Image,
                                color: "text-blue-500",
                                bg: "bg-blue-100",
                            },
                            {
                                name: "PDF",
                                icon: FileText,
                                color: "text-rose-500",
                                bg: "bg-rose-100",
                            },
                            {
                                name: "PNG",
                                icon: Image,
                                color: "text-purple-500",
                                bg: "bg-purple-100",
                            },
                            {
                                name: "JPG",
                                icon: Image,
                                color: "text-emerald-500",
                                bg: "bg-emerald-100",
                            },
                            {
                                name: "WEBP",
                                icon: Image,
                                color: "text-amber-500",
                                bg: "bg-amber-100",
                            },
                        ].map((format) => {
                            const Icon = format.icon;
                            return (
                                <div
                                    key={format.name}
                                    className='flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-700'
                                >
                                    <div
                                        className={`w-12 h-12 ${format.bg} rounded-xl flex items-center justify-center`}
                                    >
                                        <Icon
                                            className={`w-6 h-6 ${format.color}`}
                                        />
                                    </div>
                                    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                        {format.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Project Info */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <Card>
                    <CardContent className='p-6'>
                        <div className='w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-4'>
                            <Zap className='w-6 h-6 text-violet-600' />
                        </div>
                        <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                            Getting Started
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Simply upload a document or paste text, select an
                            analysis mode, and get instant insights.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className='p-6'>
                        <div className='w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4'>
                            <Lock className='w-6 h-6 text-emerald-600' />
                        </div>
                        <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                            Privacy Guaranteed
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            All processing happens in your browser. Documents
                            are never sent to any server.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className='p-6'>
                        <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4'>
                            <Github className='w-6 h-6 text-blue-600' />
                        </div>
                        <h3 className='font-semibold text-gray-900 dark:text-white mb-2'>
                            Open Source
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Licensed under MIT. Feel free to fork, modify, and
                            use in your own projects.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* For Hiring Managers */}
            <Card className='bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0'>
                <CardContent className='p-8'>
                    <h2 className='text-2xl font-bold mb-4'>
                        For Hiring Managers
                    </h2>
                    <p className='text-gray-300 mb-6 leading-relaxed'>
                        This project demonstrates enterprise-level frontend
                        architecture skills including:
                    </p>
                    <ul className='space-y-3 text-gray-300'>
                        <li className='flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 bg-violet-400 rounded-full mt-2' />
                            <span>
                                <strong>Domain-Driven Design</strong> — Clean
                                separation of concerns with isolated domains
                            </span>
                        </li>
                        <li className='flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 bg-violet-400 rounded-full mt-2' />
                            <span>
                                <strong>Plugin Architecture</strong> — Modular
                                validation engines with standardized interfaces
                            </span>
                        </li>
                        <li className='flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 bg-violet-400 rounded-full mt-2' />
                            <span>
                                <strong>TypeScript Expertise</strong> — Strict
                                typing, generic utilities, and type-safe
                                patterns
                            </span>
                        </li>
                        <li className='flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 bg-violet-400 rounded-full mt-2' />
                            <span>
                                <strong>Performance Optimization</strong> — Lazy
                                loading, code splitting, and efficient state
                                management
                            </span>
                        </li>
                        <li className='flex items-start gap-3'>
                            <div className='w-1.5 h-1.5 bg-violet-400 rounded-full mt-2' />
                            <span>
                                <strong>Modern UI/UX</strong> — Responsive
                                design, dark mode, accessibility, and polished
                                interactions
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className='text-center py-8 text-gray-500 dark:text-gray-400'>
                <p>
                    Built with React, TypeScript, and modern web technologies.
                </p>
                <p className='mt-2 text-sm'>MIT License © 2026 DocuIntel</p>
            </div>
        </div>
    );
};
