<!-- Copilot Instructions for Office Chore Tracker -->

# Project: Office Chore Tracker

## Overview
A React + Vite web/desktop app for managing office chores with recurring tasks, team assignment, and local storage persistence.

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Desktop**: Electron (optional)
- **Styling**: CSS3 with CSS variables
- **Icons**: Lucide React
- **State**: React Context API
- **Storage**: localStorage

## Project Structure
```
src/
├── components/          # Reusable React components
├── context/            # Global state (ChoreContext, NotificationContext)
├── pages/              # Full page components
├── styles/             # Component-scoped CSS
├── utils/              # Helper functions
└── main.tsx            # Entry point
```

## Key Features
- 📅 Date picker with navigation
- 📋 Chore management (add/edit/delete/complete)
- 🔄 Recurring chores (daily/weekly/monthly)
- 👥 Team member management
- 💾 Persistent local storage
- 🔔 In-app notifications
- 📱 Responsive design

## Development Workflow

### Starting
1. `npm install` - Install dependencies
2. `npm run dev` - Start dev server (http://localhost:5173)

### Building
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run electron-build` - Build Electron app

## Key Files to Know
- `src/context/ChoreContext.tsx` - Chore state & localStorage
- `src/pages/ChoreApp.tsx` - Main app component
- `src/components/AddChoreForm.tsx` - Create chores modal
- `src/utils/dateUtils.ts` - Date formatting & calculations
- `index.html` - HTML template

## Common Tasks

### Add New Component
1. Create in `src/components/`
2. Export from component
3. Import in page/app

### Add New Page
1. Create in `src/pages/`
2. Add route in App.tsx

### Modify State/Context
Edit `src/context/ChoreContext.tsx` and `NotificationContext.tsx`

### Add Styles
Create CSS file in `src/styles/` with component name

## Deployment
- **Web**: Vercel, Netlify, GitHub Pages
- **Desktop**: Electron installer in `out/` folder
- Data: Uses localStorage (no backend needed)

## Notes
- Uses localStorage for persistence - data is per-browser
- Icons via lucide-react (importing by name)
- Tailwind-like CSS variables in `:root`
- All dates stored as ISO strings (YYYY-MM-DD)
