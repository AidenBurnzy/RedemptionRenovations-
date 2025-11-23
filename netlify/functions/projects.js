// Projects API - CRUD operations for project management
// Connects to Neon PostgreSQL database

import pg from 'pg';
import jwt from 'jsonwebtoken';

const { Client } = pg;

// Database connection
const getDbClient = () => {
    return new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
};

// Verify JWT token
const verifyToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    
    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    return jwt.verify(token, JWT_SECRET);
};

// CORS headers
const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

export const handler = async (event, context) => {
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const path = event.path.replace('/.netlify/functions/projects', '');
    const method = event.httpMethod;

    // Check if database is configured
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === 'your_neon_connection_string_here' || dbUrl === 'base') {
        // Return empty array for GET requests when DB not configured
        if (method === 'GET' && path === '') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify([])
            };
        }
        // Return error for other operations
        return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
                error: 'Database not configured. Please set DATABASE_URL environment variable.'
            })
        };
    }

    try {
        // GET /projects - Get all projects (public)
        if (method === 'GET' && path === '') {
            const client = getDbClient();
            await client.connect();

            const result = await client.query(
                'SELECT * FROM projects ORDER BY created_at DESC'
            );

            await client.end();

            // Return array directly (not wrapped in object)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    type: row.type,
                    location: row.location,
                    completedDate: row.completed_date,
                    description: row.description,
                    images: row.images,
                    tags: row.tags || []
                })))
            };
        }

        // Verify authentication for all other operations
        verifyToken(event.headers.authorization);

        // POST /projects - Create new project
        if (method === 'POST' && path === '') {
            const { title, type, location, completedDate, description, images, tags } = JSON.parse(event.body);

            console.log('Creating project:', { title, type, tags });
            
            const client = getDbClient();
            await client.connect();

            const result = await client.query(
                `INSERT INTO projects (title, type, location, completed_date, description, images, tags)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [title, type, location, completedDate, description, images, tags || []]
            );

            await client.end();

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    project: {
                        id: result.rows[0].id,
                        title: result.rows[0].title,
                        type: result.rows[0].type,
                        location: result.rows[0].location,
                        completedDate: result.rows[0].completed_date,
                        description: result.rows[0].description,
                        images: result.rows[0].images
                    }
                })
            };
        }

        // PUT /projects/:id - Update project
        if (method === 'PUT' && path.startsWith('/')) {
            const id = path.substring(1);
            const { title, type, location, completedDate, description, images, tags } = JSON.parse(event.body);

            console.log('Updating project:', { id, title, type, tags });
            
            const client = getDbClient();
            await client.connect();

            const result = await client.query(
                `UPDATE projects 
                 SET title = $1, type = $2, location = $3, completed_date = $4, 
                     description = $5, images = $6, tags = $7, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8
                 RETURNING *`,
                [title, type, location, completedDate, description, images, tags || [], id]
            );

            await client.end();

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Project not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    project: {
                        id: result.rows[0].id,
                        title: result.rows[0].title,
                        type: result.rows[0].type,
                        location: result.rows[0].location,
                        completedDate: result.rows[0].completed_date,
                        description: result.rows[0].description,
                        images: result.rows[0].images,
                        tags: result.rows[0].tags || []
                    }
                })
            };
        }

        // DELETE /projects/:id - Delete project
        if (method === 'DELETE' && path.startsWith('/')) {
            const id = path.substring(1);

            const client = getDbClient();
            await client.connect();

            const result = await client.query(
                'DELETE FROM projects WHERE id = $1 RETURNING id',
                [id]
            );

            await client.end();

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Project not found' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Project deleted'
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('API Error:', error);

        if (error.message === 'No token provided' || error.name === 'JsonWebTokenError') {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error', message: error.message })
        };
    }
};
