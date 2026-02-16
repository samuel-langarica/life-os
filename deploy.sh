#!/bin/bash

# Life OS Deployment Script for VPS
# Run this on your VPS after cloning the repo

set -e

echo "🚀 Life OS Deployment Script"
echo "============================"

# Check if running on VPS
if [ ! -f "/etc/hostname" ]; then
    echo "❌ This script should be run on your VPS, not locally"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found"
    echo "📝 Please create it from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)

echo "✅ Environment variables loaded"

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
fi

# Update nginx.conf with actual domain
echo "🔧 Configuring Nginx..."
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx/nginx.conf
echo "✅ Nginx configured"

# Initial SSL setup (HTTP only, before certificates)
echo "🔐 Setting up initial SSL configuration..."
cat > nginx/nginx-initial.conf <<EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name ${DOMAIN};

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
EOF

# Use initial config first
cp nginx/nginx-initial.conf nginx/nginx.conf

echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@${DOMAIN} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

# Restore full nginx config with SSL
echo "🔧 Enabling HTTPS configuration..."
git checkout nginx/nginx.conf
sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" nginx/nginx.conf

# Reload nginx with SSL config
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🌐 Your app should be available at: https://${DOMAIN}"
echo ""
echo "📝 Next steps:"
echo "1. Visit https://${DOMAIN} in your browser"
echo "2. Create your first user account"
echo "3. Start using Life OS!"
echo ""
echo "📖 Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  - Database backup: docker-compose -f docker-compose.prod.yml exec db pg_dump -U lifeos lifeos > backup.sql"
