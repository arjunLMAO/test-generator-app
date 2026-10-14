# 🎯 JEE Main & Advanced Test Generator & CBT Examination Platform

An adaptive, production-grade JEE Main and JEE Advanced Computer-Based Test (CBT) examination workspace, test generator, real-time analytics suite, and chapter-level diagnostic platform. Powered by an authentic bank of **5,263 verified questions** across Physics, Chemistry, and Mathematics with KaTeX mathematical typography, dynamic circuit/diagram SVG rendering, and zero-leakage student test security.

---

## 🌟 Key Features

### 1. 🖥️ Authentic NTA CBT Interface Clone
- **Pixel-Accurate Interface**: Faithful recreation of the official National Testing Agency (NTA) computer-based test environment.
- **Sectional Structure**:
  - **Section A**: Multiple Choice Questions (Single Correct Option).
  - **Section B**: Numerical Value Questions with on-screen virtual integer/decimal keypad.
- **Standard Question Palette**:
  - ⚪ **Not Visited**: Question not yet opened.
  - 🔴 **Not Answered**: Visited but no option chosen.
  - 🟢 **Answered**: Option selected and saved.
  - 🟣 **Marked for Review**: Marked without saving an answer.
  - 🟣🟢 **Answered & Marked for Review**: Evaluated for scoring unless cleared.
- **Action Controls**: *Save & Next*, *Clear Response*, *Mark for Review & Next*, *Previous/Next*, and *Submit Test*.
- **Live Examination Controls**: Auto-ticking countdown timer, remaining time threshold warnings, question paper bird's-eye overview modal, and exam instructions.

### 2. 🧮 KaTeX Mathematical & Chemical Formula Engine
- Seamless inline math (`$...$`) and display equation (`$$...$$`) rendering via KaTeX.
- Enhanced matrix, fraction, radical, limit, integral, chemical bond, and scientific notation typesetting.
- Automatic sanitation and normalization of raw ASCII/LaTeX strings.

### 3. 📐 Dynamic SVG & Interactive Circuit Renderer
- Built-in SVG procedural diagram engine for physics circuits and geometry.
- Five-tier asset resolution pipeline (`VisualAssetResolver` and `VisualAssetEngine`):
  - Procedural Wheatstone bridge circuits (e.g., node analysis, symmetry networks).
  - Ray optics and lens configurations.
  - Mechanics and coordinate vectors.
  - Embedded SVG vectors and fallback diagrams.

### 4. 🔒 Zero-Leakage Student Test Security
- `StudentQuestionSerializer` strips correct options, numerical solutions, explanatory hints, and internal evaluation flags before dispatching exam payloads to the client.
- Questions rendered in the active test DOM cannot be inspected via browser DevTools to extract correct answers.
- Anti-tampering score evaluation performed client-side upon test submission or validated against the server.

### 5. ⚡ Adaptive Test Generation Engine
- **Preset Test Templates**:
  - **JEE Main Full Mock**: 90 questions (30 Physics, 30 Chemistry, 30 Math) with Section A (20 MCQs) and Section B (10 Numericals, attempt any 5 rule supported).
  - **Subject-Specific Mock**: Dedicated tests focused on Physics, Chemistry, or Mathematics.
  - **Custom Topic / Chapter Test**: Granular selection across 60+ individual chapters with configurable difficulty ratios (Easy, Medium, Hard) and custom time limits.
- **Smart Duplicate Prevention**: Tracks student question history to minimize repeat questions across successive mocks.

### 6. 📊 Deep Diagnostics & Mistake Retest Suite
- **Granular Score Reports**: Instant breakdown of raw score, percentage, estimated percentile, total attempted, accuracy rate, and net penalty deductions.
- **Subject & Section Matrices**: Separate scorecards for Physics, Chemistry, and Mathematics, broken down by MCQ and Numerical performance.
- **Time Analytics**: Mean time spent on correct vs. incorrect vs. unattempted questions to identify time sinks and speed traps.
- **Step-by-Step Solutions**: Comprehensive post-exam solution walk-throughs with detailed derivations and diagrammatic references.
- **One-Click Mistake Retest**: Instantly spins up a targeted re-test containing only the questions missed or skipped in the current test.

