# Klar - Premium Focus & Task Management

A high-performance productivity application built with React, Firebase, and modern web technologies.

## 🎯 Features

### Core Functionality
- **Context-Based Organization**: Create multiple workspaces (Work, Personal, Projects) with custom emojis and themes
- **Advanced Task Management**: Quick add, detailed forms with descriptions, due dates, and recurring tasks
- **Pomodoro Timer**: Built-in focus engine with automatic phase switching (25min focus → 5min break)
- **Ambient Soundscapes**: Generative audio using Web Audio API (Brown/Pink/White noise)
- **Analytics Dashboard**: GitHub-style contribution heatmap and productivity stats
- **Custom Theming**: Full dark mode, auto-schedule, and custom color picker

### UX Features
- **Keyboard Shortcuts**: `Cmd+K` (palette), `C` (create), `Space` (timer), `?` (help)
- **Real-time Sync**: Firebase Firestore for instant cross-device updates
- **Optimistic UI**: Smooth animations with Framer Motion
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project (for backend)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Anonymous) and Firestore
   - Update `vite.config.js` with your Firebase credentials:
   
   ```javascript
   __firebase_config: JSON.stringify({
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   })
   ```

3. **Set up Firestore Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /artifacts/{appId}/users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
klar/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Tailwind CSS imports
├── public/              # Static assets
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration + Firebase config
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Dependencies
```

## 🎨 Architecture Highlights

### State Management
- React Hooks (`useState`, `useEffect`, `useMemo`)
- Real-time Firestore listeners with `onSnapshot`
- Derived state for computed values

### Key Technical Patterns
1. **Dynamic Theming**: CSS custom properties injected via inline styles
2. **Timer State Machine**: Pomodoro cycle management with phase tracking
3. **Sound Engine**: Web Audio API with oscillators and buffer sources
4. **Recurrence Logic**: Automatic task duplication on completion

### Data Collections
```
artifacts/{appId}/users/{userId}/
├── contexts/           # User workspaces
├── tasks/             # All tasks with metadata
├── focus_logs/        # Historical focus sessions
└── settings/          # Theme & audio preferences
    └── preferences
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `C` | Create new task |
| `Space` | Start/pause active timer |
| `?` | Show shortcuts help |
| `Esc` | Close all modals |

## 🎯 Roadmap

- [ ] Offline support with service workers
- [ ] Collaborative contexts (share with team)
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Advanced analytics (weekly/monthly reports)
- [ ] Task templates
- [ ] Integrations (Calendar, Notion, etc.)

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase (Auth + Firestore)
- **Audio**: Web Audio API

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with focus. Designed for productivity.** ⚡
