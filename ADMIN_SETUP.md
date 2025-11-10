# Admin Panel Setup Guide

## Environment Variables

Create a `.env` file in the root directory (or configure in Netlify dashboard):

```env
# Database Configuration
DATABASE_URL=your_neon_database_connection_string

# Admin Authentication (Email-based)
# For multiple users, separate with commas
# Example: admin@example.com,user2@example.com,user3@example.com
ADMIN_EMAILS=admin@example.com
ADMIN_PASSWORDS=your_secure_password_here

# JWT Secret
# You can reuse the same JWT_SECRET from other projects, or generate a new one
# Generate with: openssl rand -base64 32
JWT_SECRET=your_random_jwt_secret_key_here
```

### Multi-User Setup Example

To add multiple admin users:

```env
ADMIN_EMAILS=john@example.com,jane@example.com,bob@example.com
ADMIN_PASSWORDS=john_password,jane_password,bob_password
```

**Important:** The order matters! The first email corresponds to the first password, etc.

## Neon Database Setup

1. **Create a Neon Database**
   - Go to [Neon Console](https://console.neon.tech/)
   - Create a new project
   - Copy the connection string

2. **Run the Schema**
   - Connect to your database using the Neon SQL Editor or psql
   - Run the SQL from `db/schema.sql`

3. **Add Connection String**
   - Add the `DATABASE_URL` to your `.env` file
   - Or add it to Netlify environment variables

## Netlify Environment Variables

In your Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add the following variables:
   - `DATABASE_URL` - Your Neon connection string
   - `ADMIN_EMAILS` - Comma-separated admin emails (e.g., `admin@example.com,user2@example.com`)
   - `ADMIN_PASSWORDS` - Comma-separated passwords in same order (e.g., `pass1,pass2`)
   - `JWT_SECRET` - Your JWT secret key (can reuse from other projects or generate new: `openssl rand -base64 32`)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Netlify Dev:**
   ```bash
   netlify dev
   ```

3. **Access Admin Panel:**
   - Open http://localhost:8888/admin.html
   - Login with your credentials (default: admin/admin for development)

## Default Credentials (Development Only)

For local development, the default credentials are:
- Email: `admin@example.com`
- Password: `admin`

**⚠️ IMPORTANT: Change these in production!**

## Security Notes

1. **Change default credentials** before deploying to production
2. **Use strong passwords** for admin access
3. **Keep JWT_SECRET secure** and never commit it to Git
4. **Use HTTPS** in production (Netlify provides this automatically)
5. **Consider adding rate limiting** to authentication endpoints
6. **Regularly update dependencies** for security patches

## Features

### Admin Panel
- ✅ Secure JWT-based authentication
- ✅ Create new projects
- ✅ Edit existing projects
- ✅ Delete projects
- ✅ Upload multiple images per project
- ✅ Search and filter projects

### Public Gallery
- ✅ Displays all projects from database
- ✅ Click-to-open modal with image carousel
- ✅ Responsive design
- ✅ Keyboard navigation
- ✅ Fast loading with image optimization

## API Endpoints

### Public Endpoints
- `GET /.netlify/functions/projects` - Get all projects

### Protected Endpoints (require authentication)
- `POST /.netlify/functions/auth` - Login and get JWT token
- `GET /.netlify/functions/verify` - Verify JWT token
- `POST /.netlify/functions/projects` - Create new project
- `PUT /.netlify/functions/projects/:id` - Update project
- `DELETE /.netlify/functions/projects/:id` - Delete project

## Image Hosting

For image hosting, you can use:
1. **Unsplash** - Free stock photos (https://unsplash.com)
2. **Imgur** - Free image hosting (https://imgur.com)
3. **Cloudinary** - Image CDN with transformations
4. **AWS S3** - Self-hosted storage
5. **Your own server** - Upload to your hosting

Enter full image URLs in the admin panel, one per line.

## Troubleshooting

### "Failed to load projects"
- Check that DATABASE_URL is set correctly
- Verify Neon database is running
- Check that schema has been applied

### "Invalid credentials"
- Verify ADMIN_USERNAME and ADMIN_PASSWORD in environment variables
- Check that values match what you're entering

### "No token provided"
- Clear browser localStorage
- Login again to get new token

### Functions not working locally
- Make sure `netlify dev` is running (not just a static server)
- Check that all dependencies are installed (`npm install`)

## Deployment Checklist

Before deploying to production:

- [ ] Set all environment variables in Netlify
- [ ] Change default admin credentials
- [ ] Generate secure JWT_SECRET
- [ ] Run database schema on Neon
- [ ] Test authentication
- [ ] Test CRUD operations
- [ ] Verify gallery displays correctly
- [ ] Check mobile responsiveness
- [ ] Test image uploads
- [ ] Verify CORS settings

## Support

For issues or questions, check:
- Netlify Functions logs in dashboard
- Browser console for errors
- Network tab for API calls
