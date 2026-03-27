# ============================================
# VPS Configuration Examples for SOKAPP
# ============================================
# Choose the scenario that matches your setup and update .env files accordingly
# ============================================

# ============================================
# SCENARIO 1: Single VPS with Domain (Recommended)
# ============================================
# Your VPS has a domain: yourdomain.com
# Frontend served via Nginx on port 80/443
# Backend runs on localhost:5000
# Database on same server (localhost:3306)

# Root .env (Frontend)
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Backend .env
NODE_ENV=production
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com


# ============================================
# SCENARIO 2: Single VPS with IP Address Only
# ============================================
# You're accessing via server IP: http://192.168.1.100
# No custom domain configured
# All services on same server

# Root .env (Frontend)
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=http://YOUR_SERVER_IP:5000
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP:80

# Backend .env
NODE_ENV=production
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000,http://YOUR_SERVER_IP:80


# ============================================
# SCENARIO 3: Separate Servers (Advanced)
# ============================================
# Frontend on one server (frontend-server.com)
# Backend on another server (backend-server.com)
# Database on separate server or cloud (db.example.com)

# Root .env (Frontend)
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://backend-server.com
ALLOWED_ORIGINS=https://frontend-server.com,https://www.frontend-server.com

# Backend .env
NODE_ENV=production
PORT=5000
DB_HOST=db.example.com
DB_PORT=3306
ALLOWED_ORIGINS=https://frontend-server.com,https://www.frontend-server.com


# ============================================
# SCENARIO 4: Local Network Testing
# ============================================
# Testing on local network before deployment
# Access via: http://192.168.x.x:3000

# Root .env (Frontend)
NODE_ENV=development
PORT=3000
REACT_APP_API_URL=http://192.168.1.100:5000
ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000

# Backend .env
NODE_ENV=development
PORT=5000
DB_HOST=192.168.1.100
DB_PORT=3307
ALLOWED_ORIGINS=http://192.168.1.100:3000,http://localhost:3000


# ============================================
# SCENARIO 5: Development (Current Setup)
# ============================================
# Running locally on localhost
# This is your current setup

# Root .env (Frontend)
NODE_ENV=development
PORT=3000
REACT_APP_API_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Backend .env
NODE_ENV=development
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000


# ============================================
# QUICK MIGRATION STEPS
# ============================================

# To migrate from Scenario 5 (Development) to Scenario 1 (Production):

# 1. Update Root .env:
#    - Change REACT_APP_API_URL to production URL
#    - Update ALLOWED_ORIGINS with production domains
#    - Set NODE_ENV=production

# 2. Update Backend .env:
#    - Change DB_HOST to production database host
#    - Update DB_PASSWORD with production password
#    - Update ALLOWED_ORIGINS with production domains
#    - Set NODE_ENV=production

# 3. Rebuild frontend:
#    npm run build

# 4. Restart backend:
#    pm2 restart sokapp-backend

# 5. Test the application on production URL


# ============================================
# IMPORTANT NOTES
# ============================================
# 1. Always use HTTPS in production (with SSL certificate)
# 2. Generate strong SESSION_SECRET (min 32 random characters)
# 3. Never commit .env files to Git (they're in .gitignore)
# 4. Keep .env.example as a template without sensitive data
# 5. Use environment variables for all sensitive information
# 6. Test thoroughly after changing any configuration

# ============================================
# GENERATE STRONG SESSION SECRET
# ============================================
# Run this command to generate a secure random string:
# 
# On Linux/Mac:
# openssl rand -base64 32
#
# On Windows (PowerShell):
# [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
#
# Or use an online generator like: https://generate-secret.vercel.app/32
