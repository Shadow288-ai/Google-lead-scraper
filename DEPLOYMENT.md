# Deployment Guide

This guide covers multiple options for hosting the Google Maps Scraper online.

## Option 1: Using Docker (Recommended - Easiest)

### Requirements
- Docker installed on your server
- Domain name (optional, for HTTPS)

### Step 1: Build Docker Image

```bash
docker build -t google-maps-scraper .
```

### Step 2: Run Container

```bash
# Create data directory
mkdir -p gmapsdata

# Run with volume for persistent storage
docker run -d \
  --name google-maps-scraper \
  -p 8080:8080 \
  -v $(pwd)/gmapsdata:/gmapsdata \
  -v $(pwd)/extract_contact_emails.py:/extract_contact_emails.py \
  -v $(pwd)/requirements.txt:/requirements.txt \
  google-maps-scraper \
  -data-folder /gmapsdata
```

### Step 3: Set up Reverse Proxy (Nginx/Caddy)

For HTTPS and domain access, use Nginx or Caddy as a reverse proxy.

#### With Caddy (easiest for HTTPS):

Create `Caddyfile`:
```
your-domain.com {
    reverse_proxy localhost:8080
}
```

Run Caddy:
```bash
docker run -d \
  --name caddy \
  -p 80:80 -p 443:443 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:latest
```

---

## Option 2: Cloud Platforms

### Railway.app

1. **Create account** at [railway.app](https://railway.app)

2. **Create new project** and connect your GitHub repository

3. **Configure build**:
   - Build Command: `docker build -t google-maps-scraper .`
   - Start Command: `docker run -p $PORT:8080 -v $PWD/gmapsdata:/gmapsdata google-maps-scraper -data-folder /gmapsdata -addr ":$PORT"`

4. **Set environment variables** (if needed)

5. **Add persistent volume** for `gmapsdata` folder

### Render.com

1. **Create account** at [render.com](https://render.com)

2. **New Web Service** → Connect GitHub repo

3. **Settings**:
   - Build Command: `docker build -t google-maps-scraper .`
   - Start Command: `docker run -p $PORT:8080 -v /opt/render/gmapsdata:/gmapsdata google-maps-scraper -data-folder /gmapsdata -addr ":$PORT"`

4. **Add Disk** for persistent storage (free tier: 1GB)

### Fly.io

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`

2. **Login**: `fly auth login`

3. **Create `fly.toml`**:
```toml
app = "your-app-name"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[[volumes]]
  source = "gmapsdata"
  destination = "/gmapsdata"
```

4. **Deploy**: `fly deploy`

### DigitalOcean App Platform

1. **Create account** at [digitalocean.com](https://www.digitalocean.com)

2. **Create App** → GitHub integration

3. **Configure**:
   - Build Type: Docker
   - Dockerfile path: `Dockerfile`
   - HTTP Port: `8080`

4. **Add Volume** for persistent storage

---

## Option 3: VPS (Virtual Private Server)

### Using Ubuntu/Debian VPS

#### Step 1: Set up Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y
```

#### Step 2: Clone Repository

```bash
git clone https://github.com/your-repo/google-maps-scraper.git
cd google-maps-scraper
```

#### Step 3: Create docker-compose.yml

```yaml
version: '3.8'

services:
  scraper:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./gmapsdata:/gmapsdata
      - ./extract_contact_emails.py:/extract_contact_emails.py
      - ./requirements.txt:/requirements.txt
    command: -data-folder /gmapsdata
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - scraper
    restart: unless-stopped
```

#### Step 4: Create nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream scraper {
        server scraper:8080;
    }

    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://scraper;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Step 5: Deploy

```bash
docker-compose up -d
```

#### Step 6: Set up SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (if using Nginx separately)
sudo certbot --nginx -d your-domain.com
```

---

## Option 4: AWS/GCP/Azure

### AWS EC2

1. **Launch EC2 instance** (Ubuntu 20.04+)
2. **Security Group**: Allow ports 80, 443, 8080
3. **SSH into instance** and follow VPS steps above
4. **Optional**: Use Elastic IP for static IP
5. **Optional**: Use ALB (Application Load Balancer) + Route 53 for domain

### AWS ECS/Fargate

1. **Push Docker image** to ECR
2. **Create ECS cluster** and task definition
3. **Create service** with load balancer
4. **Set up persistent storage** with EFS

### Google Cloud Run

1. **Build and push image**:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/google-maps-scraper
```

2. **Deploy**:
```bash
gcloud run deploy google-maps-scraper \
  --image gcr.io/YOUR_PROJECT/google-maps-scraper \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

---

## Important Notes

### Persistent Storage

The application stores data in the `gmapsdata` folder. Ensure this is:
- Mounted as a volume in Docker
- Backed up regularly
- Has sufficient disk space

### Python Dependencies

For email extraction to work, you need:
1. Python 3 installed in the container
2. `requirements.txt` dependencies installed
3. The `extract_contact_emails.py` script accessible

### Environment Variables

You might want to set:
- `PORT`: Server port (default: 8080)
- `DISABLE_TELEMETRY=1`: Disable telemetry (optional)

### Security Considerations

1. **Use HTTPS** - Always use SSL/TLS in production
2. **Firewall** - Only expose ports 80/443 publicly
3. **Authentication** - Consider adding basic auth or OAuth if public
4. **Rate Limiting** - Implement rate limiting for API endpoints
5. **Backups** - Regularly backup the `gmapsdata` folder

### Recommended Setup for Production

1. **Use Docker Compose** for easy management
2. **Nginx/Caddy** as reverse proxy for HTTPS
3. **Let's Encrypt** for free SSL certificates
4. **Backup script** for data folder
5. **Monitoring** (optional): Use tools like UptimeRobot to monitor uptime

---

## Quick Start Script

Save as `deploy.sh`:

```bash
#!/bin/bash

# Build image
docker build -t google-maps-scraper .

# Create data directory
mkdir -p gmapsdata

# Run container
docker run -d \
  --name google-maps-scraper \
  -p 8080:8080 \
  -v $(pwd)/gmapsdata:/gmapsdata \
  -v $(pwd)/extract_contact_emails.py:/extract_contact_emails.py \
  -v $(pwd)/requirements.txt:/requirements.txt \
  --restart unless-stopped \
  google-maps-scraper \
  -data-folder /gmapsdata

echo "Scraper is running on http://localhost:8080"
echo "View logs: docker logs -f google-maps-scraper"
echo "Stop: docker stop google-maps-scraper"
```

Make executable: `chmod +x deploy.sh`
Run: `./deploy.sh`

