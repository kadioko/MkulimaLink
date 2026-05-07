# 🚀 MkulimaLink v2.0 Deployment Guide

Complete guide for deploying MkulimaLink to production environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deploy](#quick-deploy)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [SSL Configuration](#ssl-configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js** 20+ 
- **MongoDB** 7+ (local or Atlas)
- **Redis** 7+ (optional, for caching)
- **Domain name** (recommended)
- **SSL Certificate** (required for production)

## Quick Deploy

### Option 1: PM2 (Recommended)

```bash
# Clone and setup
git clone https://github.com/kadioko/MkulimaLink.git
cd MkulimaLink
npm run install-all

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Build frontend
cd frontend && npm run build && cd ..

# Start with PM2
npm install -g pm2
pm2 start backend/server.js --name mkulimalink
pm2 save
pm2 startup
```

### Option 2: Docker (Coming Soon)

```bash
docker-compose up -d
```

## AWS Deployment

### Step 1: Launch EC2 Instance

1. **Sign in to AWS Console**
   - Go to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**:
   - **Name**: MkulimaLink-Server
   - **AMI**: Ubuntu Server 20.04 LTS (Free tier eligible)
   - **Instance Type**: t2.micro (1 vCPU, 1GB RAM)
   - **Key Pair**: Create new or use existing
   - **Network Settings**: 
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Allow Custom TCP (port 5000) - for API

3. **Storage**: 
   - 30 GB gp2 (Free tier includes up to 30GB)

4. **Launch Instance**

### Step 2: Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-instance-public-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

### Step 4: Deploy Application

```bash
# Clone repository
cd /home/ubuntu
git clone <your-repository-url> MkulimaLink
cd MkulimaLink

# Install backend dependencies
npm install

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# Create uploads directory
mkdir -p uploads/products

# Create .env file
nano .env
```

Add your production environment variables:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mkulimalink
JWT_SECRET=your_strong_production_secret
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
AFRICASTALKING_API_KEY=your_key
AFRICASTALKING_USERNAME=your_username
COMMISSION_RATE=0.05
PREMIUM_MONTHLY_PRICE=10000
PREMIUM_YEARLY_PRICE=100000
```

### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mkulimalink
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve static files
    location / {
        root /home/ubuntu/MkulimaLink/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /home/ubuntu/MkulimaLink/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/mkulimalink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Start Application with PM2

```bash
cd /home/ubuntu/MkulimaLink
pm2 start backend/server.js --name mkulimalink
pm2 startup systemd
pm2 save
```

### Step 7: Configure SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### Step 8: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## MongoDB Atlas (Alternative to Local MongoDB)

For better scalability, use MongoDB Atlas:

1. **Create MongoDB Atlas Account**
   - Go to mongodb.com/cloud/atlas
   - Create free cluster (512MB storage)

2. **Configure Cluster**
   - Choose AWS as provider
   - Select region closest to your EC2 instance
   - Create database user
   - Whitelist EC2 instance IP

3. **Update .env**:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mkulimalink?retryWrites=true&w=majority
```

## AWS S3 for File Storage (Optional)

For better file management:

1. **Create S3 Bucket**
   - Go to S3 console
   - Create bucket (e.g., mkulimalink-uploads)
   - Configure CORS

2. **Create IAM User**
   - Create user with S3 access
   - Get Access Key ID and Secret

3. **Update .env**:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=mkulimalink-uploads
```

4. **Update code to use S3** (optional enhancement)

## Monitoring and Maintenance

### PM2 Monitoring
```bash
pm2 monit
pm2 logs mkulimalink
pm2 restart mkulimalink
```

### MongoDB Backup
```bash
# Create backup script
nano /home/ubuntu/backup-mongo.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Make executable and add to cron:
```bash
chmod +x /home/ubuntu/backup-mongo.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-mongo.sh
```

### Application Updates
```bash
cd /home/ubuntu/MkulimaLink
git pull
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart mkulimalink
```

## Performance Optimization

### Enable Nginx Caching
```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... other proxy settings
}
```

### Database Indexing
```javascript
// Already configured in models, but verify:
db.products.createIndex({ name: "text", description: "text" })
db.products.createIndex({ category: 1, status: 1 })
db.marketprices.createIndex({ product: 1, region: 1, date: -1 })
```

## Troubleshooting

### Application won't start
```bash
pm2 logs mkulimalink --lines 100
```

### MongoDB connection issues
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

### Nginx issues
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Check disk space
```bash
df -h
du -sh /home/ubuntu/MkulimaLink/*
```

## Cost Optimization

AWS Free Tier includes:
- 750 hours/month of t2.micro EC2 instance
- 30 GB EBS storage
- 15 GB data transfer out

To stay within free tier:
- Use MongoDB Atlas free tier (512MB)
- Optimize images before upload
- Enable caching
- Monitor data transfer

## Security Checklist

- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Configure firewall (UFW)
- [ ] Enable SSL/HTTPS
- [ ] Use strong passwords
- [ ] Regular security updates
- [ ] Configure fail2ban
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets

## Alternative Deployment Options

### Heroku
```bash
# Install Heroku CLI
heroku create mkulimalink
heroku addons:create mongolab:sandbox
git push heroku main
```

### DigitalOcean
- Similar to AWS but simpler interface
- $5/month droplet (not free)
- One-click MongoDB installation

### Vercel (Frontend only)
```bash
cd frontend
vercel --prod
```

## Support

For deployment issues:
- Check logs: `pm2 logs`
- MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Contact: support@mkulimalink.co.tz