### 7. 📚 Question Bank Admin & Explorer
- Searchable directory of **5,263 genuine questions**:
  - **Physics**: 1,753 questions across Kinematics, Current Electricity, Optics, Modern Physics, Thermodynamics, etc.
  - **Chemistry**: 1,863 questions across Organic, Inorganic, and Physical Chemistry.
  - **Mathematics**: 1,647 questions across Calculus, Algebra, Coordinate Geometry, Vectors & 3D, and Trigonometry.
- Filter by Subject, Chapter, Difficulty level, and Question type.
- Verification badges for questions with mathematical notation and diagram assets.

### 8. 🌐 Hybrid Deployment Architecture (Vercel & Full-Stack Ready)
- **Dual-Engine Operation**:
  - **Full-Stack Mode**: Express backend (`server.ts` or `createApp.ts`) providing persistent JSON database storage, test session storage, and REST API endpoints.
  - **Serverless Mode (Vercel)**: `api/index.ts` serverless function handler mapped via `vercel.json`.
  - **Resilient Static Fallback**: Automated pre-build script (`sync-question-bank.ts`) synchronizes all question data and generates a statically hosted `manifest.json` under `public/question-bank/`. If the backend API cannot be reached or runs in a serverless cold state, the frontend transparently falls back to static manifest chunking and local browser caching (`localStorage`/IndexedDB) so tests load instantly without server interruption.

---

## 🏗️ Project Architecture & Directory Structure

