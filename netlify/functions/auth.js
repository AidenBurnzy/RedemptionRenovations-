// Authentication Function
// Handles login and JWT token generation
// Supports multiple users via comma-separated environment variables

import jwt from 'jsonwebtoken';

export const handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        // Get credentials from environment variables
        // Format: ADMIN_EMAILS=email1@example.com,email2@example.com
        //         ADMIN_PASSWORDS=password1,password2
        const adminEmails = (process.env.ADMIN_EMAILS || 'admin@example.com').split(',').map(e => e.trim());
        const adminPasswords = (process.env.ADMIN_PASSWORDS || 'changeme').split(',').map(p => p.trim());
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

        // Debug logging
        console.log('Login attempt with email:', email);
        console.log('Configured emails:', adminEmails);
        console.log('Email match check:', adminEmails.map((e, i) => `${e} === ${email} ? ${e === email}`));

        // Validate that we have matching email/password pairs
        if (adminEmails.length !== adminPasswords.length) {
            console.error('Mismatch between number of emails and passwords');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        // Check if credentials match any user
        let userIndex = -1;
        for (let i = 0; i < adminEmails.length; i++) {
            if (email === adminEmails[i] && password === adminPasswords[i]) {
                userIndex = i;
                break;
            }
        }

        if (userIndex !== -1) {
            // Generate JWT token
            const token = jwt.sign(
                { 
                    email: adminEmails[userIndex],
                    role: 'admin',
                    userIndex: userIndex
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    token,
                    email: adminEmails[userIndex],
                    expiresIn: '7d'
                })
            };
        } else {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }
    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};
