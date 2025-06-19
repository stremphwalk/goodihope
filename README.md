# AriNote - Medical Documentation Platform

A comprehensive medical documentation platform that helps healthcare providers generate professional medical notes efficiently using AI-powered features.

## Features

### 🏥 Medical Documentation
- **Review of Systems (ROS)**: Comprehensive medical system review interface
- **Physical Examination**: Structured physical exam documentation
- **Laboratory Results**: Lab value entry and interpretation
- **Medication Management**: Home and hospital medication tracking
- **Note Generation**: AI-powered medical note creation

### 🤖 AI-Powered Features
- **Medication Extraction**: OCR and AI parsing of medication lists from images
- **Intelligent Form Processing**: Context-aware medical documentation
- **Multi-language Support**: English and French medical terminology

### 🎨 Professional Interface
- **Responsive Design**: Mobile-first approach optimized for clinical workflows
- **Accessibility**: ARIA-compliant form controls and navigation
- **Medical-Grade UI**: Clean, professional interface designed for healthcare environments

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Wouter** for client-side routing
- **React Query** for server state management
- **Vite** for fast development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **Drizzle ORM** with PostgreSQL
- **AI Integration**: Anthropic Claude, Google Gemini, Google Cloud Vision

### Deployment
- **Railway** optimized deployment
- **Docker** containerization support
- **Health monitoring** and auto-scaling

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- API keys for AI services

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/arinote
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
NODE_ENV=development
```

### Installation
```bash
npm install
npm run db:push  # Set up database schema
npm run dev      # Start development server
```

### Production Build
```bash
npm run build    # Build for production
npm run start    # Start production server
```

## Deployment

### Railway (Recommended)
1. Connect this repository to Railway
2. Add PostgreSQL database service
3. Set environment variables
4. Deploy automatically

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

### Docker
```bash
docker build -t arinote .
docker run -p 5000:5000 --env-file .env arinote
```

## API Documentation

### Health Check
```
GET /health
```
Returns application health status.

### Medical Notes API
- `POST /api/notes` - Create medical note
- `GET /api/notes` - List user notes
- `DELETE /api/notes/:id` - Delete note

### Medication Extraction
- `POST /api/medications/extract` - Extract medications from image

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For deployment and technical support:
- Check the documentation in `RAILWAY_DEPLOYMENT.md`
- Review server logs for troubleshooting
- Verify all environment variables are correctly set

---

Built for healthcare professionals who need efficient, accurate medical documentation.