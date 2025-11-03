# 🎨 BookMate Dark Theme Design System

**Matching Mobile App Design** - Last Updated: November 3, 2025

---

## 📐 Design Specifications

### Background Colors
- **Pure Black**: `#000000` - Main background (matches mobile)
- **Dark Gray Cards**: `#1A1A1A` - Cards, boxes, modals (matches mobile)
- **Subtle Borders**: `#2A2A2A` - Card borders, dividers (matches mobile)

### Text Colors
- **Bright White**: `#FFFFFF` - Primary text (matches mobile)
- **Medium Gray**: `#A0A0A0` - Secondary text (matches mobile)
- **Dark Gray**: `#666666` - Placeholders, disabled text (matches mobile)

### Accent/Glow Colors
- **Cyan**: `#00D9FF` - Primary accent with glow effects (shadowOpacity 0.4-0.6)
  - Used for: Active states, focus rings, primary buttons, navigation active
  - Glow: `0 0 20px rgba(0, 217, 255, 0.4)` to `0 0 40px rgba(0, 217, 255, 0.6)`

### Status Colors (Neon)
- **Neon Green**: `#00FF88` - Success states, positive balances, credit
- **Neon Pink**: `#FF3366` - Error states, negative balances, debit
- **Gold**: `#FFD700` - Warnings, important notices
- **Purple**: `#9D4EDD` - Secondary accent, highlights

---

## 🎯 Component Styling Patterns

### Cards
```tsx
// Basic card
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
  {/* content */}
</div>

// Card with hover glow
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
                hover:border-[#00D9FF] hover:shadow-glow-cyan transition-all duration-300">
  {/* content */}
</div>

// Card with neon border-left indicator
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
                border-l-4 border-l-[#00FF88]">
  {/* Green indicator for success/credit */}
</div>
```

### Buttons
```tsx
// Primary button with cyan glow
<button className="bg-[#00D9FF] text-[#000000] px-6 py-3 rounded-xl 
                   hover:shadow-glow-cyan-lg transition-all duration-300">
  Submit
</button>

// Secondary button with cyan border glow
<button className="bg-[#1A1A1A] border border-[#2A2A2A] text-[#FFFFFF] 
                   px-6 py-3 rounded-xl 
                   hover:border-[#00D9FF] hover:shadow-glow-cyan 
                   transition-all duration-300">
  Cancel
</button>

// Danger button with pink glow
<button className="bg-[#FF3366] text-[#FFFFFF] px-6 py-3 rounded-xl 
                   hover:shadow-glow-pink transition-all duration-300">
  Delete
</button>
```

### Inputs
```tsx
// Text input with cyan focus glow
<input className="bg-[#1A1A1A] border border-[#2A2A2A] 
                  text-[#FFFFFF] placeholder-[#666666] 
                  px-4 py-3 rounded-xl 
                  focus:border-[#00D9FF] focus:shadow-glow-cyan 
                  transition-all duration-300" 
       placeholder="Enter amount..." />
```

### Navigation Active State
```tsx
// Active navigation item with cyan glow
<div className="text-[#00D9FF] bg-[#1A1A1A] 
                border border-[#00D9FF] shadow-glow-cyan 
                px-4 py-2 rounded-xl">
  <Icon className="w-4 h-4" />
  <span>Active Tab</span>
</div>

// Inactive navigation item
<div className="text-[#A0A0A0] hover:text-[#FFFFFF] 
                px-4 py-2 rounded-xl">
  <Icon className="w-4 h-4" />
  <span>Inactive Tab</span>
</div>
```

### KPI Cards (P&L Screen)
```tsx
// Green success card
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
                border-l-4 border-l-[#00FF88]">
  <h3 className="text-[#A0A0A0] text-sm">Total Revenue</h3>
  <p className="text-[#00FF88] text-2xl font-bold">$125,430</p>
</div>

// Pink debit card
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
                border-l-4 border-l-[#FF3366]">
  <h3 className="text-[#A0A0A0] text-sm">Total Expenses</h3>
  <p className="text-[#FF3366] text-2xl font-bold">$87,250</p>
</div>

// Purple highlight card
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 
                border-l-4 border-l-[#9D4EDD]">
  <h3 className="text-[#A0A0A0] text-sm">Net Income</h3>
  <p className="text-[#FFFFFF] text-2xl font-bold">$38,180</p>
</div>
```

### Transaction Cards (Inbox)
```tsx
// Transaction card with hover effect
<div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 
                hover:border-[#00D9FF] hover:shadow-glow-cyan 
                transition-all duration-300">
  <div className="flex justify-between">
    <div>
      <h4 className="text-[#FFFFFF] font-medium">Property Utilities</h4>
      <p className="text-[#A0A0A0] text-sm">Sia Moon - Oct 2024</p>
    </div>
    <div className="text-right">
      <p className="text-[#FF3366] font-bold">-$1,234</p>
      <p className="text-[#666666] text-xs">Pending</p>
    </div>
  </div>
</div>
```

---

## 🌟 Glow Effect Classes

### Pre-defined Shadow Classes (Tailwind)
```css
shadow-glow-cyan      /* 0 0 20px rgba(0, 217, 255, 0.4) */
shadow-glow-cyan-md   /* 0 0 30px rgba(0, 217, 255, 0.5) */
shadow-glow-cyan-lg   /* 0 0 40px rgba(0, 217, 255, 0.6) */
shadow-glow-green     /* 0 0 20px rgba(0, 255, 136, 0.4) */
shadow-glow-pink      /* 0 0 20px rgba(255, 51, 102, 0.4) */
shadow-glow-purple    /* 0 0 20px rgba(157, 78, 221, 0.4) */
```

