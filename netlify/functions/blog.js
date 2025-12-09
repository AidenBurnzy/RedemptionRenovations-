// Blog Posts API
// Handles CRUD operations for blog posts
// Connects to Auctus App database (blog_posts table with client_id filter)

import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

// Redemption Renovations client ID in Auctus App database
const CLIENT_ID = 1;

// Database connection using Neon serverless driver
const getDbClient = () => {
    const sql = neon(process.env.DATABASE_URL);
    return sql;
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

    const method = event.httpMethod;
    const path = event.path.replace('/.netlify/functions/blog', '');

    console.log('Blog function called:', method, path);

    // Check if database is configured
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === 'your_neon_connection_string_here' || dbUrl === 'base') {
        console.log('Database not configured');
        if (method === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify([])
            };
        }
        return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
                error: 'Database not configured. Please set DATABASE_URL environment variable.'
            })
        };
    }

    try {
        const sql = getDbClient();

        // GET - Fetch all blog posts (public only sees published posts)
        if (method === 'GET' && path === '') {
            const isAuthenticated = await verifyAuth(event.headers);
            
            let result;
            if (isAuthenticated) {
                // Admin sees all posts for this client
                console.log('Fetching all blog posts for authenticated user');
                result = await sql`
                    SELECT * FROM blog_posts 
                    WHERE client_id = ${CLIENT_ID} 
                    ORDER BY created_at DESC
                `;
            } else {
                // Public only sees published posts
                console.log('Fetching published blog posts for public');
                result = await sql`
                    SELECT * FROM blog_posts 
                    WHERE client_id = ${CLIENT_ID} AND published = true 
                    ORDER BY published_at DESC
                `;
            }
            
            console.log(`Retrieved ${result.length} blog posts for client ${CLIENT_ID}`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // All other operations require authentication
        const isAuthenticated = await verifyAuth(event.headers);
        if (!isAuthenticated) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        // POST - Create new blog post
        if (method === 'POST' && path === '') {
            const post = JSON.parse(event.body);
            
            console.log('Creating blog post:', { title: post.title, published: post.published });
            
            const publishedAt = post.published ? new Date().toISOString() : null;
            
            const result = await sql`
                INSERT INTO blog_posts 
                (client_id, title, content, excerpt, author, featured_image, images, tags, published, published_at)
                VALUES (
                    ${CLIENT_ID},
                    ${post.title},
                    ${post.content},
                    ${post.excerpt || null},
                    ${post.author || 'Redemption Renovations'},
                    ${post.featured_image || null},
                    ${post.images || []},
                    ${post.tags || []},
                    ${post.published || false},
                    ${publishedAt}
                )
                RETURNING *
            `;
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result[0])
            };
        }

        // PUT - Update blog post
        if (method === 'PUT' && path.startsWith('/')) {
            const post = JSON.parse(event.body);
            const postId = path.substring(1);
            
            console.log('Updating blog post:', { id: postId, title: post.title });
            
            // Check if we need to set published_at (first time publishing)
            const checkResult = await sql`
                SELECT published, published_at FROM blog_posts 
                WHERE id = ${postId} AND client_id = ${CLIENT_ID}
            `;
            
            let publishedAt = checkResult[0]?.published_at;
            
            // If publishing for the first time, set published_at to now
            if (post.published && checkResult.length > 0 && !checkResult[0].published && !checkResult[0].published_at) {
                publishedAt = new Date().toISOString();
            }
            
            const result = await sql`
                UPDATE blog_posts SET
                    title = ${post.title},
                    content = ${post.content},
                    excerpt = ${post.excerpt || null},
                    author = ${post.author || 'Redemption Renovations'},
                    featured_image = ${post.featured_image || null},
                    images = ${post.images || []},
                    tags = ${post.tags || []},
                    published = ${post.published || false},
                    published_at = ${publishedAt},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ${postId} AND client_id = ${CLIENT_ID}
                RETURNING *
            `;
            
            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Post not found' })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result[0])
            };
        }

        // DELETE - Delete blog post
        if (method === 'DELETE' && path.startsWith('/')) {
            const postId = path.substring(1);
            
            console.log('Deleting blog post:', { id: postId });
            
            const result = await sql`
                DELETE FROM blog_posts 
                WHERE id = ${postId} AND client_id = ${CLIENT_ID} 
                RETURNING *
            `;
            
            if (result.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Post not found' })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, deleted: result[0] })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error', message: error.message })
        };
    }
};

// Helper function to verify JWT token
async function verifyAuth(headers) {
    try {
        const authHeader = headers.authorization || headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.substring(7);
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        
        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        return false;
    }
}