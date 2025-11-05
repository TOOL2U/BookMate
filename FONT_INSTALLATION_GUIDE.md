# 🎯 Font Installation Guide - BookMate Brand

## Required Font Files

You need to place 8 font files in `/public/fonts/` directory:

```
/public/fonts/
├── MadeMirage-Regular.woff2
├── MadeMirage-Regular.woff
├── BebasNeue-Regular.woff2
├── BebasNeue-Regular.woff
├── Aileron-Regular.woff2
├── Aileron-Regular.woff
├── Aileron-SemiBold.woff2
└── Aileron-SemiBold.woff
```

---

## Quick Setup Instructions

### Step 1: Create Directory
```bash
mkdir -p public/fonts
cd public/fonts
```

### Step 2: Download Fonts

#### Bebas Neue (Free - Google Fonts)
1. Visit: https://fonts.google.com/specimen/Bebas+Neue
2. Click "Download family"
3. Extract ZIP
4. Find `BebasNeue-Regular.ttf`
5. Convert to .woff2 and .woff (see conversion section below)

#### Aileron (Free - Font Squirrel)
1. Visit: https://www.fontsquirrel.com/fonts/aileron
2. Click "Webfont Kit" tab
3. Download kit (includes .woff2 and .woff)
4. Extract and copy:
   - `aileron-regular-webfont.woff2` → `Aileron-Regular.woff2`
   - `aileron-regular-webfont.woff` → `Aileron-Regular.woff`
   - `aileron-semibold-webfont.woff2` → `Aileron-SemiBold.woff2`
   - `aileron-semibold-webfont.woff` → `Aileron-SemiBold.woff`

#### Made Mirage (Custom/Premium)
**Option 1: Contact Design Team**
- Request Made Mirage font files from your design team
- Ask for .woff2 and .woff formats

**Option 2: Temporary Fallback (Development Only)**
Until you get Made Mirage, you can use a similar serif font:
```bash
# Use Playfair Display as temporary substitute
# Download from: https://fonts.google.com/specimen/Playfair+Display
```

---

## Font Conversion (if needed)

If you only have `.ttf` or `.otf` files, convert them to web fonts:

### Online Converter (Easiest)
1. Visit: https://cloudconvert.com/
2. Select your .ttf/.otf file
3. Convert to .woff2
4. Repeat for .woff format
5. Download both files

### Command Line (Advanced)
```bash
# Install font tools
npm install -g ttf2woff2 ttf2woff

# Convert
ttf2woff2 BebasNeue-Regular.ttf
ttf2woff BebasNeue-Regular.ttf
```

---

## Verify Installation

After placing files in `/public/fonts/`, your structure should look like:

```
BookMate-webapp/
├── app/
├── components/
├── public/
│   ├── fonts/
│   │   ├── MadeMirage-Regular.woff2
│   │   ├── MadeMirage-Regular.woff
│   │   ├── BebasNeue-Regular.woff2
│   │   ├── BebasNeue-Regular.woff
│   │   ├── Aileron-Regular.woff2
│   │   ├── Aileron-Regular.woff
│   │   ├── Aileron-SemiBold.woff2
│   │   └── Aileron-SemiBold.woff
│   └── ...
└── ...
```

---

## Test Fonts Are Loading

### Method 1: Browser DevTools
1. Run your dev server: `npm run dev`
2. Open page: `http://localhost:3000`
3. Open Chrome DevTools (F12)
4. Go to **Network** tab
5. Filter by "Font"
6. Refresh page
7. You should see all 8 .woff2 files loading successfully

### Method 2: Visual Check
1. Open any page
2. Inspect an h1 element
3. In Computed styles, check `font-family`
4. Should show: "Made Mirage", serif

---

## Troubleshooting

### Fonts not loading?

**Check 1: File paths are correct**
```bash
ls -la public/fonts/
# Should show all 8 files
```

**Check 2: File names match exactly**
- Case-sensitive!
- `MadeMirage-Regular.woff2` NOT `mademirage-regular.woff2`
- `BebasNeue-Regular.woff2` NOT `bebas-neue-regular.woff2`

**Check 3: Clear cache**
```bash
# Stop dev server
# Clear .next folder
rm -rf .next

# Restart
npm run dev
```

**Check 4: Verify @font-face in globals.css**
The font faces are already configured in `app/globals.css`:
```css
@font-face {
  font-family: 'Made Mirage';
  src: url('/fonts/MadeMirage-Regular.woff2') format('woff2'),
       url('/fonts/MadeMirage-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## Temporary Fallback Fonts

If you can't get all fonts immediately, the system will fall back gracefully:

```css
/* Actual fonts */
font-madeMirage → "Made Mirage", serif
font-bebasNeue → "Bebas Neue", ui-sans-serif, system-ui, sans-serif
font-aileron → "Aileron", ui-sans-serif, system-ui, sans-serif

/* Fallbacks (if fonts missing) */
Made Mirage → serif (Georgia, Times New Roman)
Bebas Neue → ui-sans-serif (system default)
Aileron → ui-sans-serif (system default)
```

Your site will still work, but won't have the exact brand look until fonts are installed.

---

## Quick Command Reference

```bash
# Create fonts directory
mkdir -p public/fonts

# List fonts (verify installation)
ls -la public/fonts/

# Check file sizes (should be ~10-100KB each)
du -h public/fonts/*

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

---

## Font File Sizes (Expected)

```
MadeMirage-Regular.woff2     ~20-40KB
MadeMirage-Regular.woff      ~30-50KB
BebasNeue-Regular.woff2      ~15-25KB
BebasNeue-Regular.woff       ~20-35KB
Aileron-Regular.woff2        ~18-30KB
Aileron-Regular.woff         ~25-40KB
Aileron-SemiBold.woff2       ~18-30KB
Aileron-SemiBold.woff        ~25-40KB

Total: ~200KB (reasonable for web fonts)
```

---

## Alternative: Use Google Fonts (Bebas Neue Only)

If you want to use Google's CDN for Bebas Neue instead of self-hosting:

1. Remove Bebas Neue font files from `/public/fonts/`
2. Keep @font-face declarations for Made Mirage and Aileron
3. Add to `app/layout.tsx`:
```tsx
import { Bebas_Neue } from 'next/font/google';

const bebasNeue = Bebas_Neue({ 
  subsets: ['latin'], 
  weight: '400',
  variable: '--font-bebas' 
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${bebasNeue.variable}`}>
      ...
    </html>
  );
}
```

4. Update `globals.css`:
```css
h2, .h2, h3, .h3 {
  font-family: var(--font-bebas, 'Bebas Neue', ui-sans-serif);
}
```

---

## ✅ Installation Complete Checklist

- [ ] Created `/public/fonts/` directory
- [ ] Downloaded and converted all 8 font files
- [ ] Placed files with correct names in `/public/fonts/`
- [ ] Verified files exist: `ls -la public/fonts/`
- [ ] Cleared Next.js cache: `rm -rf .next`
- [ ] Restarted dev server: `npm run dev`
- [ ] Checked Network tab for font loading
- [ ] Visually verified fonts on page
- [ ] All headings use correct fonts

---

## Need Help?

If fonts still aren't loading after following this guide:

1. Check browser console for 404 errors
2. Verify public folder structure
3. Ensure dev server restarted after adding fonts
4. Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
5. Check that font files aren't corrupted (should open in Font Book/Font Viewer)

---

**Status:** Ready for font installation  
**Time Required:** 10-15 minutes  
**Difficulty:** Easy (download + copy files)
