// main.js - Common JavaScript functions for NapoliGames

// ============================================
// GAME MODAL FUNCTIONS
// ============================================

function openGame(url) {
    document.getElementById("game-frame").src = url;
    const modal = document.getElementById("game-modal");
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    const gameCard = document.querySelector(`[onclick*="${url}"]`);
    if (gameCard) {
        const gameTitle = gameCard.getAttribute('data-title');
        const score = 1000;
        setGameScore(gameTitle, score);
    }
}

function closeGame() {
    const modal = document.getElementById("game-modal");
    modal.classList.remove('active');
    
    setTimeout(() => {
        document.getElementById("game-frame").src = "";
        modal.style.display = "none";
    }, 300);
}

function openGameCard(url) {
    document.getElementById('gameIframe').src = url;
    document.getElementById('gameOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeGameCard() {
    document.getElementById('gameOverlay').style.display = 'none';
    document.getElementById('gameIframe').src = '';
    document.body.style.overflow = '';
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

function toggleSearch() {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    if (searchContainer.style.display === 'none' || searchContainer.style.display === '') {
        searchContainer.style.display = 'block';
        searchInput.focus();
    } else {
        searchContainer.style.display = 'none';
        searchInput.value = '';
        searchGames();
    }
}

function searchGames() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const gameContainer = document.getElementById('game-container');
    const gameCards = document.querySelectorAll('.game-card');
    
    let hasMatches = false;
    gameCards.forEach(function(card) {
        const gameTitle = card.getAttribute('data-title').toLowerCase();
        if (gameTitle.includes(searchInput)) {
            card.style.display = 'block';
            hasMatches = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    gameContainer.style.display = hasMatches ? 'grid' : 'none';
}

// Hide search bar when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.getElementById('search-container');
    if (!searchContainer) return;
    
    const searchInput = document.getElementById('search-input');
    const isClickInsideSearch = searchContainer.contains(event.target);
    const isClickOnSearchButton = event.target.textContent === 'Search';
    
    if (!isClickInsideSearch && !isClickOnSearchButton) {
        searchContainer.style.display = 'none';
        searchInput.value = '';
        searchGames();
    }
});

// ============================================
// FULLSCREEN FUNCTIONS
// ============================================

function toggleSimulatedFullscreen() {
    const body = document.body;
    const fullscreenButtonImage = document.querySelector('.fullscreen-button img');
    
    body.classList.toggle('simulated-fullscreen');
    
    if (body.classList.contains('simulated-fullscreen')) {
        fullscreenButtonImage.src = "Images/exitFullScreenIcon.png";
    } else {
        fullscreenButtonImage.src = "Images/fullScreenIcon.jpg";
    }
}

function scrollToGames() {
    document.getElementById('games-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// ============================================
// INDEXEDDB FUNCTIONS
// ============================================

let db;
const request = indexedDB.open('GameScoresDB', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('scores')) {
        db.createObjectStore('scores', { keyPath: 'gameTitle' });
    }
};

request.onerror = function(event) {
    console.error('Database error:', event.target.error);
};

function isDatabaseReady() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
        } else {
            request.onsuccess = function() {
                db = request.result;
                resolve(db);
            };
            request.onerror = function() {
                reject(new Error('Database initialization failed.'));
            };
        }
    });
}

function getGameScore(gameTitle) {
    isDatabaseReady().then((db) => {
        const transaction = db.transaction(['scores'], 'readonly');
        const store = transaction.objectStore('scores');
        const request = store.get(gameTitle);
        
        request.onsuccess = function() {
            if (request.result) {
                console.log(`Saved score for ${gameTitle}: ${request.result.score}`);
            } else {
                console.log(`No saved score found for ${gameTitle}`);
            }
        };
        
        request.onerror = function() {
            console.error('Error retrieving score:', request.error);
        };
    }).catch((error) => {
        console.error('Error:', error);
    });
}

function setGameScore(gameTitle, score) {
    isDatabaseReady().then((db) => {
        const transaction = db.transaction(['scores'], 'readwrite');
        const store = transaction.objectStore('scores');
        const gameScore = {
            gameTitle: gameTitle,
            score: score
        };
        
        store.put(gameScore);
        
        transaction.oncomplete = function() {
            console.log(`Score for ${gameTitle} saved successfully.`);
        };
        
        transaction.onerror = function() {
            console.error('Error saving score:', transaction.error);
        };
    }).catch((error) => {
        console.error('Error:', error);
    });
}

