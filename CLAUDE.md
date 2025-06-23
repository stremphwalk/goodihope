# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```
This starts the full-stack development server with hot reload for both frontend and backend.

**Build for production:**
```bash
npm run build
```
This builds the frontend with Vite and bundles the backend with esbuild.

**Start production server:**
```bash
npm run start
```

**Type checking:**
```bash
npm run check
```
Run TypeScript compiler in check mode to validate types across the entire codebase.

**Database schema updates:**
```bash
npm run db:push
```
Push database schema changes to PostgreSQL using Drizzle migrations.

## Architecture Overview

This is a full-stack medical documentation platform with the following structure:

### Frontend (`client/`)
- **React 18** with TypeScript and Vite
- **Wouter** for client-side routing (not React Router)
- **Tailwind CSS** with shadcn/ui components
- **React Query** (@tanstack/react-query) for server state management
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Express.js** with TypeScript and ESM modules
- **Drizzle ORM** with PostgreSQL
- **AI integrations:** Anthropic Claude, Google Gemini, Google Cloud Vision
- **Security:** Rate limiting, CORS, security headers implemented

### Database Schema (`shared/schema.ts`)
- Users, dot phrases, templates, template usage, and ROS notes tables
- Medication categorization system for clinical importance
- Uses Drizzle ORM with Zod validation schemas

### Key Features
- Medical note generation with AI assistance
- OCR medication extraction from images 
- Dot phrase management for clinical shortcuts
- Review of Systems (ROS) documentation
- Multi-language support (English/French)
- Template-based note creation

## Important Implementation Details

**Routing:** Uses Wouter, not React Router. Routes are defined in `client/src/App.tsx`.

**State Management:** React Query for server state, React context for UI state.

**Database:** PostgreSQL with Drizzle ORM. Schema changes require `npm run db:push`.

**AI Services:** Multiple providers (Anthropic, Google) with fallback mechanisms.

**Security:** Rate limiting is more restrictive for image processing endpoints (10 req/min vs 100 req/min for general API).

**File Structure:**
- `client/src/components/` - React components
- `client/src/pages/` - Page components 
- `client/src/lib/` - Utility functions and configurations
- `server/` - Backend API and services
- `shared/` - Shared types and database schema

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For Claude AI integration
- `GEMINI_API_KEY` - For Google Gemini integration
- `GOOGLE_APPLICATION_CREDENTIALS` - For Google Cloud Vision OCR

## Development Workflow

1. Ensure PostgreSQL database is running and accessible
2. Set up environment variables in `.env`
3. Run `npm install` to install dependencies
4. Run `npm run db:push` to set up database schema
5. Run `npm run dev` to start development server
6. Frontend served at development server root, API at `/api/*`

The application uses a monorepo structure with shared TypeScript configurations and integrated build processes.