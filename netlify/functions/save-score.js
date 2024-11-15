exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }
  
    try {
      const body = JSON.parse(event.body);
  
      // Use the native fetch function if you're using Node.js v18 or higher
      const response = await fetch('https://your-api-endpoint.com', {
        method: 'POST',
        body: JSON.stringify({ score: body.score }),
        headers: { 'Content-Type': 'application/json' },
      });
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Score saved successfully!' }),
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
  };
  