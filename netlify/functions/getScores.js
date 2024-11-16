const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  if (event.httpMethod === "GET") {
    try {
      const filePath = path.join(__dirname, "scores.json");

      // Read the scores file
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const scores = JSON.parse(fileContent || "{}");

        return {
          statusCode: 200,
          body: JSON.stringify(scores),
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({}),
        };
      }
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to retrieve scores" }),
      };
    }
  }

  return {
    statusCode: 405, // Method Not Allowed
    body: "Method not allowed",
  };
};
