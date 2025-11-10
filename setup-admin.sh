#!/bin/bash

# Admin Panel Setup Script

echo "🎨 Redemption Renovations - Admin Panel Setup"
echo "=============================================="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists."
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "📝 Creating .env file..."
echo ""

# Get database URL
echo "🗄️  Database Configuration"
echo "-------------------------"
read -p "Enter your Neon Database URL: " db_url

# Get admin credentials
echo ""
echo "👤 Admin Credentials"
echo "-------------------"
echo "Enter admin emails (comma-separated for multiple users)"
read -p "Email(s) (default: admin@example.com): " admin_emails
admin_emails=${admin_emails:-admin@example.com}

echo "Enter passwords (comma-separated, same order as emails)"
read -sp "Password(s): " admin_pass
echo ""
read -sp "Confirm password(s): " admin_pass_confirm
echo ""

if [ "$admin_pass" != "$admin_pass_confirm" ]; then
    echo "❌ Passwords don't match. Setup cancelled."
    exit 1
fi

# Count emails and passwords
email_count=$(echo "$admin_emails" | tr ',' '\n' | wc -l)
pass_count=$(echo "$admin_pass" | tr ',' '\n' | wc -l)

if [ "$email_count" -ne "$pass_count" ]; then
    echo "❌ Number of emails ($email_count) doesn't match number of passwords ($pass_count)."
    exit 1
fi

# Generate JWT secret
echo ""
echo "🔐 Generating JWT secret..."
jwt_secret=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Neon Database Connection
DATABASE_URL=$db_url

# Admin Credentials (Email-based)
# For multiple users, separate with commas
ADMIN_EMAILS=$admin_emails
ADMIN_PASSWORDS=$admin_pass

# JWT Secret
JWT_SECRET=$jwt_secret
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Run the database schema: psql \$DATABASE_URL -f db/schema.sql"
echo "2. Start development server: npm run dev"
echo "3. Open admin panel: http://localhost:8888/admin.html"
echo ""
echo "🔒 Security Reminder:"
echo "- Never commit .env to Git"
echo "- Use strong passwords in production"
echo "- Add environment variables to Netlify dashboard for deployment"
echo ""
