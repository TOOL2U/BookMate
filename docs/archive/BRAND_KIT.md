# BookMate Brand Kit

## Border Radius Standards

### Primary Border Radius: `rounded-xl2`
**Always use `rounded-xl2` for UI components**

This is our signature border radius style that should be used consistently across:
- Buttons
- Cards
- Containers
- Input fields
- Modals
- Dialogs
- Panels

### Examples:
```tsx
// Buttons
className="px-4 py-2 bg-yellow rounded-xl2"

// Cards
className="bg-bg-card border border-border-card rounded-xl2"

// Input fields
className="w-full px-3 py-2 bg-bg-card rounded-xl2"

// Containers
className="p-6 bg-bg-card rounded-xl2"
```

## Color Palette

### Primary Colors
- **Yellow (Brand)**: `#FFD700` / `bg-yellow` / `text-yellow`
- **Black**: `#000000` / `bg-black`
- **Background**: `bg-bg-app`, `bg-bg-card`

### Text Colors
- **Primary**: `text-text-primary`
- **Secondary**: `text-text-secondary`
- **Tertiary**: `text-text-tertiary`
- **Muted**: `text-muted`

### Border Colors
- **Card Border**: `border-border-card`

### Shadows
- **Glow**: `shadow-glow`
- **Glow Yellow**: `shadow-glow-yellow`
- **Glow Green**: `shadow-glow-green`

## Typography

### Font Families
- **Headings**: `font-bebasNeue` (uppercase titles)
- **Body**: `font-aileron` (general text)
- **Display**: `font-madeMirage` (special use)

### Font Sizes
- **Page Title**: `text-3xl`
- **Section Title**: `text-xl` or `text-2xl`
- **Body**: `text-base` or `text-sm`
- **Small**: `text-xs`

## Spacing

### Consistent Gaps
- **Small**: `gap-2`
- **Medium**: `gap-4`
- **Large**: `gap-6`

### Padding
- **Button**: `px-4 py-2` or `px-3 py-1.5`
- **Card**: `p-4` or `p-6`
- **Container**: `p-4 sm:p-6 lg:p-8`

## Component Patterns

### Button Styles
```tsx
// Primary button
className="px-4 py-2 bg-yellow hover:opacity-90 text-black rounded-xl2 shadow-glow"

// Secondary button
className="px-4 py-2 bg-bg-card hover:bg-black rounded-xl2 border border-border-card"

// Icon button
className="p-3 bg-bg-card hover:bg-black rounded-xl2 border border-border-card"
```

### Card Styles
```tsx
className="bg-bg-card border border-border-card rounded-xl2 p-4 shadow-glow-sm"
```

### Input Styles
```tsx
className="w-full px-3 py-2 bg-bg-card border border-border-card rounded-xl2 text-text-primary"
```

## Logo Usage

### Logo Sizes
- **Page Header**: `<LogoBM size={100} />`
- **Loading Screen**: `<LogoBM size={150} />` or `<LogoBM size={200} />`
- **Sidebar**: `<LogoBM size={56} />`

### Logo Positioning
```tsx
// Page header with -ml-86 for centering
<div className="-ml-86">
  <LogoBM size={100} />
</div>
```

## Animation Standards

### Fade In
```tsx
className="animate-fade-in opacity-0"
style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
```

### Loading States
- Spinner icon: `<Loader2 className="w-4 h-4 animate-spin" />`
- Refresh icon: `<RefreshCw className="w-5 h-5 animate-spin" />`

## Layout Standards

### Page Structure
```tsx
<AdminShell>
  <div className="space-y-4">
    {/* Page header */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-3xl font-bebasNeue uppercase text-text-primary">
          Page Title
        </h1>
        <p className="text-text-secondary mt-3 font-aileron">
          Description
        </p>
      </div>
      <div className="-ml-86">
        <LogoBM size={100} />
      </div>
      <button className="p-3 bg-bg-card hover:bg-black rounded-xl2">
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
    {/* Content */}
  </div>
</AdminShell>
```

## Do's and Don'ts

### ✅ Do:
- Always use `rounded-xl2` for UI components
- Use `font-bebasNeue` with `uppercase` for titles
- Use `font-aileron` for body text
- Maintain consistent spacing with `gap-4`, `space-y-4`
- Use yellow for primary actions
- Use shadow effects: `shadow-glow`, `shadow-glow-yellow`

### ❌ Don't:
- Don't use `rounded-lg`, `rounded-xl`, or other border radius values
- Don't mix different border radius values
- Don't use custom colors - stick to the theme
- Don't use `font-madeMirage` except for special display purposes
- Don't use arbitrary spacing values
