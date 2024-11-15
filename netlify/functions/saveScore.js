// netlify/functions/save-score.js

const fs = require('fs');
const path = require('path');

// Path to a JSON file to store scores (in local build context)
const scoresFile = path.resolve(__dirname, 'scores.json');

// Ensure the file exists
if (!fs.existsSync(scoresFile)) {
    fs.writeFileSync(scoresFile, JSON.stringify([]));
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { username, game, score } = body;

        if (!username || !game || !score) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid input' }),
            };
        }

        // Load existing scores
        const scores = JSON.parse(fs.readFileSync(scoresFile));

        // Add the new score
        scores.push({ username, game, score, timestamp: new Date().toISOString() });

        // Save updated scores
        fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Score saved successfully!' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
