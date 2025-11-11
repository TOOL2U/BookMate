# BookMate Custom Fonts

This directory contains the custom brand fonts for the BookMate mobile app.

## Required Font Files

Please add the following font files to this directory:

### Made Mirage (Elegant serif for branding & headings)
- `MadeMirage-Regular.ttf`
- `MadeMirage-Bold.ttf`

### Bebas Neue (Bold sans-serif for section titles)
- `BebasNeue-Regular.ttf`

### Aileron (Clean sans-serif for body and UI text)
- `Aileron-Regular.ttf`
- `Aileron-Bold.ttf`

## Font Sources

Contact the design team or download from:
- Made Mirage: [Source needed]
- Bebas Neue: https://www.dafont.com/bebas-neue.font
- Aileron: https://www.dafont.com/aileron.font

## Usage in App

Fonts are loaded in `src/hooks/useFonts.ts` and can be used via:

```tsx
<Text style={{ fontFamily: 'Made Mirage' }}>Your Build, Our Passion</Text>
<Text style={{ fontFamily: 'Bebas Neue' }}>DASHBOARD</Text>
<Text style={{ fontFamily: 'Aileron' }}>Body text here</Text>
<Text style={{ fontFamily: 'Aileron-Bold' }}>Bold body text</Text>
```

## Font Roles

| Font | Role | Example |
|------|------|----------|
| **Made Mirage** | Branding / Hero Titles | App logo, splash screen |
| **Bebas Neue** | Section Titles / Cards | Screen titles, card headers |
| **Aileron** | Body Text / UI Elements | Labels, descriptions, buttons |
