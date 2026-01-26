# 📋 Quick Reference Card - Big Ron Jones Website

## 🎯 Essential Commands

```bash
# View the website
open index.html

# Start local server (recommended)
python3 -m http.server 8000
# Then visit: http://localhost:8000

# Generate placeholder images
open placeholder-generator.html
```

## 📁 Key Files to Edit

| File | What to Edit |
|------|--------------|
| `index.html` | All website content (text, images, links) |
| `css/variables.css` | Colors, fonts, spacing |
| `js/main.js` | Forms, navigation behavior |
| `js/animations.js` | Animation timing, effects |

## 🎨 Brand Colors (css/variables.css)

```css
--color-primary: #FF4D00;    /* Vibrant Orange */
--color-dark: #0A0E27;       /* Deep Navy */
--color-accent: #00D9FF;     /* Electric Cyan */
```

## 📸 Required Images (save to assets/images/)

- `ron-portrait.jpg` (800x1000px)
- `transformation-1.jpg` (800x600px)
- `transformation-2.jpg` (800x600px)
- `transformation-3.jpg` (800x600px)
- `ig-1.jpg` to `ig-6.jpg` (600x600px each)

## 🔗 Important Links to Update in index.html

Search and replace:
- Email: `contact@bigronjones.com`
- Instagram: `@bigronjones`
- Social media URLs in footer
- Phone number (if adding one)

## ⚙️ Form Integration

Edit `js/main.js` - Line ~51:
```javascript
function handleContactSubmit(e) {
  // Replace alert with your form service
  // Example: Formspree, FormSubmit, etc.
}
```

## 📊 Add Analytics

Add before `</head>` in `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🧪 Testing Checklist

- [ ] Works in Chrome, Firefox, Safari
- [ ] Responsive on mobile (iPhone, Android)
- [ ] All links work
- [ ] Forms submit (or show proper alert)
- [ ] No console errors (F12 → Console)
- [ ] Images load properly
- [ ] Mobile menu opens/closes
- [ ] Animations play smoothly

## 🚀 Deploy Options

**Netlify (Easiest):**
1. Go to netlify.com/drop
2. Drag the `bigronjones` folder
3. Done! (includes free HTTPS)

**GitHub Pages:**
1. Create GitHub repo
2. Push files
3. Enable Pages in Settings

**Traditional Hosting:**
- Upload all files via FTP
- Point domain to directory

## 📈 Performance Tips

1. **Optimize images before adding:**
   - Use TinyPNG.com
   - Convert to WebP
   - Keep under 200KB each

2. **Test performance:**
   - F12 → Lighthouse → Run audit
   - Aim for 90+ on all metrics

3. **Monitor after launch:**
   - Google Analytics for traffic
   - Search Console for SEO
   - Uptime monitor for downtime

## 🆘 Troubleshooting

**Images not showing?**
- Check file names match exactly
- Ensure files are in `assets/images/`
- Use lowercase, no spaces

**Animations not working?**
- Check internet connection (loads GSAP from CDN)
- Clear browser cache
- Check console for errors (F12)

**Mobile menu stuck?**
- Clear cache and hard reload
- Check JavaScript console for errors

**Forms not submitting?**
- Currently shows alert (expected)
- Integrate with Formspree or similar

## 📚 Documentation Files

- `README.md` - Complete guide
- `QUICKSTART.md` - 5-minute setup
- `DEPLOYMENT.md` - Launch checklist
- `PROJECT-SUMMARY.md` - Overview

## 💡 Quick Customizations

**Change hero title:**
```html
<!-- Find in index.html around line 66 -->
<h1 class="hero-title">
  <span class="line">YOUR NEW</span>
  <span class="line">HEADLINE HERE</span>
</h1>
```

**Add new section:**
```html
<!-- Copy any section in index.html -->
<section class="your-section" id="your-id">
  <div class="container">
    <!-- Your content -->
  </div>
</section>
```

**Change animation speed:**
```javascript
// In js/animations.js
duration: 1,  // Change to 0.5 for faster, 2 for slower
```

## 🎁 Bonus Features Ready to Enable

Uncomment in `js/animations.js` (bottom):
```javascript
// Scroll progress bar
initScrollProgress();
```

## 📞 Need More Help?

1. Check code comments in files
2. Read documentation (README.md)
3. Search for error in console
4. Test in incognito mode
5. Try different browser

## ✅ Before Going Live

- [ ] Real images added and optimized
- [ ] All content proofread
- [ ] Forms connected to backend
- [ ] Analytics code added
- [ ] Tested on real devices
- [ ] Lighthouse audit passed
- [ ] Links all work
- [ ] Social media updated

---

## 🎯 Most Common Edits

1. **Update contact email** → Search "contact@bigronjones.com" in index.html
2. **Change colors** → Edit css/variables.css
3. **Add images** → Save to assets/images/ with correct names
4. **Connect form** → Edit js/main.js handleContactSubmit function
5. **Add tracking** → Insert GA code in index.html <head>

---

**Keep this file handy for quick reference! 📌**

Everything you need is documented.  
The website is production-ready once you add images!

**Go launch and transform lives! 💪🚀**
