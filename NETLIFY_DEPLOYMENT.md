# QueRegalo - Netlify Deployment Guide

## Deploy to Netlify (Free)

### Option 1: Deploy with Git (Recommended)

1. **Fork this repository** on GitHub
   - Go to https://github.com/davidciria/queregalo
   - Click "Fork" button

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select "GitHub" and authorize
   - Select your forked repository

3. **Configure Build Settings**
   - Build command: `npm install`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

4. **Deploy**
   - Click "Deploy" and wait for build to complete
   - Your site will be live at `https://your-site.netlify.app`

### Option 2: Deploy with Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --dir=public
```

## Features

✅ Gift wishlist management with groups
✅ Gift blocking/unlocking (surprise mechanism)
✅ Mobile-optimized responsive design
✅ Cookie-based user persistence
✅ Secure group IDs
✅ No backend needed for static deployment

## Notes

- The app works completely client-side using browser localStorage
- All data is stored locally in the user's browser
- Groups and gifts are identified by unique IDs
- No server-side database required for static deployment
- Perfect for Netlify's free tier

## Environment Variables

Currently no environment variables required for basic deployment.

## Troubleshooting

**Problem**: API calls return 404
- Solution: Make sure netlify.toml redirects are configured correctly

**Problem**: Page refreshes don't work
- Solution: The netlify.toml should have a catch-all redirect to index.html

## Future Enhancements

For persistence across devices:
- Use MongoDB Atlas (free tier)
- Create Netlify Functions for API endpoints
- Add authentication with Auth0 (free tier)

## Support

For issues, visit: https://github.com/davidciria/queregalo/issues
