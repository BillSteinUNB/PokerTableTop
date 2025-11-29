# 🚀 Quick Deployment Checklist

## Before You Deploy

- [ ] All bugs fixed ✅ (raise/all-in issues resolved)
- [ ] Code tested locally
- [ ] Git repository created

## Deployment Steps (Render - Recommended)

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy Server (Render)
1. Go to [render.com](https://render.com)
2. New+ → Web Service
3. Connect GitHub repo
4. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Environment Variables:
   - `PORT` = `10000`
   - `NODE_ENV` = `production`
6. Deploy!
7. **Copy server URL:** `https://your-server.onrender.com`

### 3. Deploy Client (Render)
1. New+ → Static Site
2. Connect same GitHub repo
3. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Environment Variables:
   - `VITE_SERVER_URL` = `https://your-server.onrender.com` (from step 2.7)
5. Deploy!
6. **Your game URL:** `https://your-client.onrender.com`

## Share with Friends

Send them: `https://your-client.onrender.com`

They can:
1. Enter their name
2. Join your lobby code
3. Play!

## Troubleshooting

**Server won't connect?**
- Check CORS settings in `server/index.js`
- Verify `CLIENT_URL` environment variable

**Client can't reach server?**
- Check `VITE_SERVER_URL` is set correctly
- Look at browser console for errors

**Need help?**
- Check server logs in Render dashboard
- See full guide in `DEPLOYMENT_GUIDE.md`

## Cost
- **Free tier:** 750 hours/month (perfect for occasional games)
- **Paid:** $7/month for 24/7 uptime

---

**That's it! Your poker game is now online! 🎉**
