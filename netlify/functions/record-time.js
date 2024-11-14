// In-memory storage for demonstration purposes
const userTimes = {};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { userId, timeSpent } = JSON.parse(event.body);

    if (!userId || !timeSpent) {
        return { statusCode: 400, body: 'Missing required fields' };
    }

    // Update or add the total time spent for the user
    userTimes[userId] = (userTimes[userId] || 0) + timeSpent;

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Time recorded successfully' })
    };
};
