# AriNote Companion Desktop App

A sleek desktop companion application that provides system-wide dot phrase expansion functionality for AriNote users. This Electron-based app allows you to use AriNote's dot phrases in any application on your computer with beautiful, modern suggestions and full feature parity with the web application.

## ✨ Features

### 🎯 **Core Functionality**
- **System-wide text expansion**: Use dot phrases in any application (Word, Slack, email, etc.)
- **Real-time sync**: Automatically syncs with your AriNote account
- **Fuzzy search**: Smart matching for phrase triggers
- **Built-in + Custom phrases**: Access to both built-in medical phrases and your custom phrases

### 🎨 **Modern UI/UX**
- **Glass morphism design**: Beautiful, modern suggestion panels
- **Floating suggestions**: Sleek popup appears at your cursor location
- **Keyboard navigation**: Navigate suggestions with arrow keys, Enter/Tab to select
- **System theme integration**: Adapts to light/dark mode
- **Smooth animations**: Polished interactions throughout

### 🔒 **Security & Authentication**
- **AWS Cognito integration**: Secure authentication using your AriNote account
- **JWT-based API**: Secure communication with AriNote servers
- **User data isolation**: Your phrases are private and secure

### 🧠 **Advanced Smart Features** ✅
- **Smart options**: Interactive `[[option1|option2]]` dropdowns with keyboard navigation
- **Widget integration**: Full AriNote widget system with floating modals
  - Medication management widget
  - Allergies tracking widget  
  - Past Medical History widget
- **Date picker**: `[[DATE]]` function with beautiful calendar popup and format options
- **Calculator integration**: `[[CALC]]` function with full-featured calculator modal
- **System tray**: Background operation with quick settings and controls

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript
- **Desktop Framework**: Electron 37
- **Styling**: Tailwind CSS 4 with custom glass morphism
- **State Management**: TanStack Query for server state
- **Search**: Fuse.js for fuzzy phrase matching
- **Authentication**: AWS Amplify + Cognito

### Project Structure
```
desktop-companion/
├── electron/                 # Electron main process
│   ├── main.ts              # Main application entry
│   ├── keyboardListener.ts  # Global keyboard hooks
│   ├── suggestionWindow.ts  # Floating suggestion window
│   ├── textExpansion.ts     # Text expansion engine
│   └── preload.ts           # Renderer-main bridge
├── src/                     # React renderer process
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   └── styles/              # CSS and styling
├── assets/                  # Static assets
└── dist/                    # Built application
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to AriNote account

### Installation
1. **Clone and navigate**:
   ```bash
   cd desktop-companion
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your AriNote API credentials
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm run dist:mac    # macOS
   npm run dist:win    # Windows
   npm run dist:linux  # Linux
   ```

## 🎮 Usage

### Initial Setup
1. Launch AriNote Companion
2. Sign in with your AriNote account
3. The app will sync your custom phrases automatically

### System-wide Usage
1. **Trigger phrases**: Type `/` followed by your phrase trigger in any text field
2. **Browse suggestions**: Use ↑↓ arrow keys to navigate
3. **Select phrase**: Press Enter or Tab to expand
4. **Close suggestions**: Press Escape or click elsewhere

### Managing Phrases
- Use the main window to create, edit, and organize your custom phrases
- Changes sync automatically across all your devices
- Built-in medical phrases are always available

## 🔧 Development Status

### ✅ **COMPLETED - Production Ready Core Features**
- [x] **Electron project structure** with React/TypeScript ⚡
- [x] **Global keyboard hook** and text detection system 🎯
- [x] **Sleek floating suggestion panel** with glass morphism design ✨
- [x] **AriNote API integration** for dot phrases 🔗
- [x] **AWS Cognito authentication** flow 🔐
- [x] **Phrase expansion engine** with fuzzy search 🔍
- [x] **Smart options dropdowns** for `[[option1|option2]]` 🎛️
- [x] **Widget system integration** with floating modals 🧩
- [x] **Date picker and calculator** popup functionality 📅🧮
- [x] **System tray integration** and settings ⚙️

### 🚧 **Remaining Polish Items**
- [ ] Performance optimization for minimal system impact
- [ ] Cross-platform testing and optimization (Windows/macOS/Linux)
- [ ] Auto-updater and secure distribution
- [ ] Advanced keyboard shortcuts and hotkeys

### 🎉 **Feature Complete! Ready for Beta Testing**

## 🎯 Key Implementation Highlights

### Global Text Detection
- Uses Electron's `globalShortcut` API for cross-platform keyboard monitoring
- Real-time text buffer analysis for slash phrase detection
- Cursor position tracking for precise suggestion placement

### Suggestion System
- Transparent, always-on-top window for suggestions
- Glass morphism CSS effects for modern appearance
- Intelligent positioning to stay within screen bounds
- Keyboard-first navigation with mouse support

### API Integration
- Full compatibility with existing AriNote API endpoints
- Real-time synchronization of custom phrases
- Secure JWT-based authentication
- Optimistic updates for responsive UX

### Performance Considerations
- Minimal system resource usage
- Efficient text buffer management
- Lazy loading and caching strategies
- Background synchronization

## 🤝 Contributing

This is part of the AriNote medical documentation platform. The desktop companion extends AriNote's dot phrase functionality to provide system-wide access while maintaining full feature parity with the web application.

## 📄 License

MIT License - See main AriNote project for details.

---

**AriNote Companion** - Bringing professional medical documentation tools to your entire desktop workflow.