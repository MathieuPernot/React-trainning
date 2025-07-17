# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (bound to 0.0.0.0 for external access)
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start production server (bound to 172.26.176.1)
- `npm run lint` - Run ESLint to check code quality

## Project Architecture

This is a Next.js application with a pages router structure that serves multiple interactive web experiences and games.

### Core Structure

- **Pages Router**: Uses Next.js pages directory with `_app.js` handling routing via react-router-dom
- **Client-Side Routing**: React Router DOM manages navigation between different game pages
- **Styling**: Mix of CSS modules, Tailwind CSS, and custom CSS files per page/component

### Key Applications

1. **Main Game (index.js)**: Ball-and-paddle game with DVD bouncer effects, score tracking, and localStorage leaderboard
2. **Perudo Game**: Multiplayer dice game with Firebase backend
   - Real-time multiplayer using Firestore
   - Component-based architecture in `src/perudo/`
   - Backend service in `src/perudo/backend/gameService.js`
   - Single room system (`perudo-room`)
3. **Mini-Games**: Various themed pages (foodtruck, gaben, samule, leak, test)

### Firebase Integration

- **Database**: Firestore for real-time multiplayer game state
- **Structure**: Games collection with single room document
- **Config**: Firebase configuration in `src/perudo/backend/config.js`

### Styling Architecture

- **Global Styles**: `src/styles/globals.css` for base styles
- **Page-Specific**: Individual CSS files per page (e.g., `gaben.css`, `foodtruck.css`)
- **Tailwind**: Custom theme with medieval colors and animations
- **Custom Fonts**: Digital font family and custom keyframe animations

### Component Organization

- **Shared Components**: `src/comp/` (DVDBouncer, WordLock, Ready)
- **Game Components**: `src/perudo/components/` (Game, Player, Dice, etc.)
- **Page Components**: Individual pages in `src/pages/`

### Development Notes

- **ESLint Config**: Ignores `src/perudo/**/*` directory
- **Client-Side Hydration**: Uses `isClient` state pattern for SSR compatibility
- **Touch Support**: Mobile-friendly touch handlers for games
- **Local Storage**: Persistent leaderboards and game state
- **Asset Management**: Static assets in `public/` including game images and audio

### Firebase Security

- Game service handles room creation, joining, and real-time updates
- Single room architecture with player reconnection support
- Host-based game management system