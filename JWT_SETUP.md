# JWT Secret Setup Guide

## Can I Reuse My JWT Secret?

**Yes!** You can absolutely reuse the same JWT_SECRET from your other projects. Here's what you need to know:

## What is a JWT Secret?

A JWT (JSON Web Token) secret is a string used to sign and verify authentication tokens. It ensures that tokens haven't been tampered with.

## Reusing JWT Secrets

### ✅ Safe to Reuse IF:
1. **Different domains/projects** - Projects on different domains can safely share a JWT secret
2. **Same organization** - All your projects under your control
3. **Trusted environment** - The secret is kept secure and not exposed

### ⚠️ Consider Separate Secrets IF:
1. **High security requirements** - Banking, healthcare, or sensitive data
2. **Different teams** - Multiple teams with different access levels
3. **Token revocation needs** - Want to invalidate one project's tokens without affecting others

## For This Project

Since this is your Redemption Renovations admin panel:

**YES, you can use the same JWT_SECRET from your other projects!**

Simply copy the JWT_SECRET value from your other project's environment variables and use it here.

## How to Set It Up

### Option 1: Reuse Existing Secret

1. Open your other project's Netlify dashboard
2. Go to Site settings → Environment variables
3. Copy the JWT_SECRET value
4. Paste it into this project's JWT_SECRET variable

### Option 2: Generate New Secret

If you prefer a new secret:

```bash
openssl rand -base64 32
```

Or in Node.js:
```javascript
require('crypto').randomBytes(32).toString('base64')
```

Or use an online generator:
- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

## Setting Up Multiple Users

### Single User
```env
ADMIN_EMAILS=john@example.com
ADMIN_PASSWORDS=SecurePassword123!
JWT_SECRET=your_jwt_secret_here
```

### Multiple Users
```env
ADMIN_EMAILS=john@example.com,jane@example.com,bob@example.com
ADMIN_PASSWORDS=JohnPass123!,JanePass456!,BobPass789!
JWT_SECRET=your_jwt_secret_here
```

**Important Rules:**
- Separate emails and passwords with commas
- **No spaces** after commas
- **Same number** of emails and passwords
- **Same order** - first email matches first password, etc.

## Example Configurations

### For Your Business (Multiple Staff)
```env
# Owner and manager can both access admin panel
ADMIN_EMAILS=owner@redemptionrenovations.com,manager@redemptionrenovations.com
ADMIN_PASSWORDS=OwnerSecurePass123!,ManagerSecurePass456!
JWT_SECRET=abc123xyz789yourSecretKeyHere==
```

### Just You (Single User)
```env
ADMIN_EMAILS=youremail@example.com
ADMIN_PASSWORDS=YourStrongPassword123!
JWT_SECRET=abc123xyz789yourSecretKeyHere==
```

### Development + Production
```env
# Development
ADMIN_EMAILS=admin@example.com
ADMIN_PASSWORDS=admin
JWT_SECRET=dev_secret_not_for_production

# Production (use real credentials)
ADMIN_EMAILS=real@email.com
ADMIN_PASSWORDS=RealStr0ngP@ssw0rd!
JWT_SECRET=production_secret_from_other_project
```

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Example: `MyStr0ng!P@ssw0rd#2024`

2. **Keep JWT_SECRET Private**
   - Never commit to Git
   - Store only in Netlify environment variables
   - Use same secret for your projects, but keep it secret from others

3. **Use Business Emails**
   - `john@redemptionrenovations.com` ✅
   - `randomuser123@gmail.com` ❌

4. **Rotate Periodically**
   - Change passwords every 3-6 months
   - Change JWT_SECRET if compromised

## Adding/Removing Users

### To Add a User
1. Go to Netlify → Environment variables
2. Update `ADMIN_EMAILS`: Add new email at the end
3. Update `ADMIN_PASSWORDS`: Add new password at the end
4. Save and redeploy

Example:
```env
# Before
ADMIN_EMAILS=john@example.com
ADMIN_PASSWORDS=JohnPass123!

# After (adding Jane)
ADMIN_EMAILS=john@example.com,jane@example.com
ADMIN_PASSWORDS=JohnPass123!,JanePass456!
```

### To Remove a User
1. Remove their email from `ADMIN_EMAILS`
2. Remove their password from `ADMIN_PASSWORDS`
3. Save and redeploy

## Common Issues

### "Invalid credentials" Error
- Check email is in ADMIN_EMAILS
- Check password matches exactly (case-sensitive)
- Verify no extra spaces in environment variables
- Ensure comma-separated (no spaces after commas)

### "Server configuration error"
- Number of emails doesn't match number of passwords
- Fix: Make sure you have equal number of entries

### Token Expired
- Tokens last 7 days
- Simply login again to get new token

## Testing

After setting up, test each user:

1. Go to your-site.com/admin.html
2. Try logging in with each email/password combination
3. Verify you can access the dashboard
4. Try adding/editing a project

## Quick Reference

```env
# Format
ADMIN_EMAILS=email1,email2,email3
ADMIN_PASSWORDS=pass1,pass2,pass3
JWT_SECRET=your_secret_here

# Rules
- Commas separate entries (no spaces)
- Same number of emails and passwords
- Order matters (first email = first password)
- JWT_SECRET can be reused from other projects
- Passwords are case-sensitive
```

## Need Help?

If you're stuck:
1. Check Netlify Functions logs for errors
2. Verify environment variables are saved
3. Redeploy after changing variables
4. Test with development credentials first
5. Use browser console to see error messages
