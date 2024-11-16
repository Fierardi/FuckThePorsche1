const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  if (event.httpMethod === "POST") {
    try {
      // Parse the request body
      const { gameTitle, score } = JSON.parse(event.body);

      // File path to store scores (in Netlify's build environment)
      const filePath = path.join(__dirname, "scores.json");

      // Read the existing scores file or create an empty one
      let scores = {};
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        scores = JSON.parse(fileContent || "{}");
      }

      // Update the score for the given game
      scores[gameTitle] = score;

      // Save the updated scores back to the file
      fs.writeFileSync(filePath, JSON.stringify(scores, null, 2));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Score saved successfully!" }),
      };
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to save score" }),
      };
    }
  }

  return {
    statusCode: 405, // Method Not Allowed
    body: "Method not allowed",
  };
};
