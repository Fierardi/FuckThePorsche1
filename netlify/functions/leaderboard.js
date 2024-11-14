exports.handler = async () => {
    const sortedUsers = Object.entries(userTimes)
        .sort(([, timeA], [, timeB]) => timeB - timeA)
        .slice(0, 10)
        .map(([userId, timeSpent]) => ({ userId, timeSpent }));

    return {
        statusCode: 200,
        body: JSON.stringify(sortedUsers)
    };
};
