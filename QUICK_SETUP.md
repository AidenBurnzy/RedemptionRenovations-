# 🚀 Quick Setup Reference

## Environment Variables (Copy to Netlify)

```env
# Your Neon Database URL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Admin Email(s) - Add your business email(s)
ADMIN_EMAILS=youremail@redemptionrenovations.com

# Password(s) - Match the order of emails above
ADMIN_PASSWORDS=YourStrongPassword123!

# JWT Secret - Copy from your other project OR generate new
JWT_SECRET=your_existing_jwt_secret_from_other_project
```

## Multiple Users Example

```env
ADMIN_EMAILS=owner@example.com,manager@example.com,staff@example.com
ADMIN_PASSWORDS=OwnerPass123!,ManagerPass456!,StaffPass789!
JWT_SECRET=same_jwt_secret_as_before
```

## Quick Commands

```bash
# Install dependencies
npm install

# Generate JWT Secret (if you need a new one)
openssl rand -base64 32

# Run setup wizard
./setup-admin.sh

# Start development
netlify dev

# Access admin panel
# http://localhost:8888/admin.html
```

## FAQ

### Can I reuse my JWT secret from other projects?
**YES!** Just copy the JWT_SECRET from your other Netlify project. It's safe to reuse.

### How do I add another admin user?
1. Go to Netlify → Environment variables
2. Add email to `ADMIN_EMAILS`: `email1,email2,newemail`
3. Add password to `ADMIN_PASSWORDS`: `pass1,pass2,newpass`
4. Redeploy

### What if emails/passwords don't match count?
You'll get "Server configuration error". Make sure you have the same number of emails and passwords, separated by commas.

### Development credentials?
- Email: `admin@example.com`
- Password: `admin`

### Where's the admin button?
Look in the footer of the gallery page, styled like "Member, Home Builders Association"

## That's It! 🎉

Set those 4 environment variables in Netlify and you're ready to go!
