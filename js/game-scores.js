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
  
  