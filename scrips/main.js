async function saveScore(username, game, score) {
    try {
        const response = await fetch('/.netlify/functions/save-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, game, score }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log(data.message);
        } else {
            console.error(data.error);
        }
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Example usage
document.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => {
        const username = prompt('Enter your username:');
        const game = card.getAttribute('data-title');
        const score = Math.floor(Math.random() * 1000); // Example score (replace with actual logic)

        saveScore(username, game, score);
    });
});
