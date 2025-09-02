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
  - OpenAI Realtime API for natural voice conversations
  - Real-time bidirectional audio streaming with interruption support
  - Live transcription of both user and AI speech

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
- **pages/Chat.jsx**: Main chat interface with text and voice mode support
- **pages/APIKeys.jsx**: API key management for OpenAI integration
- **api/entities.js**: Local storage-backed entities for Projects, Chats, Messages, and Prompts
- **api/storage.js**: Storage abstraction layer using localStorage
- **api/integrations.js**: OpenAI API integration for chat completions
- **components/chat/VoiceMode.jsx**: Real-time voice chat interface using OpenAI Realtime API
- **components/chat/SettingsPanel.jsx**: Chat and voice settings configuration

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

## Voice Mode Features

### Overview
The voice mode provides natural, real-time voice conversations with AI using OpenAI's Realtime API. Users can speak naturally and interrupt the AI at any time, similar to ChatGPT's Advanced Voice Mode.

### Key Features
- **Real-time Conversation**: Natural back-and-forth dialogue with low latency
- **Interruption Support**: Users can interrupt the AI mid-response
- **Live Transcription**: Both user and AI speech are transcribed and displayed in the chat
- **Multiple Voices**: Choose from 8 different AI voices (Alloy, Ash, Ballad, Coral, Echo, Sage, Shimmer, Verse)
- **Customizable Settings**: Adjust temperature, VAD threshold, silence duration, and system instructions
- **Auto-Reconnection**: Automatically reconnects on unexpected disconnections
- **Memory Protection**: Limits conversation to 100 messages to prevent memory issues
- **Error Recovery**: Graceful handling of WebSocket errors and audio playback issues
- **Conversation Management**: Clear button to reset conversation history without disconnecting

### Technical Implementation
- **WebSocket Connection**: Uses OpenAI Realtime API WebSocket endpoint with automatic reconnection
- **Audio Processing**: Real-time PCM16 audio encoding/decoding at 24kHz
- **Voice Activity Detection (VAD)**: Server-side VAD for automatic turn detection
- **Audio Context**: Web Audio API for audio capture and playback with automatic recovery
- **State Management**: React hooks for connection, transcription, and error state
- **Memory Management**: Limits active audio sources and conversation length to prevent crashes
- **Error Handling**: Graceful recovery from connection losses and API errors

### Configuration
Voice settings are managed through the Settings Panel and include:
- Voice model selection (gpt-4o-realtime-preview or gpt-4o-mini-realtime-preview)
- Voice personality selection
- Temperature control for response creativity
- VAD threshold for speech detection sensitivity
- Silence duration before AI responds
- Custom system instructions

### API Key Management
- OpenAI API key is stored in localStorage (key: `OPENAI_API_KEY`)
- Configured through the API Keys page
- Voice mode checks for API key presence before connecting
- Note: Realtime API access requires specific OpenAI account permissions

### Voice Mode UI Controls
- **Phone Icon**: Start voice mode from chat input bar
- **Mute/Unmute Button**: Toggle microphone input
- **Test Button**: Send test message to verify connection
- **Send Button**: Manually commit audio buffer and trigger response
- **Clear Button**: Reset conversation history without disconnecting
- **End Call Button**: Disconnect and close voice mode

### Visual Indicators
- **Connection Status**: Shows current state (Connecting, Ready, Listening, Processing, etc.)
- **Message Counter**: Displays number of messages in current session
- **Wave Visualizer**: Animated bars showing audio activity
- **Voice Badge**: Italic text styling for voice messages with microphone icon
- **Live Transcription**: Real-time display of current speech being processed

### Error Handling & Recovery
- **Automatic Reconnection**: Reconnects after unexpected disconnections
- **Session Limits**: Auto-disconnects after 100 messages to prevent memory issues
- **Error Recovery**: Handles WebSocket errors without crashing
- **Audio Context Recovery**: Automatically recreates audio context on errors
- **Graceful Degradation**: Shows clear error messages and recovery status