// JWT Token Verification
import jwt from 'jsonwebtoken';

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No token provided' })
            };
        }

        const token = authHeader.substring(7);
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

        const decoded = jwt.verify(token, JWT_SECRET);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                user: decoded
            })
        };
    } catch (error) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token' })
        };
    }
};
