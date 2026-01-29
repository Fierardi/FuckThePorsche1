// games.js - Game data and rendering functions

const games = [
    {
        title: "Block Blast",
        url: "https://blockblast-unblocked.github.io/",
        image: "Images/BlockIcon.jpg",
        dataTitle: "Block Blast"
    },
    {
        title: "Hextris",
        url: "https://hextris.io/",
        image: "Images/HextrisIcon.webp",
        dataTitle: "Hextris"
    },
    {
        title: "2048",
        url: "https://specials.manoramaonline.com/Mobile/2022/2048-game/index.html",
        image: "Images/2048Icon.png",
        dataTitle: "2048"
    },
    {
        title: "Blackjack",
        url: "https://www.lasvegasdirect.com/blackjack/",
        image: "Images/blackJackIcon.png",
        dataTitle: "Blackjack"
    },
    {
        title: "Idle Startup Tycoon",
        url: "https://idle-startup-tycoon.github.io/file/",
        image: "Images/idelStartUpIcon.png",
        dataTitle: "idle-startup-tycoon"
    },
    {
        title: "Paper io 2",
        url: "https://mathsedu1510.github.io/g/class-505/",
        image: "Images/PaperIo2.jpg",
        dataTitle: "paperio2"
    },
    {
        title: "Drift Boss",
        url: "https://mathsedu1510.github.io/g5/class-472/",
        image: "Images/DriftBossIcon.png",
        dataTitle: "drift boss"
    },
    {
        title: "James Gun",
        url: "https://mathsedu1510.github.io/g22/class-376/",
        image: "Images/jamesGunIcon.jpg",
        dataTitle: "James Gun"
    },
    {
        title: "Blumji Slime",
        url: "https://mathsedu1510.github.io/g16/class-421/",
        image: "Images/blumjiSlimeIcon.png",
        dataTitle: "Blumji Slime"
    },
    {
        title: "Trafic Rush",
        url: "https://mathsedu1510.github.io/g22/class-393/",
        image: "Images/traficRushIcon.jpeg",
        dataTitle: "Trafic Rush"
    },
    {
        title: "Basketball",
        url: "https://mathsedu1510.github.io/g177/class-333/",
        image: "Images/Play Basketball icon.png",
        dataTitle: "Basketball"
    },
    {
        title: "territorial.Io",
        url: "https://clockmantellstime.github.io/unblocked/territorial.html",
        image: "Images/terriTolialIcon.png",
        dataTitle: "territorial.Io"
    },
    {
        title: "DreadHead",
        url: "https://mathsedu1510.github.io/g97/class-412/",
        image: "Images/dreadHeadIcon.jpeg",
        dataTitle: "DreadHead"
    },
    {
        title: "Trivia Crack",
        url: "https://mathsedu1510.github.io/g4/class-196/",
        image: "Images/TriviaIcon.png",
        dataTitle: "Trivia"
    },
    {
        title: "Penalty Shooters 2",
        url: "https://mathsedu1510.github.io/g2/class-627/",
        image: "Images/PenaltyShootersIcon.jpg",
        dataTitle: "Penalty Shooters 2"
    },
    {
        title: "Monkey Markt",
        url: "https://mathsedu1510.github.io/g77/class-829/",
        image: "Images/Monkey.webp",
        dataTitle: "Monkey Markt"
    },
    {
        title: "Stacktris",
        url: "https://mathsedu1510.github.io/g2/class-417/",
        image: "Images/Stacktris.jpg",
        dataTitle: "Stacktris"
    },
    {
        title: "Subway Surfers",
        url: "https://mathsedu1510.github.io/g26/class-444/",
        image: "Images/SooubwasIcon.webp",
        dataTitle: "Subway Surfers"
    },
    {
        title: "Cow Bay",
        url: "https://mathsedu1510.github.io/g3/class-309/",
        image: "Images/CowBayIcon.webp",
        dataTitle: "Cow Bay"
    },
    {
        title: "We Skate",
        url: "https://mathsedu1510.github.io/g4/class-174/",
        image: "Images/weIcon.jpg",
        dataTitle: "We Scate"
    },
    {
        title: "Unicycle Hero",
        url: "https://mathsedu1510.github.io/g69/class-684",
        image: "Images/Unicycle HeroIcon.jpg",
        dataTitle: "Unicycle Hero"
    },
    {
        title: "Drive Mad",
        url: "https://mathsedu1510.github.io/g20/class-401",
        image: "Images/friveMadIcon.png",
        dataTitle: "Drive Mad"
    },
    {
        title: "Unicycle Legend",
        url: "https://mathsedu1510.github.io/g8/class-129",
        image: "Images/UnicycleLegendIcon.webp",
        dataTitle: "Unicycle Legend"
    },
    {
        title: "Blumji Ball",
        url: "https://mathsedu1510.github.io/g16/class-419/",
        image: "Images/BlumjiBall.jpg",
        dataTitle: "Blumji Ball"
    },
    {
        title: "Tiny Fishing",
        url: "https://mathsedu1510.github.io/g5/class-451",
        image: "Images/TFIcon.jpeg",
        dataTitle: "Tiny Fishing"
    },
    {
        title: "Rhomb",
        url: "https://mathsedu1510.github.io/g4/class-187/",
        image: "Images/Rhomb.png",
        dataTitle: "Rhomb"
    },
    {
        title: "Arrow Pathway",
        url: "https://mathsedu1510.github.io/g4/class-176",
        image: "Images/arrowPathIcon.jpg",
        dataTitle: "Arrow Pathway"
    },
    {
        title: "Lords of Gomoku",
        url: "https://mathsedu1510.github.io/g4/class-225/",
        image: "Images/LOGIcon.jpg",
        dataTitle: "Lords of Gomoku"
    },
    {
        title: "Flags Maniac",
        url: "https://mathsedu1510.github.io/g6/class-150",
        image: "Images/map.png",
        dataTitle: "flags maniac"
    },
    {
        title: "Blumgi Castle",
        url: "https://mathsedu1510.github.io/g16/class-427",
        image: "Images/blumjiCastleIcon.webp",
        dataTitle: "Blumji Castle"
    },
    {
        title: "Blumgi Rocket",
        url: "https://mathsedu1510.github.io/g16/class-413",
        image: "Images/blumgiRocketIcon.jpg",
        dataTitle: "Blumgi Rocket"
    },
    {
        title: "Swingo",
        url: "https://mathsedu1510.github.io/g69/class-636",
        image: "Images/swingoIcon.png",
        dataTitle: "Swingo"
    },
    {
        title: "Idle Miner Tycoon",
        url: "https://mathsedu1510.github.io/g72/class-622",
        image: "Images/idleMinerIcon.png",
        dataTitle: "Idle Miner"
    },
    {
        title: "UnpuzzleR",
        url: "https://mathsedu1510.github.io/g4/class-198/",
        image: "Images/retroHighwayIcon.jpg",
        dataTitle: "UnpuzzleR"
    },
    {
        title: "Super Fowlst 2",
        url: "https://mathsedu1510.github.io/g77/class-49/",
        image: "Images/superFowelst2.png",
        dataTitle: "Super Fowlst 2"
    },
    {
        title: "Super Liquid Soccer",
        url: "https://mathsedu1510.github.io/g69/class-628/",
        image: "Images/superLiquidSoccerIcon.png",
        dataTitle: "Super Liquid Soccer"
    },
    {
        title: "HYPERSNAKE",
        url: "https://mathsedu1510.github.io/g22/class-398",
        image: "Images/hyperSnakeIcon.png",
        dataTitle: "HYPERSNAKE"
    },
    {
        title: "Sausage Flip",
        url: "https://mathsedu1510.github.io/g2/class-415",
        image: "Images/sausageIcon.webp",
        dataTitle: "Sausage Flip"
    },
    {
        title: "guesswhereyouare",
        url: "https://guesswhereyouare.com/",
        image: "Images/guessIcon.png",
        dataTitle: "guesswhereyouare"
    },
    {
        title: "cats love cake 2",
        url: "https://mathsedu1510.github.io/g7/class-94/",
        image: "Images/catIcon.png",
        dataTitle: "cats love cake 2"
    },
    {
        title: "Stick Fighter",
        url: "https://mathsedu1510.github.io/g2/class-629/",
        image: "Images/stickIcon.png",
        dataTitle: "Stick Fighter"
    },
    {
        title: "Moto X3M Winter",
        url: "https://mathsedu1510.github.io/g5/class-460/",
        image: "Images/Moto X3M Winter.png",
        dataTitle: "Moto X3M Winter"
    },
    {
        title: "TAG",
        url: "https://mathsedu1510.github.io/g22/class-364/",
        image: "Images/TAG.png",
        dataTitle: "TAG"
    },
    {
        title: "Panda: Bubble Shooter",
        url: "https://mathsedu1510.github.io/g72/class-764/",
        image: "Images/Panda.jpg",
        dataTitle: "Panda: Bubble Shooter"
    },
    {
        title: "Lines to Fill",
        url: "https://mathsedu1510.github.io/g4/class-186/",
        image: "Images/lines.png",
        dataTitle: "Lines to FIll"
    },
    {
        title: "Roulette",
        url: "https://d2drhksbtcqozo.cloudfront.net/casino/games-mt/roulettenouveau/index.html?gameid=roulettenouveau&jurisdiction=MT&channel=web&moneymode=fun",
        image: "Images/roulette.png",
        dataTitle: "Roulette"
    },
    {
        title: "Chess",
        url: "https://plainchess.timwoelfle.de/",
        image: "Images/chess.png",
        dataTitle: "Chess"
    },
    {
        title: "Basket Random",
        url: "https://mathsedu1510.github.io/g26/class-436/",
        image: "Images/basketRandom.png",
        dataTitle: "Basket Random"
    },
    {
        title: "Free Kick Screamers",
        url: "https://mathsedu1510.github.io/g77/class-52/",
        image: "Images/Free Kick Screamers.jpeg",
        dataTitle: "Free Kick Screamers"
    },
    {
        title: "Speeed Pool King",
        url: "https://mathsedu1510.github.io/g6/class-146/",
        image: "Images/speed-pool-king.png",
        dataTitle: "Speeed Pool King"
    },
    {
        title: "Darts Pro",
        url: "https://mathsedu1510.github.io/g74/class-265/",
        image: "Images/Darts Pro.png",
        dataTitle: "Darts Pro"
    },
    {
        title: "Farm Battles",
        url: "https://mathsedu1510.github.io/g6/class-144/",
        image: "Images/Farm Battles.jpeg",
        dataTitle: "Farm Battles"
    },
    {
        title: "Money Factory",
        url: "games/mainMenu.html",
        image: "Images/CoinIcon.png",
        dataTitle: "MoneyFactory"
    },
    {
        title: "Grow Up the Cats",
        url: "https://mathsedu1510.github.io/g77/class-47/",
        image: "Images/poki-grow-up-the-cats-icon-filled.png",
        dataTitle: "MoneyFactory"
    },
    {
        title: "Mowing Mazes",
        url: "https://mathsedu1510.github.io/g6/class-145/",
        image: "Images/mowingMazes.png",
        dataTitle: "MoneyFactory"
    },
    {
        title: "Cosmos Lines",
        url: "https://mathsedu1510.github.io/g4/class-185/",
        image: "Images/poki-cosmos-lines-icon-filled-256.png",
        dataTitle: "Cosmos Lines"
    },
    {
        title: "Flip Bros",
        url: "https://mathsedu1510.github.io/g22/class-358/",
        image: "Images/unnamed.png",
        dataTitle: "Cosmos Lines"
    },
    {
        title: "Geometry Dash",
        url: "https://yoplay.io/geometry-dash.embed",
        image: "Images/geometry-dash.jpg",
        dataTitle: "Geometry Dash"
    },
    {
        title: "Royaledle",
        url: "https://clashdle.com/classic",
        image: "Images/royale.png",
        dataTitle: "Royaledle"
    },
    {
        title: "Ragdoll Archers",
        url: "https://bitlifeonline.github.io/ragdoll-archers/",
        image: "Images/ragdoll-archers.png",
        dataTitle: "Royaledle"
    },
    {
        title: "Escape Road",
        url: "https://yoplay.io/escape-road.embed",
        image: "Images/escape-road-icon-unplated.png",
        dataTitle: "Escape Road"
    },
    {
        title: "Sketchfull.Io",
        url: "https://sketchful.io/",
        image: "Images/Skribbl.io_2022_(Icon).png",
        dataTitle: "Sketchfull.Io"
    },
    {
        title: "gidd.io",
        url: "https://play.gidd.io/start",
        image: "Images/3nUN6oQf_400x400.jpg",
        dataTitle: "gidd.io"
    },
    {
        title: "Wordleoff",
        url: "https://www.wordleoff.com/",
        image: "Images/wordle.jpg",
        dataTitle: "Stadt Land Fluss"
    }
];

