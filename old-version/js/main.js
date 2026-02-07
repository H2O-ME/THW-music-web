import { LyricManager } from './lyrics.js';
import { SearchManager } from './search.js';
import { player } from './player.js';
import { AuthManager } from './auth.js';
import { FavoritesManager } from './favorites.js';
import { UIManager } from './ui.js';
import { PlaylistManager } from './playlist.js';
import { ImporterManager } from './importer.js';

document.addEventListener('DOMContentLoaded', () => {
    FavoritesManager.init();
    AuthManager.init();
    player.init();
    LyricManager.init();
    SearchManager.init();
    PlaylistManager.init();
    UIManager.init();
    ImporterManager.init();

    // Handle PWA Shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'search') {
        SearchManager.showSearchPage();
    } else if (action === 'favorites') {
        FavoritesManager.showFavoritesPage();
    }

});
