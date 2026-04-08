# ✅ SOKAPP VPS Deployment Checklist

Use this checklist to ensure a smooth deployment on your VPS.

## Pre-Deployment

### VPS Setup
- [ ] VPS provisioned (Ubuntu/Debian recommended)
- [ ] SSH access configured
- [ ] Static IP or domain name ready
- [ ] Firewall configured (ports 22, 80, 443, 3000, 5000)

### Docker Installation
- [ ] Docker installed on VPS
- [ ] Docker Compose installed
- [ ] Docker service running: `sudo systemctl status docker`
- [ ] User added to docker group (optional): `sudo usermod -aG docker $USER`

### Database (Aiven)
- [ ] Aiven MySQL database created
- [ ] Database credentials ready
- [ ] VPS IP added to Aiven service allowlist
- [ ] Database schema migrated/imported
- [ ] Connection tested from VPS

### Environment Configuration
- [ ] `.env.example.docker` copied to `.env`
- [ ] `BACKEND_URL` updated (e.g., `http://YOUR_VPS_IP:5000`)
- [ ] `FRONTEND_URL` updated (e.g., `http://YOUR_VPS_IP:3000`)
- [ ] `SESSION_SECRET` generated (secure random string)
- [ ] `BREVO_API_KEY` added (if using email features)
- [ ] Database credentials verified in `.env`

## Deployment

### Initial Deployment
- [ ] Project uploaded to VPS (Git clone or SCP)
- [ ] Navigated to project directory
- [ ] `.env` file in place and configured
- [ ] Ran: `docker-compose up -d --build`
- [ ] Build completed without errors
- [ ] Services started successfully

### Verification
- [ ] Backend container running: `docker-compose ps backend`
- [ ] Frontend container running: `docker-compose ps frontend`
- [ ] Backend healthy: `curl http://localhost:5000/`
- [ ] Frontend healthy: `curl http://localhost:3000/`
- [ ] Database connection working (check backend logs)
- [ ] No errors in logs: `docker-compose logs -f`

## Post-Deployment

### Testing
- [ ] Login page accessible
- [ ] User authentication working
- [ ] API endpoints responding
- [ ] Database queries executing
- [ ] File uploads working (if applicable)
- [ ] Email notifications working (if configured)
- [ ] All major features tested

### Security
- [ ] `.env` file NOT committed to Git
- [ ] Strong `SESSION_SECRET` set
- [ ] VPS firewall enabled (ufw)
- [ ] Only necessary ports open
- [ ] SSH key-based authentication enabled
- [ ] Regular system updates scheduled
- [ ] Docker images update plan in place

### Production Setup (Optional but Recommended)
- [ ] Domain name purchased
- [ ] DNS records configured (A record to VPS IP)
- [ ] Nginx reverse proxy installed
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS working for frontend
- [ ] HTTPS working for backend API
- [ ] HTTP to HTTPS redirect configured
- [ ] `.env` URLs updated to HTTPS

### Monitoring & Maintenance
- [ ] Log monitoring setup
- [ ] Resource usage monitored: `docker stats`
- [ ] Automated backups configured (Aiven)
- [ ] Update/restart procedure documented
- [ ] Rollback plan documented
- [ ] Health check endpoints verified

## Troubleshooting Preparedness

### Common Issues
- [ ] Know how to view logs: `docker-compose logs -f`
- [ ] Know how to restart services: `docker-compose restart`
- [ ] Know how to rebuild: `docker-compose up -d --build`
- [ ] Database connection issue resolution documented
- [ ] Port conflict resolution documented
- [ ] CORS issue resolution documented

### Backup & Recovery
- [ ] Database backup strategy in place (Aiven automated)
- [ ] Environment variables backed up securely
- [ ] Docker compose file backed up
- [ ] Recovery procedure documented
- [ ] Tested restore procedure

## Documentation

- [ ] DOCKER_README.md reviewed
- [ ] DOCKER_DEPLOYMENT.md reviewed
- [ ] QUICK_REFERENCE.md saved locally
- [ ] Custom configurations documented
- [ ] Team members trained on deployment process

## Final Sign-off

- [ ] Application fully functional on VPS
- [ ] All critical features tested
- [ ] Security measures in place
- [ ] Monitoring active
- [ ] Documentation complete
- [ ] Team notified of deployment
- [ ] Deployment date recorded: _______________
- [ ] Deployed by: _______________

---

## Quick Commands Reference

```bash
# Deploy
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update
git pull && docker-compose up -d --build

# Cleanup
docker image prune -a
```

---

**All checked? You're good to go! 🎉**
