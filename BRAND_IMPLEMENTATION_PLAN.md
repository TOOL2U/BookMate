# 🎨 BookMate Brand Kit - Full Webapp Implementation Plan

**Status**: In Progress  
**Date**: November 5, 2025  
**Objective**: Apply BookMate brand kit to every page with exact specifications

---

## 📋 Implementation Checklist

### ✅ Phase 1: Core Theme (COMPLETE)
- [x] Tailwind v4 configured with exact colors
- [x] CSS variables defined (#FFF02B, #121212, #4D4D4D, #000000, #F3F3F3)
- [x] Fonts loaded (Made Mirage, Bebas Neue, Aileron)
- [x] Shadow utilities (yellow glow)
- [x] Button component updated
- [x] Card component updated
- [x] Input component styled
- [x] Removed all slate colors

### 🔄 Phase 2: Pages (IN PROGRESS)

#### 1. Dashboard (`/dashboard`)
- [ ] Title "Dashboard" → Made Mirage font
- [ ] Metric cards → #171717 bg, #2a2a2a border, yellow glow shadow
- [ ] Card headings → Bebas Neue
- [ ] Card content → Aileron
- [ ] Primary buttons → Yellow #FFF02B with black text
- [ ] Background → #121212 with subtle yellow glow gradient

#### 2. Balance Page (`/balance`)
- [ ] Title "Balance Overview" → Made Mirage
- [ ] Table headers → Bebas Neue, yellow text (#FFF02B)
- [ ] Table rows → Aileron, white text (#F3F3F3)
- [ ] Table borders → #2A2A2A
- [ ] Hover effect → rgba(255, 240, 43, 0.04)
- [ ] Yellow highlight for positive balances
- [ ] Current month tab → yellow underline

#### 3. P&L Page (`/pnl`)
- [ ] Background → #121212
- [ ] Category cards → #171717 bg, #2a2a2a border
- [ ] Inflow/Outflow numbers → Bebas Neue bold
- [ ] Total line → Yellow text
- [ ] Section headers → Bebas Neue
- [ ] Data → Aileron

#### 4. Upload/OCR Page (`/upload`)
- [ ] Dark form elements → #1B1B1B backgrounds
- [ ] Input fields → Aileron font
- [ ] CTA button → Yellow primary
- [ ] Progress bar → Yellow gradient fill
- [ ] Confirmation modal → #171717 bg, yellow outline button

#### 5. Inbox Page (`/inbox`)
- [ ] Title → Made Mirage
- [ ] List items → Aileron
- [ ] Action buttons → Yellow primary
- [ ] Status badges → Appropriate colors with yellow for active

#### 6. Settings Page (`/settings`)
- [ ] Dark panels → #1B1B1B backgrounds
- [ ] Headings → Bebas Neue
- [ ] Body text → Aileron
- [ ] Toggle switches → Yellow when active
- [ ] Save button → Yellow primary
- [ ] Table headers → Bebas Neue, yellow text

#### 7. Admin Page (`/admin`)
- [ ] Background → #121212
- [ ] Cards → #171717 with borders
- [ ] Headings → Bebas Neue
- [ ] Action buttons → Yellow primary
- [ ] Status indicators → Yellow for active

### 📐 Component Standards

**Card Component**:
```tsx
bg-bg-card           // #171717
border-border-card   // #2a2a2a
rounded-xl2          // 1.25rem
shadow-glow-sm       // Yellow glow
```

**Typography Classes**:
```tsx
font-madeMirage      // Page titles, hero text
font-bebasNeue       // Section headers, stats, table headers
font-aileron         // Body text, inputs, default
```

**Button Variants**:
```tsx
Primary:   bg-yellow text-black shadow-glow
Secondary: bg-grey text-yellow
Ghost:     bg-transparent text-muted
```

**Input Fields**:
```tsx
bg-[#1B1B1B]
border-border-card
text-text-primary
placeholder-muted
focus:border-yellow focus:shadow-glow-sm
font-aileron
```

**Tables**:
```tsx
Header: font-bebasNeue text-yellow uppercase
Body:   font-aileron text-text-primary
Border: border-border-card
Hover:  hover:bg-yellow/5
```

---

## 🎯 Execution Order

1. ✅ Fix all slate colors → DONE
2. ⏳ Update Dashboard page
3. ⏳ Update Balance page  
4. ⏳ Update P&L page
5. ⏳ Update Upload page
6. ⏳ Update Inbox page
7. ⏳ Update Settings page
8. ⏳ Update Admin page
9. ⏳ Final QA pass

---

## 📝 Notes

- All changes are cosmetic only - no logic modifications
- Test on desktop, tablet, and mobile viewports
- Verify yellow glow effects are visible but subtle
- Ensure proper contrast for accessibility
- Use existing Tailwind classes where possible

