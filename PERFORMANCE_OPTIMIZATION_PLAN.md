# 🚀 Performance Optimization Plan

## Current Performance Issues

### Identified Bottlenecks:
1. ❌ All API routes use `force-dynamic` - prevents Next.js caching
2. ❌ Google Sheets API calls are slow (500ms - 2s per request)
3. ❌ No static generation for pages
4. ❌ Multiple sequential API calls on page load
5. ❌ No CDN caching headers
6. ❌ Large bundle sizes from unoptimized imports

## Optimization Strategy

### Phase 1: API Route Optimization ⚡

#### 1.1 Implement Response Caching
- ✅ P&L API already has 60s cache
- ⚠️ Balance API needs cache headers
- ⚠️ Options API needs cache headers
- ⚠️ Inbox API needs cache headers

#### 1.2 Add Cache-Control Headers
```typescript
// Good for production
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
}
```

#### 1.3 Remove Unnecessary force-dynamic
- Keep for: POST/PUT/DELETE operations
- Remove for: GET operations with data that changes < 1 minute

### Phase 2: Frontend Optimization 🎨

#### 2.1 Code Splitting
- ✅ Already using dynamic imports for modals
- ⚠️ Add React.lazy() for heavy components
- ⚠️ Optimize chart library imports

#### 2.2 Image Optimization
- ✅ Next.js Image component configured
- ⚠️ Convert logos to WebP/AVIF
- ⚠️ Add proper width/height to prevent layout shift

#### 2.3 Bundle Size Reduction
- Current: ~500KB initial load
- Target: ~200KB initial load
- Actions:
  - Use barrel imports wisely
  - Remove unused dependencies
  - Use optimizePackageImports for lucide-react

### Phase 3: Database & API Caching 💾

#### 3.1 In-Memory Cache (Current)
```typescript
// 60-second cache for P&L data
let cache: CachedData | null = null;
const CACHE_DURATION_MS = 60 * 1000;
```

#### 3.2 Redis Cache (Future - Production Ready)
- Install Vercel KV (Redis)
- Cache duration: 5 minutes for most data
- Invalidate on data changes

#### 3.3 Revalidation Strategy
```typescript
// Incremental Static Regeneration
export const revalidate = 60; // Revalidate every 60 seconds
```

### Phase 4: Network Optimization 🌐

#### 4.1 HTTP/2 Server Push
- Vercel automatically enables HTTP/2
- Push critical CSS/JS

#### 4.2 Prefetch Critical Data
```tsx
<link rel="prefetch" href="/api/pnl" />
```

#### 4.3 Service Worker (Progressive Web App)
- Cache static assets
- Offline support for read-only views

### Phase 5: Monitoring & Metrics 📊

#### 5.1 Performance Metrics to Track
- First Contentful Paint (FCP): Target < 1.5s
- Largest Contentful Paint (LCP): Target < 2.5s
- Time to Interactive (TTI): Target < 3.5s
- Total Blocking Time (TBT): Target < 300ms

#### 5.2 Implementation
- Add Vercel Analytics
- Add custom performance marks
- Monitor API response times

## Implementation Priority

### 🔴 HIGH PRIORITY (Immediate Impact)
1. Add Cache-Control headers to all GET APIs
2. Remove force-dynamic from read-only APIs
3. Optimize chart library imports
4. Add revalidate config to pages

### 🟡 MEDIUM PRIORITY (Week 1)
1. Implement Redis/KV cache
2. Add service worker for offline support
3. Optimize images and fonts
4. Add performance monitoring

### 🟢 LOW PRIORITY (Future)
1. Implement GraphQL for efficient data fetching
2. Add CDN for static assets
3. Explore Edge Runtime for faster global performance

## Expected Results

### Before Optimization:
- Dashboard Load Time: **5-10 seconds**
- API Response Time: **800ms - 2s**
- Bundle Size: **~500KB**
- Lighthouse Score: **~60**

### After Optimization:
- Dashboard Load Time: **1-2 seconds** (5x improvement)
- API Response Time: **50-200ms** (cached)
- Bundle Size: **~200KB** (60% reduction)
- Lighthouse Score: **~90+**

## Quick Wins (Can implement now)

### 1. Add Cache Headers
```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
  }
});
```

### 2. Enable Static Generation
```typescript
// app/dashboard/page.tsx
export const revalidate = 60; // ISR with 60s revalidation
```

### 3. Lazy Load Charts
```typescript
const ExpenseChart = dynamic(() => import('./ExpenseChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### 4. Optimize Package Imports
```typescript
// next.config.js
experimental: {
  optimizePackageImports: [
    'lucide-react',
    'recharts',
    '@headlessui/react'
  ]
}
```

## Testing Performance

### Local Testing:
```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run build -- --analyze

# Run Lighthouse
npx lighthouse http://localhost:3000 --view
```

### Production Testing:
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s https://accounting.siamoon.com/api/pnl

# WebPageTest
https://www.webpagetest.org/
```

## Next Steps

1. ✅ Review this plan
2. 🔄 Implement high-priority optimizations
3. 📊 Measure performance improvements
4. 🔁 Iterate based on metrics
