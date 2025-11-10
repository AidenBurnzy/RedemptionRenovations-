const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  return {
    statusCode: 410,
    headers,
    body: JSON.stringify({
      message: 'This endpoint has been retired.',
      details: 'Use /api/projects for Redemption Renovations project management.'
    })
  };
}