```plaintext
├── api/
│   └── index.ts                 # Vercel serverless function entry point
├── data/
│   └── jee-platform-db.json     # Local persistent database (users, test histories, state)
├── public/
│   └── question-bank/           # Statically served question data & generated manifest
├── question-bank/               # Master question repository (categorized by subject)
│   ├── chemistry/               # Chemistry chapter JSON files
│   ├── mathematics/             # Mathematics chapter JSON files
│   └── physics/                 # Physics chapter JSON files
├── scripts/
│   ├── sync-question-bank.ts    # Build script: compiles manifest and copies files to public/
│   ├── validate-question-bank.ts# Verification script for question schema & integrity
│   └── test-math-rendering-suite.ts # KaTeX verification test runner
├── src/
│   ├── components/
│   │   ├── AnalyticsDashboardView.tsx # Chapter mastery, long-term performance trends
│   │   ├── ChapterSelectorView.tsx    # Chapter selector with weights & question counters
│   │   ├── ExamWorkspaceView.tsx      # NTA CBT Exam Interface & live examination runtime
│   │   ├── LandingDashboardView.tsx   # Test configuration and generator dashboard
│   │   ├── MathText.tsx               # High-performance KaTeX math text component
│   │   ├── Navbar.tsx                 # Navigation header and active test indicators
│   │   ├── QuestionBankAdminView.tsx  # Question explorer, search, and inspector
│   │   ├── TestHistoryView.tsx        # Historical exam scores and records
│   │   ├── TestOverviewModal.tsx      # Question paper overview dialog
│   │   ├── TestResultsView.tsx        # Detailed test evaluation, scorecard & solution review
│   │   └── VisualDiagramRenderer.tsx  # Dynamic SVG diagram & circuit generator
│   ├── data/
│   │   └── questionBankManifest.ts    # Generated manifest type definitions & constants
│   ├── server/
│   │   ├── createApp.ts               # Core Express app factory (used by dev, prod & Vercel)
│   │   └── seedQuestionBank.ts        # Database bootstrapping and initial dataset seeder
│   ├── services/
│   │   ├── LongTermAnalyticsService.ts   # Multi-test progression and mastery calculations
│   │   ├── MathRendererService.ts        # Formula parsing, regex delimiters, and KaTeX calls
│   │   ├── QuestionBankEngine.ts         # In-memory question indexing, filtering & search
│   │   ├── QuestionBankService.ts        # Resilient multi-source question loader (API + Static)
│   │   ├── ScoringAndAnalyticsService.ts # Standard JEE scoring logic (+4/-1) & metrics
│   │   ├── StudentQuestionSerializer.ts  # Redacts solutions/answers for student privacy
│   │   ├── TestGeneratorService.ts       # Algorithm for balanced test paper synthesis
│   │   ├── VisualAssetEngine.ts          # Procedural SVG diagram templates
│   │   └── VisualAssetResolver.ts        # Asset matching pipeline
│   ├── types/
│   │   └── jee.ts                     # Core TypeScript schemas, enums, and data contracts
│   ├── App.tsx                        # Root application shell, state management & routing
│   ├── index.css                      # Tailwind CSS imports and custom utility styles
│   └── main.tsx                       # React DOM entry point
├── server.ts                          # Standalone Node.js server entry point
├── vercel.json                        # Vercel deployment routes and serverless configuration
├── vite.config.ts                     # Vite build configuration with Tailwind and React plugins
├── package.json                       # Dependencies, scripts, and project metadata
└── tsconfig.json                      # TypeScript configuration
```

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Modern functional components, hooks, high responsiveness |
| **Language** | **TypeScript 5.8+** | Strict type safety across client and server boundaries |
| **Styling & Design** | **Tailwind CSS v4** | Clean, responsive UI optimized for high-density exam layouts |
| **Mathematical Typesetting** | **KaTeX** | Ultra-fast LaTeX formula and chemical equation rendering |
| **Icons & Visuals** | **Lucide React** | Clean, accessible iconography |
| **Motion & Transitions** | **Motion** | Fluid modal and palette animations |
| **Bundler & Tooling** | **Vite 6** | Instant HMR in development, optimized rollup production builds |
| **Backend & API** | **Express 4 & tsx** | REST API for test storage, generation, and question queries |
| **Deployment Target** | **Vercel / Node.js** | Native support for Vercel Serverless Functions + Static SPA |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd react-example
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   The local application will be available at `http://localhost:3000`.

---

## 📦 Build & Deployment

### Building for Production
The build script automatically runs `sync-question-bank.ts` before compiling the Vite bundle:
```bash
npm run build
```
This ensures:
1. All question bank files are mirrored into `public/question-bank/`.
2. A typed manifest (`src/data/questionBankManifest.ts` and `public/question-bank/manifest.json`) is generated with file checksums, chapter mappings, and question tallies.
3. The production bundle is compiled into the `dist/` directory.

### Deploying to Vercel
This repository is configured for one-click deployment on **Vercel**:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **API Routing**: Configured via `vercel.json` and `api/index.ts`. All `/api/*` requests route directly to the Express application running inside a Vercel Serverless Function, while static assets and question bank JSON files are served globally via Vercel's Edge CDN.

### Deploying with Node.js / Docker
To run as a persistent Node.js server:
```bash
npm run build
npm run start
```

---

## 🧪 Testing & Validation Utilities

- **Question Bank Validation**:
  ```bash
  npx tsx scripts/validate-question-bank.ts
  ```
  Validates question schemas, option integrity, answer keys, and LaTeX syntax across all 5,263 questions.

- **Mathematical Rendering Suite**:
  ```bash
  npx tsx scripts/test-math-rendering-suite.ts
  ```
  Tests LaTeX equations, delimiters, and KaTeX rendering edge cases.

- **TypeScript Compilation Check**:
  ```bash
  npm run lint
  ```

---

## 📝 License

This project is created for educational preparation and JEE examination practice. All question content is curated for examination simulation purposes.
