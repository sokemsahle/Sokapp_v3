# 🚀 Quick Start Guide - SOKAPP VPS Deployment

## ⚡ Fast Track (5 Minutes)

### For When You Have Your VPS Ready

```bash
# 1. Update .env files with your VPS details
# Root .env - Line to change:
REACT_APP_API_URL=http://YOUR_VPS_IP:5000

# Backend/.env - Lines to change:
ALLOWED_ORIGINS=http://YOUR_VPS_IP:3000,http://YOUR_VPS_IP:80

# 2. Build frontend
npm run build

# 3. Copy to VPS
scp -r build/ user@YOUR_VPS_IP:/var/www/sokapp

# 4. Install PM2 on VPS (if not installed)
npm install -g pm2

# 5. Start backend on VPS
cd /path/to/backend
pm2 start server.js --name sokapp-backend

# 6. Serve frontend on VPS
pm2 serve /var/www/sokapp 3000 --name sokapp-frontend

# 7. Save PM2 config
pm2 save

# Done! Access at: http://YOUR_VPS_IP:3000
```

---

## 📋 Essential Files Reference

| File | Purpose | What to Edit |
|------|---------|--------------|
| `.env` (root) | Frontend config | `REACT_APP_API_URL`, `ALLOWED_ORIGINS` |
| `Backend/.env` | Backend config | `DB_HOST`, `ALLOWED_ORIGINS` |
| `DEPLOYMENT.md` | Full guide | Read only |
| `VPS_CONFIG_EXAMPLES.md` | Examples | Copy scenarios from it |

---

## 🎯 Common Scenarios

### Scenario A: Deploying to VPS with Domain
```env
# Root .env
REACT_APP_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com

# Backend .env
ALLOWED_ORIGINS=https://yourdomain.com
```

### Scenario B: Deploying to VPS with IP Only
```env
# Root .env
REACT_APP_API_URL=http://192.168.1.100:5000
ALLOWED_ORIGINS=http://192.168.1.100:3000

# Backend .env
ALLOWED_ORIGINS=http://192.168.1.100:3000
```

### Scenario C: Testing on Local Network
```env
# Root .env
REACT_APP_API_URL=http://192.168.1.100:5000
ALLOWED_ORIGINS=http://192.168.1.100:3000

# Backend .env
ALLOWED_ORIGINS=http://192.168.1.100:3000
```

---

## 🔧 Troubleshooting

### ❌ "Failed to connect to server"
**Fix:** Check `REACT_APP_API_URL` in root `.env` matches your backend URL

### ❌ CORS Error
**Fix:** Update `ALLOWED_ORIGINS` in Backend `.env` to include frontend URL

### ❌ Database connection error
**Fix:** Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in both `.env` files

### ❌ Changes not reflecting
**Fix:** Rebuild frontend: `npm run build`

---

## 💡 Pro Tips

1. **Always rebuild after changing `.env`:**
   ```bash
   npm run build
   ```

2. **Generate strong session secret:**
   ```bash
   # PowerShell (Windows)
   [System.Convert]::ToBase64String((New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
   
   # Linux/Mac
   openssl rand -base64 32
   ```

3. **Test before deploying:**
   - Keep development setup working
   - Test on local network first
   - Then deploy to production VPS

4. **Use PM2 for production:**
   ```bash
   pm2 start server.js --name sokapp-backend
   pm2 startup
   pm2 save
   ```

---

## 📖 Documentation Index

- **DEPLOYMENT.md** → Complete deployment guide with all steps
- **VPS_CONFIG_EXAMPLES.md** → Ready-to-use configurations for different scenarios
- **ENV_CONFIGURATION_SUMMARY.md** → Detailed summary of all changes made
- **QUICK_START.md** (this file) → Fast reference for common tasks

---

## ✅ Pre-Deployment Checklist

Before deploying to VPS:

- [ ] Have VPS IP address or domain name
- [ ] Set up MySQL database on VPS
- [ ] Note database credentials (host, user, password, name)
- [ ] Decide deployment scenario (domain vs IP)
- [ ] Generate strong SESSION_SECRET
- [ ] Have Brevo API key ready (for emails)
- [ ] Test application works locally

---

## 🆘 Need Help?

1. Check the detailed guides first:
   - `DEPLOYMENT.md` for step-by-step instructions
   - `VPS_CONFIG_EXAMPLES.md` for configuration examples

2. Common commands:
   ```bash
   # Check if backend is running
   pm2 list
   
   # View logs
   pm2 logs sokapp-backend
   
   # Restart backend
   pm2 restart sokapp-backend
   
   # Rebuild frontend
   npm run build
   ```

3. Verify configuration:
   - Check `.env` values are correct
   - Ensure no typos in URLs
   - Confirm ports match (3000 for frontend, 5000 for backend)

---

**Remember:** The app automatically uses the URLs from your `.env` files, so just update those and rebuild!
