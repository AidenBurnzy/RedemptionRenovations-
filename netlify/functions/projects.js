// Projects API - CRUD operations for project management
// Connects to Neon PostgreSQL database

import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// Database connection using Neon serverless driver
const getDbClient = () => {
    const sql = neon(process.env.DATABASE_URL);
    return sql;
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

    console.log('Projects function called:', method, path);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Check if database is configured
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === 'your_neon_connection_string_here' || dbUrl === 'base') {
        console.log('Database not configured');
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
            console.log('GET /projects - Starting...');
            console.log('Database URL configured:', !!process.env.DATABASE_URL);
            
            const sql = getDbClient();
            
            try {
                console.log('Attempting database query...');
                const result = await sql`SELECT * FROM projects ORDER BY created_at DESC`;
                
                console.log(`Retrieved ${result.length} projects`);

                // Return array directly (not wrapped in object)
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result.map(row => ({
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
            } catch (dbError) {
                console.error('Database error:', dbError);
                throw dbError;
            }
        }

        // Verify authentication for all other operations
        verifyToken(event.headers.authorization);

        // POST /projects - Create new project
        if (method === 'POST' && path === '') {
            const { title, type, location, completedDate, description, images, tags } = JSON.parse(event.body);

            console.log('Creating project:', { title, type, tags });
            
            const sql = getDbClient();

            const result = await sql`
                INSERT INTO projects (title, type, location, completed_date, description, images, tags)
                VALUES (${title}, ${type}, ${location}, ${completedDate}, ${description}, ${images}, ${tags || []})
                RETURNING *
            `;

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    success: true,
                    project: {
                        id: result[0].id,
                        title: result[0].title,
                        type: result[0].type,
                        location: result[0].location,
                        completedDate: result[0].completed_date,
                        description: result[0].description,
                        images: result[0].images,
                        tags: result[0].tags || []
                    }
                })
            };
        }

        // PUT /projects/:id - Update project
        if (method === 'PUT' && path.startsWith('/')) {
            const id = path.substring(1);
            const { title, type, location, completedDate, description, images, tags } = JSON.parse(event.body);

            console.log('Updating project:', { id, title, type, tags });
            
            const sql = getDbClient();

            const result = await sql`
                UPDATE projects 
                SET title = ${title}, type = ${type}, location = ${location}, completed_date = ${completedDate},
                    description = ${description}, images = ${images}, tags = ${tags || []}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) {
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
                        id: result[0].id,
                        title: result[0].title,
                        type: result[0].type,
                        location: result[0].location,
                        completedDate: result[0].completed_date,
                        description: result[0].description,
                        images: result[0].images,
                        tags: result[0].tags || []
                    }
                })
            };
        }

        // DELETE /projects/:id - Delete project
        if (method === 'DELETE' && path.startsWith('/')) {
            const id = path.substring(1);

            const sql = getDbClient();

            const result = await sql`
                DELETE FROM projects WHERE id = ${id} RETURNING id
            `;

            if (result.length === 0) {
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
