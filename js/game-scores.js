// Define game variables
let gameTitle = "Block Blast";
let score = 0;

// Function to save the game score to Netlify
async function saveGameScore(gameTitle, score) {
  try {
    const response = await fetch("/.netlify/functions/saveScore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameTitle, score }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result.message); // "Score saved successfully!"
    } else {
      console.error("Failed to save score");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Function to get all scores from Netlify
async function getAllScores() {
  try {
    const response = await fetch("/.netlify/functions/getScores", {
      method: "GET",
    });

    if (response.ok) {
      const scores = await response.json();
      console.log("All Scores:", scores);
    } else {
      console.error("Failed to fetch scores");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Function to auto-save the score at regular intervals
function autoSaveScore(gameTitle, score) {
  setInterval(() => {
    console.log(`Auto-saving score: ${score}`);
    saveGameScore(gameTitle, score);
  }, 10000); // Save score every 10 seconds
}

// Simulate game progress by incrementing the score
function simulateGameProgress() {
  setInterval(() => {
    score += Math.floor(Math.random() * 10); // Randomly increase score
    console.log(`Score updated: ${score}`);
  }, 5000); // Update score every 5 seconds
}

// Start auto-saving the score and simulate game progress
autoSaveScore(gameTitle, score);
simulateGameProgress();