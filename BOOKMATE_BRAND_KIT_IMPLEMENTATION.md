# 🎨 BookMate Brand Kit — Implementation Guide

**Status**: ✅ Configured & Ready  
**Last Updated**: November 5, 2025  
**Tailwind Version**: v4.1.16  

---

## 📋 Brand Identity Overview

**Style Direction**:  
Modern, minimal, and professional with a sleek dark theme aesthetic. Designed to convey intelligence, precision, and trust — balanced with bold highlights that reflect innovation and clarity.

**Brand Personality**:  
BookMate represents precision, control, and simplicity in financial and business operations — combining professionalism with intuitive, modern design. It's bold yet approachable, technical yet human-centered.

---

## 🎨 Color Palette

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary (Accents & Buttons)** | Yellow | `#FFF02B` | CTAs, highlights, icons, active states, emphasis |
| **Primary Dark Base** | Black | `#000000` | Navbar, dividers, subtle contrast sections |
| **Secondary Backgrounds** | Dark Grey | `#121212` | Default dark background for the app |
| **Tertiary / Neutral** | Grey | `#4D4D4D` | Text, placeholders, borders, muted tones |
| **Text / Contrast** | White / Light Grey | `#F3F3F3` | Clean, readable text for dark mode |

### Tailwind Class Reference

```tsx
// Yellow (Primary Accent)
bg-yellow          // #FFF02B solid background
text-yellow        // #FFF02B text color
border-yellow      // #FFF02B borders
bg-yellow/10       // 10% opacity yellow background
hover:bg-yellow    // Yellow on hover

// Backgrounds
bg-black           // #000000
bg-bg-app          // #121212 (app background)
bg-bg-card         // #171717 (card background)
bg-grey-dark       // #121212

// Text
text-text-primary  // #f3f3f3 (white-ish)
text-text-secondary // #b5b5b5 (light grey)
text-muted         // #b5b5b5
text-black         // #000000 (for text on yellow)

// Borders
border-border-card // #2a2a2a
border-border-light // #2a2a2a

// Status Colors
text-success       // #00ff88 (green)
text-error         // #ff3366 (pink/red)
text-warning       // #FFF02B (yellow)
```

---

## ✍️ Typography System

### Font Stack

| Font | Usage | CSS Variable | Tailwind Class |
|------|-------|--------------|----------------|
| **Made Mirage** | Display Font — Titles, hero text, major headings | `--font-made-mirage` | `font-madeMirage` |
| **Bebas Neue** | Accent Font — Menus, headers, dashboard labels | `--font-bebas-neue` | `font-bebasNeue` |
| **Aileron** | Body Font — Paragraphs, inputs, UI text | `--font-aileron` | `font-aileron` |

### Implementation

```tsx
// Large display titles (h1, hero sections)
<h1 className="font-madeMirage text-5xl text-yellow">
  BookMate
</h1>

// Section headers, stats, dashboard labels
<h2 className="font-bebasNeue text-2xl uppercase tracking-wide text-white">
  Monthly Revenue
</h2>

// Body text, form inputs, UI elements
<p className="font-aileron text-base text-text-secondary">
  Your P&L data for November 2025
</p>
```

### Typography Guidelines

- **Display (Made Mirage)**: Use for page titles, hero text, and major section headings. Pairs well with yellow accent color.
- **Headers (Bebas Neue)**: Use uppercase for dashboard stats, navigation items, and section labels. Bold and impactful.
- **Body (Aileron)**: Default for all UI text, form labels, table data, and paragraphs. Clean and highly readable.

---

## 💡 UI Design Language

### Core Principles

