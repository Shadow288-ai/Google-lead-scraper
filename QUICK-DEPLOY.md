# Quick Deployment Guide

## Fastest Option: Docker Compose (Recommended)

### 1. On Your Server/VPS:

```bash
# Clone or upload your project
git clone <your-repo> google-maps-scraper
cd google-maps-scraper

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

**That's it!** Your scraper is now running at `http://your-server-ip:8080`

### 2. For Production with HTTPS:

#### Option A: Use Caddy (Automatic HTTPS)

1. Install Caddy on your server
2. Create `Caddyfile`:
```
your-domain.com {
    reverse_proxy localhost:8080
}
```
3. Run: `caddy run`

#### Option B: Use Nginx + Certbot

1. Install Nginx: `sudo apt install nginx`
2. Configure reverse proxy (see DEPLOYMENT.md)
3. Install SSL: `sudo certbot --nginx -d your-domain.com`

---

## Cloud Platform Options (No Server Management)

### Railway (Easiest Cloud Option)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Docker and deploys
5. Add persistent volume for `gmapsdata`
6. Done! Railway gives you a URL

### Render.com

1. Go to [render.com](https://render.com) and sign up
2. "New +" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - Environment: Docker
   - Build Command: (leave empty, auto-detected)
   - Start Command: (auto-detected)
5. Add Disk for persistent storage
6. Deploy!

---

## Cost Comparison

| Option | Cost | Difficulty | Best For |
|--------|------|------------|----------|
| Docker on VPS (DigitalOcean/Linode) | $5-10/mo | Medium | Full control |
| Railway | $5-20/mo | Easy | Quick deployment |
| Render | Free tier available | Easy | Testing/Small projects |
| Fly.io | Pay as you go | Medium | Global distribution |
| AWS/GCP/Azure | Variable | Hard | Enterprise |

---

## Next Steps After Deployment

1. ✅ **Set up domain** (point DNS to your server IP)
2. ✅ **Enable HTTPS** (Caddy or Certbot)
3. ✅ **Set up backups** (backup `gmapsdata` folder regularly)
4. ✅ **Monitor** (UptimeRobot for uptime monitoring)
5. ✅ **Secure** (firewall rules, rate limiting if public)

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check logs: `docker-compose logs -f`
- View container status: `docker ps`

