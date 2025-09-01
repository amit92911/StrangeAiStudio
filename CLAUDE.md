# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StrangeAI Studio is an AI prompt playground UI built with Vite + React. It runs independently without Base44 or any third-party backend by default, providing a local development environment for experimenting with AI interactions.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM v7
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Backend Integration**: Base44 SDK (entities, auth, serverless functions)
- **Voice Features**: 
  - Speech-to-Text: Deepgram live WebSocket
  - Text-to-Speech: Web Speech API (SpeechSynthesis)

### Project Structure

```
src/
├── api/           # API integrations and backend services
├── components/    # Reusable React components
│   ├── chat/      # Chat-specific components (ChatSettings, MessageBubble, VoiceMode)
│   ├── projects/  # Project management components  
│   ├── prompts/   # Prompt editing and management
│   └── ui/        # shadcn/ui base components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries and configurations
├── pages/         # Route-level page components (Chat, Projects, Prompts, APIKeys, Usage, Settings)
├── utils/         # Utility functions
└── pused/         # Additional utilities or experimental code
```

### Key Components

- **App.jsx**: Root component that renders the main Pages component and Toaster
- **pages/index.jsx**: Main routing configuration with React Router
- **pages/Layout.jsx**: Shared layout wrapper for all pages
- **api/entities.js**: Local storage-backed entities for Projects, Chats, Messages, and Prompts
- **api/storage.js**: Storage abstraction layer using localStorage

### Path Aliases

The project uses `@/` as an alias for the `src/` directory (configured in vite.config.js).

### Styling

- Tailwind CSS for utility-first styling
- shadcn/ui for consistent component design
- Custom CSS in `src/index.css` and `src/App.css`
- Uses `class-variance-authority` for component variants

### Development Notes

- ESLint configured with React, React Hooks, and React Refresh plugins
- Vite optimized for JSX in `.js` files
- Supports both `.js` and `.jsx` extensions
- Development server allows all hosts for flexibility