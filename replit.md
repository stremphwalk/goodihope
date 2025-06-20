# Overview

This is AriNote, a medical documentation platform that helps healthcare providers generate comprehensive medical notes efficiently. The application combines a React frontend with a Node.js/Express backend, featuring AI-powered medication extraction from images, comprehensive medical form processing, and multi-language support (English/French).

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context for language preferences, React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with hot module replacement

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints with JSON responses
- **File Processing**: Image processing for medication extraction
- **AI Integration**: Multiple AI providers (Anthropic Claude, Google Gemini)

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL via Neon Database serverless
- **Schema**: User management and medical note storage
- **Migrations**: Drizzle Kit for schema management

# Key Components

## Medical Documentation System
- **Review of Systems (ROS)**: Comprehensive medical system review interface
- **Physical Examination**: Structured physical exam documentation
- **Laboratory Results**: Lab value entry and interpretation
- **Medication Management**: Home and hospital medication tracking
- **Note Generation**: AI-powered medical note creation

## AI-Powered Features
- **Medication Extraction**: OCR and AI parsing of medication lists from images
- **Intelligent Form Processing**: Context-aware medical documentation
- **Multi-language Support**: English and French medical terminology

## User Interface Components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA-compliant form controls and navigation
- **Component Library**: shadcn/ui for consistent UI patterns
- **Form Handling**: React Hook Form with Zod validation

# Data Flow

## Medical Note Creation Process
1. User selects note type (Admission, Progress, Consultation, ICU variants)
2. Structured form collection for relevant medical systems
3. Medication list compilation (manual entry + image extraction)
4. AI-powered note generation with medical terminology
5. Review and export of formatted medical documentation

## Medication Processing Pipeline
1. Image upload and base64 encoding
2. OCR text extraction via Google Cloud Vision
3. AI-powered medication parsing (Claude/Gemini)
4. Medication database matching for standardization
5. Integration into medical note context

## Internationalization Flow
- Context-based language switching (English ↔ French)
- Medical terminology translation for generated notes
- Locale-specific formatting for dates and measurements

# External Dependencies

## AI Services
- **Anthropic Claude**: Primary AI for medication extraction and note generation
- **Google Gemini**: Secondary AI provider for text processing
- **Google Cloud Vision**: OCR service for image text extraction

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations

## UI/UX Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for medical and general use

## Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundler for production

# Deployment Strategy

## Development Environment
- **Replit Integration**: Direct development environment support
- **Hot Module Replacement**: Instant feedback during development
- **Environment Variables**: Secure API key management

## Production Build
- **Static Generation**: Vite builds optimized static assets
- **Server Bundle**: ESBuild creates production server bundle
- **Asset Optimization**: Automatic code splitting and minification

## Hosting Configuration
- **Railway Deployment**: Configured for Railway cloud platform deployment
- **Docker Support**: Dockerfile and .dockerignore for containerized deployment
- **Port Configuration**: Dynamic port assignment via PORT environment variable
- **Static Assets**: Efficient serving of built frontend assets
- **Health Checks**: Built-in health monitoring endpoint at /health

# Changelog

Changelog:
- June 15, 2025. Initial setup
- June 17, 2025. Added comprehensive Dot Phrase Manager with CRUD functionality, integrated custom phrases with existing textarea component, enhanced navigation with improved logo, removed medications section, fixed main page UI layout issues after Git merge
- June 17, 2025. Fixed tab layout system with responsive grid design, applied consistent spacing to all tab content areas, reorganized tab order for better medical workflow, improved overall UI consistency and user experience
- June 17, 2025. Implemented comprehensive professional UI overhaul: transformed from cartoonish to clean medical software design, removed gradients and excessive rounded corners, applied monochromatic theme with professional medical component styling, enhanced typography and spacing for clinical appearance
- June 18, 2025. Integrated new sidebar-based MainLayout with professional medical styling, standardized all submenu sections with consistent SectionWrapper component, applied uniform visual structure across all note types (HPI, ROS, PMH, Labs, etc.), maintained professional medical software aesthetic while ensuring UI consistency
- June 18, 2025. Fixed note preview panel positioning to remain static on far right side (384px fixed width), standardized all submenu sections to use full available space between sidebar and preview panel with calc(100vh - 120px) height, eliminated layout jumping and ensured consistent professional medical interface
- June 19, 2025. Completed migration from Replit Agent to standard Replit environment, configured Railway deployment with Docker support, health checks, and production optimization. Added comprehensive deployment documentation and environment configuration files.
- June 19, 2025. Fixed critical Railway deployment issues: resolved medication CSV file loading with embedded data fallback for production, optimized Google Cloud Vision API initialization, enhanced health check endpoint with comprehensive status reporting, improved Docker configuration with production environment variables and reduced health check timeout to 60 seconds.
- June 19, 2025. Fixed typing issues across all text input components: resolved React re-rendering causing focus loss and one-character input limitation, applied useCallback optimization to prevent unnecessary re-renders in PastMedicalHistorySection, ImpressionSection, ChiefComplaintSection, and DotPhraseTextarea components, resolved TypeScript compilation errors, ensuring smooth text input experience throughout the medical documentation platform.
- June 19, 2025. Completed PMH section typing fix with stable callback references: implemented useRef pattern to maintain stable onChange handlers, removed problematic dependency arrays causing component recreation, optimized both main condition and sub-entry input handlers to prevent focus loss, ensuring users can type normally without one-character limitations in Past Medical History section.
- June 19, 2025. Completely rebuilt PastMedicalHistorySection from scratch: created new StableInput component with proper memoization, implemented stable callback references using function factories, applied functional state updates throughout to prevent stale closures, maintained all existing features including drag/drop functionality and multi-language support while eliminating all typing performance issues.
- June 20, 2025. Resolved critical text input focus and usability issues: eliminated live updates in favor of blur-based updates to prevent focus loss, implemented comprehensive StableInput component with scroll position preservation, added auto-expansion for sub-entry fields, enhanced click reliability with explicit focus handling and event management, ensuring smooth typing experience across all medical documentation sections without interruption or scroll jumping.

# User Preferences

Preferred communication style: Simple, everyday language.