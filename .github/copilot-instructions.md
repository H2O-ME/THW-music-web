# AI Coding Assistant Instructions for WinUI Music Player

## Project Overview
This is a web-based music player application with a WinUI-inspired design, built using vanilla JavaScript, HTML, and CSS. It is a **Progressive Web App (PWA)** that integrates with Netease Cloud Music API for song data and Supabase for user authentication and favorites storage.

## Architecture
- **Frontend**: Pure HTML/CSS/JS with ES6 modules, no build system required
- **PWA**: `manifest.json` for installability, `sw.js` for asset caching and offline support
- **Music API**: External meting.tianhw.top service (Netease music proxy)
- **Backend**: Supabase for user management and favorites
- **Styling**: Tailwind CSS + custom WinUI mica/glass effects
- **Animations**: GSAP for smooth transitions

## Key Components
- `main.js`: App entry point, initializes managers, handles PWA registration
- `player.js`: Audio playback, progress tracking, dynamic theming from album art
- `api.js`: Music data fetching with domain correction logic
- `auth.js`: User login/register via Supabase
- `favorites.js`: Favorite songs management with Supabase storage
- `playlist.js`: Playlist browsing and detail view management
- `search.js`: Search interface and results rendering
- `lyrics.js`: LRC parsing, synchronized display, fullscreen view
- `ui.js`: Sidebar management, responsive design, view switching
- `settings.js`: API endpoint configuration
- `state.js`: Global app state (playlist, current song, lyrics)
- `sw.js`: Service Worker for caching assets (offline support)

## Data Flow
1. **Search**: User searches → `api.search()` → render song list
2. **Playback**: Song selection → `player.playSong()` → load audio URL
3. **Theming**: Playback starts → extract colors from cover → apply theme
4. **Lyrics**: Load lyrics → `api.getLyric()` → parse and sync with audio time
5. **Playlists**: `playlist.showPlaylists()` → `api.getTopPlaylists()` → render grid

## Critical Patterns
- **Event-Driven**: Custom events (`player:songchange`, `auth:login`, `req:toggle-favorite`) for cross-module communication
- **Robust ID Handling**: Songs may have `id`, `song_id`, `songid`, or `mid` fields; always check multiple and extract from URLs if needed
- **Domain Replacement**: `api.js` automatically replaces legacy `meting.elysium-stack.cn` domains with `meting.tianhw.top` and forces HTTPS
- **Error Handling**: Use `Toast.show()` for user feedback; catch API failures gracefully
- **Theming**: `ColorThief` extracts dominant color from album art for dynamic UI tinting
- **Responsive**: Sidebar collapses on mobile; lyric view auto-collapses sidebar

## Developer Workflows
- **No Build Required**: Open `index.html` directly in browser for development
- **PWA Testing**: Use Chrome DevTools > Application tab to debug Manifest and Service Worker
- **Debugging**: Use browser dev tools; console logs for API responses
- **API Configuration**: Change music source URL in settings modal (stored in localStorage)
- **Supabase Setup**: Update credentials in `js/supabase.js` for different projects

## Conventions
- **Modules**: Each feature in separate JS file as ES6 class with static methods
- **Naming**: CamelCase for classes, kebab-case for HTML IDs
- **Storage**: localStorage for settings, Supabase for user data
- **Styling**: Tailwind utility classes + custom CSS variables for themes
- **Imports**: Relative paths from `js/` directory

## Integration Points
- **Supabase Tables**: `app_users` (username/password), `app_favorites` (user_id, song_id, song_data)
- **External APIs**: meting.tianhw.top for music data
- **CDNs**: Tailwind, GSAP, ColorThief, RemixIcon loaded via script tags

## File Structure Reference
```
index.html          # Main HTML with WinUI layout
manifest.json       # PWA Manifest
sw.js               # Service Worker
css/style.css       # WinUI themes, mica effects, animations
js/
├── main.js         # App initialization
├── player.js       # Audio playback & theming
├── api.js          # Music API client
├── auth.js         # Supabase authentication
├── favorites.js    # Favorites management
├── playlist.js     # Playlist management
├── search.js       # Search interface
├── lyrics.js       # Lyric display & sync
├── ui.js           # UI management & rendering
├── settings.js     # Configuration
├── state.js        # Global state
├── supabase.js     # Supabase client setup
└── utils.js        # Utilities (Toast, formatTime)
```