// Function to render all games
function renderGames(containerSelector = '#game-container', limit = null) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error('Game container not found:', containerSelector);
        return;
    }
    
    const gamesToRender = limit ? games.slice(0, limit) : games;
    
    container.innerHTML = gamesToRender.map(game => `
        <div class="game-card" onclick="openGame('${game.url}')" data-title="${game.dataTitle}">
            <img src="${game.image}" alt="${game.title}">
            <h2>${game.title}</h2>
        </div>
    `).join('');
}

// Function to render specific games by their indices
function renderGamesByIndices(containerSelector = '#game-container', indices = []) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error('Game container not found:', containerSelector);
        return;
    }
    
    const gamesToRender = indices.map(index => games[index]).filter(game => game !== undefined);
    
    container.innerHTML = gamesToRender.map(game => `
        <div class="game-card" onclick="openGame('${game.url}')" data-title="${game.dataTitle}">
            <img src="${game.image}" alt="${game.title}">
            <h2>${game.title}</h2>
        </div>
    `).join('');
}

// Function to render specific games by their titles
function renderGamesByTitles(containerSelector = '#game-container', titles = []) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error('Game container not found:', containerSelector);
        return;
    }
    
    const gamesToRender = games.filter(game => titles.includes(game.title));
    
    container.innerHTML = gamesToRender.map(game => `
        <div class="game-card" onclick="openGame('${game.url}')" data-title="${game.dataTitle}">
            <img src="${game.image}" alt="${game.title}">
            <h2>${game.title}</h2>
        </div>
    `).join('');
}

// Function to get games by category (you can extend this)
function getGamesByCategory(category) {
    // This is a placeholder - you can add category data to each game object
    // For now, returns all games
    return games;
}

// Function to get a random game
function getRandomGame() {
    const randomIndex = Math.floor(Math.random() * games.length);
    return games[randomIndex];
}

// Function to search games
function filterGames(searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return games.filter(game => 
        game.title.toLowerCase().includes(lowerSearchTerm) ||
        game.dataTitle.toLowerCase().includes(lowerSearchTerm)
    );
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        games, 
        renderGames, 
        renderGamesByIndices, 
        renderGamesByTitles, 
        getRandomGame, 
        filterGames,
        getGamesByCategory
    };
}