1. **Dark Mode by Default**: Layered greys (#121212, #171717) with soft yellow glows
2. **Minimal Icons**: White vector icons with transparent centers
3. **Rounded Corners**: Modern aesthetic with `rounded-lg`, `rounded-xl` borders
4. **Smooth Transitions**: All interactive elements have `transition-all duration-200`
5. **Subtle Depth**: Use shadows for elevation, not heavy borders

### Button System

```tsx
// Primary CTA (Yellow)
<Button variant="primary">
  Submit
</Button>
// Output: bg-yellow text-black shadow-glow

// Secondary (Dark Grey)
<Button variant="secondary">
  Cancel
</Button>
// Output: bg-grey-dark text-yellow border border-yellow/20

// Ghost (Transparent)
<Button variant="ghost">
  Learn More
</Button>
// Output: bg-transparent text-muted hover:bg-grey-dark/50
```

### Shadow & Glow Effects

```tsx
// Yellow glow shadows (for buttons, cards, active states)
shadow-glow       // 0 0 24px rgba(255, 240, 43, 0.25)
shadow-glow-sm    // 0 0 12px rgba(255, 240, 43, 0.20)
shadow-glow-lg    // 0 0 36px rgba(255, 240, 43, 0.30)

// Status glows
shadow-glow-green  // 0 0 16px rgba(0, 255, 136, 0.5)
shadow-glow-pink   // 0 0 16px rgba(255, 51, 102, 0.5)
```

### Card Components

```tsx
// Standard card with yellow glow
<Card glow="yellow">
  <h3 className="font-bebasNeue text-xl">Revenue</h3>
  <p className="text-3xl font-bold text-yellow">$12,450</p>
</Card>

// Card with border accent
<div className="bg-bg-card border border-border-card rounded-xl p-6 
                hover:border-yellow hover:shadow-glow transition-all">
  {/* Content */}
</div>
```

---

## 🎯 Component Examples

### Navigation Active State

```tsx
// Active nav item with yellow glow
<Link 
  href="/dashboard"
  className={`
    px-3 py-2 rounded-xl transition-all duration-200
    ${active 
      ? 'text-yellow bg-yellow/10 shadow-glow-sm' 
      : 'text-muted hover:text-fg hover:bg-yellow/5'
    }
  `}
>
  <Icon className="w-4 h-4 text-yellow" />
  <span className="font-aileron font-medium">Dashboard</span>
</Link>
```

### Primary Button with Glow

```tsx
<button className="px-6 py-3 bg-yellow text-black font-semibold rounded-xl 
                   shadow-glow hover:shadow-glow-lg hover:scale-[1.01] 
                   active:scale-[0.99] transition-all duration-200">
  Update Balances
</button>
```

### Stat Card with Yellow Accent

```tsx
<div className="bg-bg-card border-l-4 border-l-yellow rounded-xl p-6 
                shadow-glow-sm hover:shadow-glow transition-all">
  <p className="font-bebasNeue text-sm uppercase text-muted tracking-wide">
    Monthly GOP
  </p>
  <p className="text-4xl font-bold text-yellow mt-2">
    $8,320
  </p>
  <p className="text-sm text-success mt-1">
    ↑ 12.3% from last month
  </p>
</div>
```

### Input with Yellow Focus

```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-bg-card border border-border-card 
             rounded-lg text-text-primary font-aileron
             focus:border-yellow focus:shadow-glow-sm focus:outline-none
             transition-all duration-200"
  placeholder="Enter amount..."
/>
```

---

## 🔧 Technical Configuration

### Files Modified

1. **`app/globals.css`**
   - `@theme` block with yellow (#FFF02B) as primary accent
   - Shadow utilities for yellow glow effects
   - Dark mode variables

2. **`tailwind.config.ts`**
   - Extended color palette with yellow, greys, status colors
   - Font family definitions for Made Mirage, Bebas Neue, Aileron
   - Custom shadow utilities (glow, glow-sm, glow-lg)

3. **`app/layout.tsx`**
   - Font variables injected via className
   - Default body uses Aileron font
   - Dark theme applied globally

4. **`components/ui/Button.tsx`**
   - Primary variant uses yellow background
   - Secondary variant uses dark grey with yellow text
   - Hover states with scale animations

5. **`components/Navigation.tsx`**
   - Yellow accent line at top
   - Active states with yellow background + glow
   - Pulsing yellow dot logo indicator

---

## ✅ Implementation Checklist

### Core Theme
- [x] Tailwind v4 configured with yellow primary color
- [x] CSS variables defined in globals.css
- [x] Dark mode backgrounds (#121212, #171717)
- [x] Yellow glow shadow utilities

### Typography
- [x] Made Mirage font loaded (display)
- [x] Bebas Neue font loaded (headers)
- [x] Aileron font loaded (body)
- [x] Font classes available in Tailwind

### Components
- [x] Button component with yellow primary variant
- [x] Card component with yellow glow option
- [x] Navigation with yellow active states
- [x] Input focus states with yellow glow

### Pages Updated
- [x] Navigation component
- [x] Dashboard KPI cards
- [x] Balance page buttons
- [x] Admin page elements
- [x] P&L retry button
- [x] Settings page icon

### Remaining Work
- [ ] Apply Made Mirage to page titles
- [ ] Apply Bebas Neue to dashboard stat labels
- [ ] Ensure all primary CTAs use yellow Button component
- [ ] Add yellow glow to more interactive elements
- [ ] Test mobile responsiveness with new colors

---

## 🚀 Quick Reference

### Most Common Patterns

```tsx
// Primary action button
<button className="bg-yellow text-black px-6 py-3 rounded-xl shadow-glow hover:shadow-glow-lg">
  Submit
</button>

// Page title
<h1 className="font-madeMirage text-5xl text-yellow">
  Dashboard
</h1>

// Section header
<h2 className="font-bebasNeue text-2xl uppercase text-white">
  Monthly Overview
</h2>

// Stat value
<p className="text-4xl font-bold text-yellow">
  $12,450
</p>

// Active navigation item
<div className="text-yellow bg-yellow/10 shadow-glow-sm">
  Active
</div>

// Card with glow
<div className="bg-bg-card border border-border-card hover:border-yellow hover:shadow-glow">
  Content
</div>
```

---

## 🎨 Color Usage Guidelines

### When to Use Yellow (#FFF02B)

✅ **Use for:**
- Primary action buttons (Submit, Save, Create)
- Active navigation states
- Important stats and metrics
- Icons for positive actions
- Emphasis text and labels
- Hover states on interactive elements

❌ **Avoid using for:**
- Large background areas (too bright)
- Body text (poor readability)
- Error or warning messages (use status colors instead)
- Passive UI elements

### When to Use Black (#000000)

✅ **Use for:**
- Navigation bar background
- Dividers and separators
- Text on yellow backgrounds (for contrast)
- Footer backgrounds
- Modal overlays

### When to Use Dark Grey (#121212)

✅ **Use for:**
- Main app background
- Page backgrounds
- Large content areas
- Secondary buttons

### When to Use Grey (#4D4D4D)

✅ **Use for:**
- Muted text and labels
- Placeholder text
- Disabled states
- Subtle borders
- Secondary information

---

## 📱 Responsive Considerations

- Yellow glows should be slightly reduced on mobile for performance
- Font sizes should scale down appropriately
- Touch targets for yellow buttons: minimum 44x44px
- Test yellow contrast on different screen brightness levels

---

## 🔍 Testing Checklist

To verify the brand is properly applied:

1. **Navigation**: Active item should have yellow text + yellow glow background
2. **Buttons**: Primary buttons should be solid yellow with black text
3. **Logo**: Pulsing yellow dot indicator next to "BookMate"
4. **Stats**: Key metrics should use yellow for emphasis
5. **Hover States**: Interactive elements should glow yellow on hover
6. **Focus States**: Form inputs should have yellow border when focused

**Test URL**: http://localhost:3000/dashboard

---

**Status**: All core brand elements configured and ready for use.  
**Next Steps**: Apply brand systematically to all remaining pages and components.
