# Life OS - Production Deployment Guide

## Prerequisites

- VPS with Ubuntu 20.04+ (your "syrax" VPS)
- Domain name pointing to your VPS IP (samulangarica.com)
- SSH access to your VPS
- At least 2GB RAM, 20GB disk space

## Quick Deployment

### Step 1: Prepare Locally

1. **Create production environment file:**
```bash
cp .env.production.example .env.production
```

2. **Edit `.env.production` with your values:**
```bash
DOMAIN=samulangarica.com
DB_PASSWORD=your-secure-password-here
SECRET_KEY=generate-with-openssl-rand-hex-32
NEXT_PUBLIC_API_URL=https://samulangarica.com
```

3. **Generate a secure SECRET_KEY:**
```bash
openssl rand -hex 32
```

### Step 2: Push to Git

```bash
git add .
git commit -m "Add production deployment config"
git push origin main
```

### Step 3: Deploy on VPS

1. **SSH into your VPS:**
```bash
ssh root@syrax  # or your VPS IP
```

2. **Clone the repository:**
```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/life-os.git
cd life-os
```

3. **Copy your .env.production file:**
```bash
# Either copy from your local machine:
scp .env.production root@syrax:/opt/life-os/

# Or create it directly on the VPS:
nano .env.production
# Paste your values and save (Ctrl+X, Y, Enter)
```

4. **Run the deployment script:**
```bash
chmod +x deploy.sh
./deploy.sh
```

5. **Wait for deployment to complete** (~5-10 minutes)

The script will:
- Install Docker and Docker Compose
- Build all containers
- Set up SSL certificates with Let's Encrypt
- Start all services
- Configure Nginx

### Step 4: Verify Deployment

1. **Check services are running:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                STATUS
lifeos-backend      Up
lifeos-frontend     Up
lifeos-db           Up
lifeos-nginx        Up
lifeos-certbot      Up
```

2. **Check logs if needed:**
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

3. **Test the app:**
- Open https://samulangarica.com in your browser
- You should see the login page
- SSL should be working (green padlock)

### Step 5: Create Your First User

Since this is single-user, you need to create your account via the backend:

```bash
# SSH into backend container
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.database import get_db
from app.services.auth import hash_password
from app.models.user import User
import asyncio
from uuid import uuid4

async def create_user():
    async for db in get_db():
        user = User(
            id=uuid4(),
            email='samuel@samulangarica.com',
            username='samuel',
            hashed_password=hash_password('your-password-here')
        )
        db.add(user)
        await db.commit()
        print('User created successfully!')
        break

asyncio.run(create_user())
"
```

Or use the API directly:
```bash
curl -X POST https://samulangarica.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "samuel@samulangarica.com",
    "username": "samuel",
    "password": "your-secure-password"
  }'
```

## Maintenance

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Database Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lifeos lifeos > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U lifeos lifeos < backup_20260216.sql
```

### Update Application

When you add new modules or make changes:

```bash
cd /opt/life-os
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot container. Check renewal:
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory
free -h
```

### SSL certificate fails
```bash
# Make sure DNS is pointing to your VPS
dig samulangarica.com

# Check port 80 is accessible
curl http://samulangarica.com/.well-known/acme-challenge/test

# Manually run certbot
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d samulangarica.com
```

### Database connection errors
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml exec db pg_isready -U lifeos

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

### Frontend/Backend not accessible
```bash
# Check nginx config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Security Checklist

- [x] Strong DB_PASSWORD in .env.production
- [x] Secure SECRET_KEY (32+ random characters)
- [x] SSL certificate installed
- [x] HTTPS redirect enabled
- [x] Security headers configured
- [x] Rate limiting enabled (login: 5/min, API: 10/s)
- [ ] Firewall configured (UFW or iptables)
- [ ] Regular backups scheduled
- [ ] Monitoring set up (optional)

## Firewall Setup (Recommended)

```bash
# Install UFW
apt-get install ufw

# Allow SSH (important! Don't lock yourself out)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

## What's Deployed

### Working Features:
- ✅ Authentication (JWT + httpOnly cookies)
- ✅ Captures module (Inbox + Siri Shortcuts API)
- ✅ Calendar module (Weekly view + recurring events)
- ✅ Dashboard (Inbox count + upcoming events)

### Not Yet Deployed:
- ⏳ Journal module
- ⏳ Projects module
- ⏳ Fitness module

You can add these modules later and redeploy without downtime.

## Support

If you run into issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify DNS: `dig samulangarica.com`
3. Test connectivity: `curl -I https://samulangarica.com`
4. Check service status: `docker-compose -f docker-compose.prod.yml ps`
