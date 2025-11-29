# 🎮 Poker Game - Online Deployment Guide

This guide will help you host your poker game online so you and your friends can play together from anywhere!

## 📋 Table of Contents
1. [Quick Start (Easiest)](#quick-start-easiest)
2. [Option 1: Deploy to Render (Recommended - Free)](#option-1-deploy-to-render-recommended---free)
3. [Option 2: Deploy to Railway (Alternative - Free)](#option-2-deploy-to-railway-alternative---free)
4. [Option 3: Deploy to Your Own Server](#option-3-deploy-to-your-own-server)
5. [Testing Your Deployment](#testing-your-deployment)

---

## Quick Start (Easiest)

The easiest way to host your game is using **Render.com** (free tier). Here's what you'll do:
1. Push your code to GitHub
2. Deploy the server to Render
3. Deploy the client to Render (or Vercel/Netlify)
4. Share the link with your friends!

---

## Option 1: Deploy to Render (Recommended - Free)

### Prerequisites
- GitHub account
- Render account (free at [render.com](https://render.com))

### Step 1: Prepare Your Code

First, let's create the necessary configuration files:

#### 1.1 Create `.gitignore` (if not exists)
Make sure you have a `.gitignore` file in your root directory with:
```
node_modules/
dist/
.env
.DS_Store
*.log
```

#### 1.2 Update server CORS settings
Your server needs to accept connections from your deployed frontend. We'll handle this with environment variables.

### Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy the Server to Render

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name:** `poker-game-server` (or any name you like)
   - **Region:** Choose closest to you
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

5. **Add Environment Variables:**
   - Click "Advanced" → "Add Environment Variable"
   - Add: `PORT` = `10000` (Render uses this port)
   - Add: `NODE_ENV` = `production`

6. **Click "Create Web Service"**

7. **Wait for deployment** (takes 2-5 minutes)

8. **Copy your server URL** - it will look like: `https://poker-game-server.onrender.com`

### Step 4: Deploy the Client to Render

1. **Click "New +" → "Static Site"**
2. **Connect the same GitHub repository**
3. **Configure:**
   - **Name:** `poker-game-client`
   - **Root Directory:** Leave blank (root)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Add Environment Variable:**
   - Click "Advanced" → "Add Environment Variable"
   - Add: `VITE_SERVER_URL` = `https://poker-game-server.onrender.com` (your server URL from Step 3)

5. **Click "Create Static Site"**

6. **Wait for deployment**

7. **Your game is live!** Copy the URL (e.g., `https://poker-game-client.onrender.com`)

### Step 5: Update Your Code for Production

You need to update your client code to use the server URL from environment variables.

---

## Option 2: Deploy to Railway (Alternative - Free)

Railway is another great option with a generous free tier.

### Step 1: Push to GitHub (same as Option 1, Step 2)

### Step 2: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Railway will detect both the client and server**

For the **Server**:
- **Root Directory:** `server`
- **Start Command:** `npm start`
- **Add Environment Variable:** `PORT` (Railway auto-assigns this)

For the **Client**:
- **Root Directory:** `.` (root)
- **Build Command:** `npm run build`
- **Start Command:** `npm run preview` (or use Vite preview)

Railway will give you URLs for both services.

---

## Option 3: Deploy to Your Own Server

If you have your own server (VPS, cloud instance, etc.):

### Requirements
- Linux server with Node.js installed
- Domain name (optional but recommended)
- SSH access

### Steps

1. **SSH into your server:**
```bash
ssh user@your-server-ip
```

2. **Install Node.js (if not installed):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone your repository:**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

4. **Install and build the client:**
```bash
npm install
npm run build
```

5. **Install and start the server:**
```bash
cd server
npm install
npm start
```

6. **Use PM2 to keep server running:**
```bash
sudo npm install -g pm2
pm2 start index.js --name poker-server
pm2 startup
pm2 save
```

7. **Set up Nginx as reverse proxy** (optional but recommended):
```bash
sudo apt install nginx
```

Create Nginx config at `/etc/nginx/sites-available/poker`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client (static files)
    location / {
        root /path/to/YOUR_REPO_NAME/dist;
        try_files $uri $uri/ /index.html;
    }

    # Server (WebSocket + API)
    location /socket.io/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/poker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Testing Your Deployment

### 1. Test the Server
Visit your server URL in a browser. You should see a basic response or connection message.

### 2. Test the Client
1. Open your client URL
2. Create a lobby
3. Copy the lobby code
4. Open the same URL in a different browser/incognito window
5. Join with the lobby code
6. Start the game!

### 3. Test with Friends
Share your client URL with friends. They can:
1. Open the URL
2. Enter their name
3. Join your lobby with the code
4. Play!

---

## 🔧 Troubleshooting

### Server won't connect
- Check that CORS is configured correctly
- Verify the server URL in your client environment variables
- Check server logs for errors

### WebSocket connection fails
- Make sure your hosting provider supports WebSockets
- Check that the Socket.io client is connecting to the correct URL
- Verify firewall/security group settings

### Game doesn't load
- Check browser console for errors
- Verify the build completed successfully
- Check that environment variables are set correctly

---

## 📱 Sharing with Friends

Once deployed, share this with your friends:

**"Hey! Let's play poker! 🎮"**

1. Go to: `https://your-game-url.com`
2. Enter your name
3. Either:
   - Click "Create Lobby" (if you're hosting)
   - Click "Join Lobby" and enter code: `XXXXXX`
4. Wait for everyone to join
5. Host clicks "Start Game"
6. Have fun! 🎉

---

## 💰 Cost Breakdown

### Free Options:
- **Render Free Tier:** 750 hours/month (enough for occasional games)
- **Railway Free Tier:** $5 credit/month (usually enough)
- **Vercel/Netlify (Client only):** Unlimited for personal projects

### Paid Options (if you need 24/7 uptime):
- **Render Starter:** $7/month
- **Railway:** Pay as you go (~$5-10/month)
- **DigitalOcean Droplet:** $6/month

---

## 🚀 Next Steps

1. Choose your deployment option
2. Follow the steps above
3. Test with a friend
4. Share and enjoy!

Need help? Check the logs or create an issue on GitHub!
