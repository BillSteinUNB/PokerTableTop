# Render.com Configuration Guide

## Server Deployment (Web Service)

### Service Settings
- **Name:** `poker-server` (or any name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** Free

### Environment Variables
Click "Environment" tab and add:
- `PORT` = `10000` (Render assigns this automatically, but you can set it)
- `NODE_ENV` = `production`
- `CLIENT_URL` = (leave blank for now, add after client is deployed)

### After Deployment
- Copy your server URL: `https://poker-server-XXXX.onrender.com`
- You'll need this for the client deployment

---

## Client Deployment (Static Site)

### Service Settings
- **Name:** `poker-client` (or any name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** (leave blank)
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

### Environment Variables
Click "Environment" tab and add:
- `VITE_SERVER_URL` = `https://poker-server-XXXX.onrender.com` (your server URL from above)

### After Deployment
- Your game URL: `https://poker-client-XXXX.onrender.com`
- Share this with friends!

---

## Update Server with Client URL (Optional but Recommended)

After client is deployed:
1. Go back to **Server** service settings
2. Add environment variable:
   - `CLIENT_URL` = `https://poker-client-XXXX.onrender.com`
3. This allows the server to properly configure CORS

---

## Troubleshooting

### Build Failed - "Missing script: build"
**Problem:** You used the client build command for the server
**Solution:** 
- Server build command should be: `npm install` (no build step)
- Client build command should be: `npm install && npm run build`

### Server starts but client can't connect
**Problem:** CORS or wrong server URL
**Solution:**
- Check `VITE_SERVER_URL` in client environment variables
- Make sure it matches your server URL exactly
- Check browser console for errors

### "Application failed to respond"
**Problem:** Server isn't listening on the right port
**Solution:**
- Make sure `PORT` environment variable is set
- Server should use `process.env.PORT || 3002`

---

## Deployment Order

1. ✅ **Deploy Server first** (Web Service)
2. ✅ **Copy server URL**
3. ✅ **Deploy Client** (Static Site) with server URL
4. ✅ **Update server** with client URL (optional)
5. ✅ **Test and share!**

---

## Free Tier Limits

- **750 hours/month** per service
- **Services spin down after 15 min of inactivity**
- **First request may take 30-60 seconds** (cold start)
- Perfect for playing with friends occasionally!

---

## Quick Deploy Checklist

Server:
- [ ] Root Directory: `server`
- [ ] Build: `npm install`
- [ ] Start: `npm start`
- [ ] Deployed successfully
- [ ] URL copied

Client:
- [ ] Root Directory: (blank)
- [ ] Build: `npm install && npm run build`
- [ ] Publish: `dist`
- [ ] `VITE_SERVER_URL` set to server URL
- [ ] Deployed successfully
- [ ] URL ready to share!
