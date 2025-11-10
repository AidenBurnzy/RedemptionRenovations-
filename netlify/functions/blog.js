// Blog Posts API
// Handles CRUD operations for blog posts

import pg from 'pg';
import jwt from 'jsonwebtoken';
const { Client } = pg;

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Check if database is configured
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === 'your_neon_connection_string_here' || dbUrl === 'base') {
        // Return empty array for GET requests when DB not configured
        if (event.httpMethod === 'GET') {
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

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // GET - Fetch all blog posts (public can see published, admin sees all)
        if (event.httpMethod === 'GET') {
            const isAuthenticated = await verifyAuth(event.headers);
            
            let query;
            if (isAuthenticated) {
                // Admin sees all posts
                query = 'SELECT * FROM blog_posts ORDER BY created_at DESC';
            } else {
                // Public only sees published posts
                query = 'SELECT * FROM blog_posts WHERE published = true ORDER BY published_at DESC';
            }

            const result = await client.query(query);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
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
        if (event.httpMethod === 'POST') {
            const post = JSON.parse(event.body);
            
            const query = `
                INSERT INTO blog_posts 
                (title, content, excerpt, author, featured_image, images, tags, published, published_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;
            
            const publishedAt = post.published ? new Date() : null;
            
            const values = [
                post.title,
                post.content,
                post.excerpt || null,
                post.author || 'Redemption Renovations',
                post.featured_image || null,
                post.images || [],
                post.tags || [],
                post.published || false,
                publishedAt
            ];
            
            const result = await client.query(query, values);
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        // PUT - Update blog post
        if (event.httpMethod === 'PUT') {
            const post = JSON.parse(event.body);
            const postId = event.path.split('/').pop();
            
            // If publishing for the first time, set published_at
            let publishedAtQuery = '';
            let publishedAtValue = [];
            
            if (post.published) {
                // Get current post to check if it was previously unpublished
                const checkQuery = 'SELECT published, published_at FROM blog_posts WHERE id = $1';
                const checkResult = await client.query(checkQuery, [postId]);
                
                if (checkResult.rows.length > 0 && !checkResult.rows[0].published && !checkResult.rows[0].published_at) {
                    publishedAtQuery = ', published_at = $10';
                    publishedAtValue = [new Date()];
                }
            }
            
            const query = `
                UPDATE blog_posts SET
                title = $1,
                content = $2,
                excerpt = $3,
                author = $4,
                featured_image = $5,
                images = $6,
                tags = $7,
                published = $8
                ${publishedAtQuery}
                WHERE id = $9
                RETURNING *
            `;
            
            const values = [
                post.title,
                post.content,
                post.excerpt || null,
                post.author || 'Redemption Renovations',
                post.featured_image || null,
                post.images || [],
                post.tags || [],
                post.published || false,
                postId,
                ...publishedAtValue
            ];
            
            const result = await client.query(query, values);
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Post not found' })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        // DELETE - Delete blog post
        if (event.httpMethod === 'DELETE') {
            const postId = event.path.split('/').pop();
            
            const query = 'DELETE FROM blog_posts WHERE id = $1 RETURNING *';
            const result = await client.query(query, [postId]);
            
            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Post not found' })
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, deleted: result.rows[0] })
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
            body: JSON.stringify({ error: 'Internal server error', details: error.message })
        };
    } finally {
        await client.end();
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
