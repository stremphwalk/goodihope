# AriNote.co - Medical Documentation Platform

Build a comprehensive medical documentation platform that helps healthcare providers generate professional medical notes efficiently using AI-powered features.

## Project Overview

AriNote is a full-stack TypeScript application designed specifically for healthcare professionals. It features an intelligent medical note generation system with AI-powered OCR, medication extraction, and multi-language support for English and French medical terminology.

## Core Architecture

### Frontend Stack
- **React 18** with TypeScript and strict type checking
- **Vite** for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **React Query** for efficient server state management and caching
- **Tailwind CSS** with shadcn/ui component library
- **Framer Motion** for smooth animations and transitions

### Backend Stack
- **Node.js** with Express.js (ESM modules)
- **TypeScript** with esbuild for fast compilation
- **Drizzle ORM** with PostgreSQL database
- **AI Integration**: Anthropic Claude, Google Gemini, Google Cloud Vision API
- **Security**: Helmet, CORS, rate limiting, input validation
- **WebSocket** support for real-time features

### Database Schema
```typescript
// Key entities (simplified)
users: { id: uuid, email: text, name: text, customIdentifier: text }
dotPhrases: { id: serial, userId: uuid, trigger: text, content: text }
templates: { id: serial, userId: uuid, name: text, content: jsonb }
rosNotes: { id: serial, userId: uuid, selections: jsonb, generatedNote: text }
```

## Key Features to Implement

### 1. Medical Documentation Hub
Create a comprehensive review of systems interface with:
- **Tabbed Navigation**: Note Type, PMH, Allergies & Social, HPI, Medications, ROS, Impression, Labs, Imagery
- **Smart Keyboard Navigation**: Tab key cycles through sections
- **Real-time Live Preview**: Updates note as user fills sections
- **Note Type Selection**: Admission, Progress, Consultation, Custom notes
- **Multi-language Support**: English/French medical terminology

### 2. Past Medical History (PMH) Editor
Build an intelligent PMH editor with:
- **Smart Text Processing**: Parse medical conditions and context
- **Auto-formatting**: Convert user input to proper medical format
- **Chip Bar**: Quick insert common conditions
- **Focus Management**: Maintain cursor position during edits
- **Live Preview Sync**: Update generated note on blur events

### 3. Medication Management System
Implement comprehensive medication handling:
- **OCR Integration**: Extract medications from prescription images
- **AI-Powered Parsing**: Use Google Vision + Claude for accurate extraction
- **Dual Lists**: Home medications vs Hospital medications
- **Smart Autocomplete**: Canadian medication database integration
- **Dosage Formatting**: Intelligent parsing of dosages and frequencies

### 4. Laboratory Results Interface
Create advanced lab value management:
- **Smart Categorization**: Automatically group related tests
- **Reference Ranges**: Display normal/abnormal indicators
- **Trending Analysis**: Track values over time
- **Image Upload**: OCR support for lab reports
- **Custom Panels**: User-defined test groupings

### 5. AI-Powered Note Generation
Implement intelligent note creation:
- **Template System**: Pre-built and custom note templates
- **Context-Aware Generation**: Use Claude API for medical note formatting
- **Multi-language Output**: Support English and French medical notes
- **Real-time Updates**: Live preview updates as sections are filled
- **Professional Formatting**: EHR-compatible output

### 6. Authentication & User Management
Build secure user system:
- **JWT Authentication**: Secure token-based auth
- **User Profiles**: Custom identifiers and preferences
- **Data Persistence**: Save drafts and templates
- **Team Collaboration**: Group functionality for medical teams

## Technical Implementation Details

### Development Scripts
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --bundle --platform=node --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js",
  "check": "tsc"
}
```

### Project Structure
```
├── client/src/
│   ├── components/          # React components
│   │   ├── pmh/            # PMH editor components
│   │   ├── ui/             # shadcn/ui components
│   │   └── widgets/        # Reusable medical widgets
│   ├── pages/              # Main application pages
│   ├── lib/                # Utility functions and API clients
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript definitions
├── server/
│   ├── index.ts            # Express server setup
│   ├── routes.ts           # API route definitions
│   ├── database.ts         # Database connection
│   └── middleware/         # Security and auth middleware
├── shared/
│   └── schema.ts           # Drizzle database schema
└── migrations/             # Database migrations
```

### Key Components to Build

#### 1. PMHEditor Component
```tsx
interface PMHEditorProps {
  initialValue?: string;
  onChange?: (raw: string, items: PMHItem[], rendered: string) => void;
  onBlur?: () => void;
  preferences?: Partial<PMHPreferences>;
}

