# Deployment Guide

## Overview

centra_point can be deployed in three ways:

1. **Local Development** — Build from source locally
2. **Self-Hosted (Production)** — Pull pre-built images from DockerHub
3. **Cloud Deployment** — AWS, DigitalOcean, Heroku (coming soon)

## Option 1: Local Development

Build Docker images locally. Best for development and testing.

```bash
cd centra_point
cp .env.example .env
docker compose up -d

# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:8000/api
- Admin: http://localhost:8000/admin
- nginx: http://localhost

## Option 2: Self-Hosted with DockerHub Images

This is the **recommended production setup**. Images are pre-built on DockerHub, so deployment is instant.

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 16+ (optional, can use Docker image)
- 2GB+ RAM, 10GB+ disk space

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/tibernium/centra_point.git
cd centra_point
```

**2. Configure environment**
```bash
cp .env.example .env

# Edit .env with your values
# Critical:
DJANGO_SECRET_KEY=your-secret-key-change-this
DB_PASSWORD=your-strong-password
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

**3. Start with DockerHub images**
```bash
docker compose -f docker-compose.prod.yml up -d

# Run migrations (first time only)
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

**4. Verify everything is running**
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

**Access:**
- Frontend: http://localhost (or your domain)
- API: http://localhost/api
- Admin: http://localhost/admin

## Option 3: Cloud Deployment

### AWS ECS + RDS

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name centra-point

# Use docker-compose to generate ECS task definition
docker-compose convert > ecs-task-definition.json

# Deploy
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### DigitalOcean App Platform

1. Go to DigitalOcean App Platform
2. Connect GitHub repo
3. Choose `docker-compose.prod.yml`
4. Set environment variables (from .env)
5. Deploy

### Heroku (Coming Soon)

## SSL/HTTPS Setup

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update nginx.conf to use SSL
# Copy certificates into ./certs/

# Restart
docker compose -f docker-compose.prod.yml restart nginx
```

### Update nginx.conf

Add to nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Rest of config...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Backup & Restore

### Backup PostgreSQL

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres centra_point > backup.sql
```

### Restore PostgreSQL

```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres centra_point < backup.sql
```

### Backup Media Files

```bash
tar -czf media-backup.tar.gz ./backend/media/
```

## Monitoring

### Check Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Health Checks

Services have built-in health checks:

```bash
docker compose -f docker-compose.prod.yml ps

# All should show "healthy" status
```

## Updates

### Pull Latest Images

```bash
# Update code
git pull origin main

# Pull latest images from DockerHub
docker compose -f docker-compose.prod.yml pull

# Restart services
docker compose -f docker-compose.prod.yml up -d

# Run migrations (if needed)
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Auto-updates with GitHub Actions

When you push to `main` branch:
1. GitHub Actions workflow runs
2. Builds new Docker images
3. Pushes to DockerHub
4. Your server pulls latest on next deployment

## Troubleshooting

### Services won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Nuclear option (removes volumes!)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

### Database connection issues

```bash
# Test connection
docker compose -f docker-compose.prod.yml exec backend python manage.py dbshell

# Reset database (WARNING: deletes all data)
docker compose -f docker-compose.prod.yml exec backend python manage.py flush
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Check disk usage
docker system df
```

## Security Best Practices

1. **Change Django secret key** in production
2. **Set DEBUG=False** in .env
3. **Use strong database password**
4. **Enable HTTPS** with SSL certificate
5. **Regular backups** of database and media files
6. **Keep images updated** — pull latest weekly
7. **Firewall rules** — only expose ports 80, 443
8. **Monitor logs** for suspicious activity

## Performance Tuning

### PostgreSQL

```env
# In .env
DB_POOL_SIZE=10
```

### Redis (for caching)

Already included, used for session management and future caching.

### Django Gunicorn

Adjust workers in docker-compose:

```yaml
backend:
  command: gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:8000
```

## Scaling

### Horizontal Scaling

For high traffic:

```yaml
# Add multiple backend instances behind load balancer
backend-1:
  # ...
backend-2:
  # ...
backend-3:
  # ...
```

Use nginx as load balancer (already configured).

### Vertical Scaling

Increase server resources:
- More CPU cores
- More RAM
- Faster disk (SSD)

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Check health: `docker compose ps`
3. GitHub Issues: https://github.com/tibernium/centra_point/issues
