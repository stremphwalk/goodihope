# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AriNote is a medical documentation platform built as a full-stack TypeScript application. It helps healthcare providers generate professional medical notes using AI-powered features including medication extraction, OCR processing, and intelligent form handling.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs server with tsx)
- `npm run build` - Build for production (Vite client + esbuild server)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Database Management
- `npm run db:push` - Push schema changes to database using Drizzle Kit

## Architecture

### Project Structure
This is a monolithic full-stack application with the following key directories:
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared types and database schema (Drizzle ORM)
- `migrations/` - Database migration files

### Client Architecture
- **Framework**: React 18 with TypeScript and Vite
- **Routing**: Wouter for client-side routing
- **State Management**: React Query for server state
- **UI Components**: shadcn/ui built on Radix UI + Tailwind CSS
- **Authentication**: AWS Cognito via react-oidc-context
- **Key Aliases**: `@/` points to `client/src/`, `@shared` to `shared/`

### Server Architecture
- **Framework**: Express.js with TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Anthropic Claude, Google Gemini, Google Cloud Vision
- **Security**: Rate limiting, CORS, security headers, input validation
- **Development**: Hot reload with tsx, production build with esbuild

### Database Schema
Main entities defined in `shared/schema.ts`:
- **users** - User authentication and profiles
- **dotPhrases** - User-defined text shortcuts/templates
- **templates** - Medical note templates with versioning
- **rosNotes** - Review of Systems notes with patient data
- **templateUsage** - Template usage tracking

### Key Features
- **Medical Documentation**: ROS, physical exam, lab results, medications
- **AI-Powered**: OCR for medication extraction, intelligent form processing
- **Multi-language**: English/French medical terminology support
- **Security**: HIPAA-conscious design with rate limiting and secure headers

### Environment Requirements
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - For Claude AI integration
- `GEMINI_API_KEY` - For Google Gemini AI
- `GOOGLE_APPLICATION_CREDENTIALS` - JSON service account for Vision API
- `NODE_ENV` - development/production

### Development Notes
- Server runs on port 5001 in development
- Vite dev server proxies API requests to Express backend
- Database migrations managed through Drizzle Kit
- Security middleware applied before all routes
- Health check endpoint at `/health` for deployment monitoring