// Features:
// - Smart text parsing and formatting
// - Autocomplete for medical conditions
// - Chip bar for quick condition insertion
// - Focus management without re-renders
// - Live preview updates on blur
```

#### 2. MedicationSection Component
```tsx
interface MedicationSectionProps {
  homeMedications: Medication[];
  hospitalMedications: Medication[];
  onHomeMedicationsChange: (meds: Medication[]) => void;
  onHospitalMedicationsChange: (meds: Medication[]) => void;
}

// Features:
// - Image upload with OCR extraction
// - Smart medication parsing
// - Dosage and frequency formatting
// - Drug interaction checking
```

#### 3. TemplateAwareLivePreview Component
```tsx
interface LivePreviewProps {
  noteData: Record<string, any>;
  note: string;
  onNoteChange: (note: string) => void;
  generatedNote: string;
}

// Features:
// - Real-time note generation
// - Professional medical formatting
// - Copy to clipboard functionality
// - Template-based generation
```

### Database Integration
Use Drizzle ORM with PostgreSQL:
```typescript
// Example schema definitions
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  customIdentifier: text("custom_identifier").unique(),
});

export const rosNotes = pgTable("ros_notes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  patientName: text("patient_name"),
  selections: jsonb("selections").notNull(),
  generatedNote: text("generated_note").notNull(),
});
```

### AI Integration Setup
```typescript
// Anthropic Claude for note generation
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Google Cloud Vision for OCR
import vision from '@google-cloud/vision';
const visionClient = new vision.ImageAnnotatorClient();

// Google Gemini for medication parsing
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

### Environment Variables Required
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/arinote
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
NODE_ENV=development
```

## UI/UX Design Requirements

### Color Scheme
- **Primary**: Medical blue (#0066cc)
- **Secondary**: Green for positive actions (#10b981)
- **Warning**: Orange for alerts (#f59e0b)
- **Error**: Red for errors (#ef4444)
- **Background**: Clean whites and light grays

### Layout Structure
- **Header**: Navigation with logo, user profile, language toggle
- **Main**: Tabbed interface for different note sections
- **Sidebar**: Live preview of generated note
- **Footer**: Status indicators and save actions

### Responsive Design
- **Desktop**: Full tabbed interface with live preview sidebar
- **Tablet**: Stacked layout with collapsible preview
- **Mobile**: Single-column with bottom preview panel

## Performance Requirements

### Client-Side Optimization
- **Code Splitting**: Lazy load page components
- **Image Optimization**: Compress medical images for OCR
- **Caching**: React Query for API response caching
- **Debouncing**: Prevent excessive API calls during typing

### Server-Side Optimization
- **Database Indexing**: Optimize queries for user data
- **API Rate Limiting**: Prevent abuse of AI services
- **Compression**: Gzip responses for faster loading
- **Health Monitoring**: Endpoint for deployment monitoring

## Security Considerations

### Data Protection
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Protection**: Escape outputs and use CSP headers
- **HIPAA Compliance**: Secure handling of medical data

### Authentication Security
- **JWT Tokens**: Secure token generation and validation
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent brute force attacks
- **CORS Configuration**: Restrict cross-origin requests

## Deployment Configuration

### Production Build
```bash
npm run build  # Creates optimized production bundle
npm run start  # Starts production server on port 5001
```

### Docker Support
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "start"]
```

### Health Check Endpoint
```typescript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Testing Requirements

### Unit Testing
- Component rendering tests
- Utility function tests
- API endpoint tests
- Database query tests

### Integration Testing
- Full user workflow tests
- AI service integration tests
- Database migration tests
- Authentication flow tests

### E2E Testing
- Complete note creation workflow
- Medication extraction pipeline
- Multi-language functionality
- Cross-browser compatibility

## Development Guidelines

### Code Quality
- **TypeScript Strict Mode**: Enforce type safety
- **ESLint Configuration**: Consistent code formatting
- **Component Structure**: Follow React best practices
- **Error Handling**: Comprehensive error boundaries

### Git Workflow
- **Feature Branches**: One feature per branch
- **Commit Messages**: Descriptive commit messages
- **Pull Requests**: Code review before merging
- **Version Control**: Semantic versioning for releases

### Documentation
- **API Documentation**: OpenAPI/Swagger for endpoints
- **Component Documentation**: JSDoc for components
- **Deployment Guide**: Step-by-step deployment instructions
- **User Manual**: Guide for healthcare professionals

This comprehensive medical documentation platform combines modern web technologies with specialized healthcare requirements to create an efficient, secure, and user-friendly tool for medical professionals.