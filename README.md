# Office Chore Tracker

A modern, responsive web and desktop application for managing office chores with team assignment, recurring tasks, and visual tracking.

## Features

✨ **Core Features**
- 📅 **Calendar-style date picker** - Navigate through dates easily
- 📋 **Simple date list view** - See all chores for selected date, week, or all dates
- ✅ **Mark chores complete** - Track completion with visual feedback
- 🔄 **Recurring chores** - Support for daily, weekly, and monthly patterns
- 👥 **Team management** - Add/remove team members
- 🎯 **Chore assignment** - Assign tasks to specific team members
- 🔔 **In-app notifications** - Get feedback on actions
- 💾 **Local storage** - Data persists across sessions
- 📱 **Responsive design** - Works on desktop and mobile

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite (blazing fast dev server)
- **Desktop**: Electron (optional)
- **Styling**: CSS3 with CSS variables
- **Icons**: Lucide React
- **State Management**: React Context API
- **Storage**: Browser localStorage

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- [Download Node.js](https://nodejs.org)

### Installation

1. **Open the project directory** (already in `d:\Chore Tracking App`)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

### Adding Team Members

1. Click the **Team** button in the header
2. Enter a team member's name in the input field
3. Click the **+** button or press Enter
4. Team members appear in the sidebar list

### Creating Chores

1. Click **Add Chore** button (available after adding team members)
2. Fill in the form:
   - **Title**: Chore name (required)
   - **Description**: Optional details
   - **Due Date**: Pick a date
   - **Assign To**: Select a team member (required)
   - **Recurring**: Make it repeat (optional)
   - **End Date**: When recurring stops (optional)
3. Click **Create Chore**

### Managing Chores

- **Mark Complete**: Click the ✓ button on a chore
- **Delete**: Click the 🗑️ button
- **View different dates**: Use the date picker
- **Change view**: Switch between Day, Week, or All views

### Date Navigation

- Use **< / >** arrows to move between dates
- Click **Today** to jump to today
- Click the date picker to select any date directly

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run electron` - Run Electron app (requires build first)
- `npm run electron-dev` - Run Electron with dev server
- `npm run electron-build` - Build Electron app

## Deployment

### Web Deployment

#### GitHub Pages (Free)
```bash
npm run build
# Upload dist/ folder to GitHub Pages
```

#### Vercel (Recommended)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

#### Netlify
```bash
npm run build
# Connect your GitHub repo and deploy automatically
```

#### Self-hosted Server
```bash
npm run build
# Copy dist/ folder to your web server (Apache, Nginx, etc.)
```

### Desktop Deployment

```bash
npm run electron-build
# Creates .exe installer in out/ folder
```

## File Structure

```
chore-tracking-app/
├── src/
│   ├── components/        # React components
│   ├── context/          # State management (React Context)
│   ├── pages/            # Page components
│   ├── styles/           # CSS files
│   ├── utils/            # Helper functions
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── electron.ts           # Electron main process
```

## Data Storage

All data is stored locally in your browser's localStorage:
- `chores` - All chores data
- `teamMembers` - Team members list

**Clear data**: Open DevTools → Application → Local Storage → Clear

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### App won't start
- Ensure Node.js 16+ is installed: `node --version`
- Run `npm install` again
- Delete `node_modules` and run `npm install` fresh

### Port 5173 already in use
- Run `npm run dev -- --port 3000` to use a different port

### Data not persisting
- Check if localStorage is enabled in browser
- Clear browser cache and try again

## Future Enhancements

- Cloud sync (Firebase/Supabase)
- User authentication
- Team collaboration & comments
- Email/SMS reminders
- Export to CSV
- Dark mode
- Mobile app

## License

MIT

## Support

Need help? Check the [issues page](https://github.com/yourusername/chore-app/issues)