// ============================================
// FEATURED GAME FUNCTIONS
// ============================================

function updateFeaturedGame() {
    const game = getRandomGame(); // Using function from games.js
    
    if (!game) return;
    
    const featuredImage = document.querySelector('.featured-image img');
    const featuredTitle = document.querySelector('.featured-title');
    const featuredDesc = document.querySelector('.featured-desc');
    const featuredButton = document.querySelector('.featured-button');
    
    if (featuredImage) featuredImage.src = game.image;
    if (featuredTitle) featuredTitle.textContent = `Featured: ${game.title}`;
    
    const descriptions = {
        "Block Blast": "Block Blast combines strategy and quick thinking in an addictive puzzle experience. Clear blocks, create powerful combos, and challenge yourself with increasingly difficult levels.",
        "Hextris": "Hextris is a fast-paced puzzle game where you rotate a hexagon to prevent blocks from stacking up to the top. Test your reflexes and strategic thinking!",
        "2048": "Join the numbers and get to the 2048 tile! This addictive puzzle game challenges you to combine matching numbers.",
        "Subway Surfers": "Dash through the subway tracks, avoid obstacles, and escape the inspector in this thrilling endless runner.",
        "Basketball": "Test your shooting skills in this basketball game where precision and timing are key to scoring points.",
        "Drift Boss": "Drive your car along winding roads, maintaining control as you drift around sharp corners to achieve high scores.",
        "Chess": "Challenge yourself or play against others in this classic strategy game.",
        "Geometry Dash": "Jump and fly your way through danger in this rhythm-based action platformer!"
    };
    
    const description = descriptions[game.title] || `${game.title} offers exciting gameplay that will keep you entertained for hours. Test your skills and see why it's one of our featured games!`;
    if (featuredDesc) featuredDesc.textContent = description;
    
    if (featuredButton) featuredButton.setAttribute('onclick', `openGame('${game.url}')`);
}

// ============================================
// NETLIFY IDENTITY FUNCTIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Netlify Identity
    if (window.netlifyIdentity) {
        window.netlifyIdentity.init();
        
        window.netlifyIdentity.on('init', user => {
            console.log('Netlify Identity initialized:', user);
        });

        window.netlifyIdentity.on('login', user => {
            console.log('User logged in:', user);
            updateAuthUI(user);
            window.netlifyIdentity.close();
        });

        window.netlifyIdentity.on('logout', () => {
            console.log('User logged out');
            updateAuthUI(null);
        });

        // Check initial state
        const currentUser = window.netlifyIdentity.currentUser();
        if (currentUser) updateAuthUI(currentUser);
    }

    // Function to handle login/open widget
    const handleAuth = (e) => {
        e.preventDefault();
        if (window.netlifyIdentity) {
            window.netlifyIdentity.open();
        }
    };

    // Attach listeners to account buttons
    const topAccountBtn = document.getElementById('login-btn');
    const dockAccountBtn = document.getElementById('dock-account-btn');

    if (topAccountBtn) topAccountBtn.addEventListener('click', handleAuth);
    if (dockAccountBtn) dockAccountBtn.addEventListener('click', handleAuth);
});

function updateAuthUI(user) {
    const topAccountBtn = document.getElementById('login-btn');
    const dockAccountBtn = document.getElementById('dock-account-btn');
    const buttons = [topAccountBtn, dockAccountBtn];
    
    buttons.forEach(btn => {
        if (btn) {
            const titleSpan = btn.querySelector('.link-title');
            if (titleSpan) {
                titleSpan.textContent = user ? 'Logout' : 'Account';
            } else {
                btn.textContent = user ? 'Logout' : 'Account';
            }
        }
    });
}

// ============================================
// WELCOME POPUP FUNCTIONS
// ============================================

window.addEventListener('load', function() {
    const popup = document.getElementById('welcome-popup');
    if (popup) {
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.classList.add('active');
        }, 100);
    }
});

function closeWelcomePopup() {
    const popup = document.getElementById('welcome-popup');
    if (popup) {
        popup.classList.remove('active');
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function openLogin() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.open();
    } else {
        alert('Login feature coming soon!');
    }
}