### Custom CSS Classes (globals.css)
```css
.glow-button          /* Button with cyan hover glow */
.glow-button-active   /* Active button with cyan glow */
.card-glow           /* Card with hover glow effect */
.input-glow:focus    /* Input with focus glow */
.animate-cyan-glow   /* Animated pulsing cyan glow */
```

### Border Neon Classes
```css
.border-neon-green   /* border-left: 3px solid #00FF88 */
.border-neon-pink    /* border-left: 3px solid #FF3366 */
.border-neon-gold    /* border-left: 3px solid #FFD700 */
.border-neon-purple  /* border-left: 3px solid #9D4EDD */
.border-neon-cyan    /* border-left: 3px solid #00D9FF */
```

### Text Glow Classes
```css
.text-glow-green     /* Green text with glow shadow */
.text-glow-pink      /* Pink text with glow shadow */
.text-glow-cyan      /* Cyan text with glow shadow */
```

---

## 📱 Mobile-First Responsive Design

### Breakpoints (Tailwind defaults)
- **sm**: 640px (tablet portrait)
- **md**: 768px (tablet landscape)
- **lg**: 1024px (desktop)
- **xl**: 1280px (large desktop)

### Mobile Optimizations
```tsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Hide label on mobile, show on desktop
<span className="hidden sm:inline">Upload Receipt</span>

// Full width button on mobile
<button className="w-full md:w-auto">Submit</button>
```

---

## 🎭 Animation Guidelines

### Transition Durations
- **Fast**: 150-200ms - Small UI changes (hover states, toggles)
- **Medium**: 300ms - Standard interactions (button clicks, dropdowns)
- **Slow**: 500-600ms - Page transitions, modals

### Example Transitions
```tsx
// Button hover
className="transition-all duration-300"

// Card hover glow
className="hover:border-[#00D9FF] hover:shadow-glow-cyan transition-all duration-300"

// Navigation active state
className="transition-all duration-300"
```

### Framer Motion Patterns
```tsx
// Hover lift effect
<motion.div whileHover={{ y: -2 }} transition={{ duration: 0.3 }}>

// Tap scale effect
<motion.button whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>

// Animated glow
<motion.div 
  animate={{ 
    boxShadow: [
      '0 0 20px rgba(0, 217, 255, 0.4)',
      '0 0 35px rgba(0, 217, 255, 0.6)',
      '0 0 20px rgba(0, 217, 255, 0.4)'
    ]
  }}
  transition={{ duration: 2, repeat: Infinity }}
/>
```

---

## 🔧 Usage Examples

### Upload Page
- Background: Pure black `#000000`
- Upload button: Cyan `#00D9FF` with glow effect
- Drop zone: Dark card `#1A1A1A` with cyan border on drag-over

### Inbox Page
- Transaction cards: Dark gray `#1A1A1A`
- Hover effect: Cyan border and glow
- Debit amounts: Neon pink `#FF3366`
- Credit amounts: Neon green `#00FF88`

### P&L Page
- KPI cards: Dark gray with neon left borders
- Revenue: Green `#00FF88` border
- Expenses: Pink `#FF3366` border
- Net Income: Purple `#9D4EDD` border

### Balance Page
- Total balance card: Cyan glow effect
- Account cards: Dark gray with hover glow
- Positive balances: Neon green text
- Negative balances: Neon pink text

### Settings Page
- Section cards: Dark gray `#1A1A1A`
- Save button: Cyan with glow
- Delete button: Neon pink with glow

---

## 🚀 Implementation Checklist

### ✅ Completed
- [x] Updated Tailwind config with mobile app colors
- [x] Refreshed global CSS with cyan glow effects
- [x] Updated Navigation component with cyan active state
- [x] Updated Card component with glow support
- [x] Updated BottomBar component styling

### 🔄 Next Steps
1. Update all page components to use new color system
2. Replace slate colors with dark theme colors
3. Add neon border indicators to KPI cards
4. Implement cyan glow on all primary buttons
5. Update form inputs with cyan focus glow
6. Test mobile responsive behavior
7. Verify accessibility (contrast ratios)

---

## 📚 Color Reference Quick Guide

| Use Case | Color | Hex Code | Example |
|----------|-------|----------|---------|
| Background | Pure Black | `#000000` | Page background |
| Cards | Dark Gray | `#1A1A1A` | Card background |
| Borders | Subtle Gray | `#2A2A2A` | Card borders |
| Primary Text | Bright White | `#FFFFFF` | Headings, labels |
| Secondary Text | Medium Gray | `#A0A0A0` | Descriptions |
| Placeholder | Dark Gray | `#666666` | Input placeholders |
| Primary Accent | Cyan | `#00D9FF` | Active states, focus |
| Success/Credit | Neon Green | `#00FF88` | Positive amounts |
| Error/Debit | Neon Pink | `#FF3366` | Negative amounts |
| Warning | Gold | `#FFD700` | Alerts |
| Highlight | Purple | `#9D4EDD` | Secondary accent |

---

## 🎨 Design Philosophy

**From Mobile Team:**
> "The app now has a sleek, modern dark theme with glowing elements that create a professional, high-end appearance while maintaining all existing functionality!"

**Key Principles:**
1. **Pure Black Background** - Maximum contrast, modern aesthetic
2. **Subtle Dark Cards** - Clear hierarchy without brightness
3. **Cyan Glow Accents** - Professional, high-tech feel
4. **Neon Status Colors** - Clear visual feedback
5. **Smooth Transitions** - Polished, responsive interactions
6. **Mobile-First** - Touch-friendly, responsive design

---

**Design System Version**: 1.0  
**Last Updated**: November 3, 2025  
**Mobile App Parity**: ✅ Matched
