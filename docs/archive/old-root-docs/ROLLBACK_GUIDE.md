# Emergency Rollback Guide

## Current Situation
We've deployed a fix for Shared Drive access by adding `drive.readonly` scope to all API routes.

**Current commit**: `dc241d1` - "FIX: Add drive.readonly scope for Shared Drive access"

## If Fix Doesn't Work - Rollback Options

### Option 1: Quick Rollback to Previous Commit
```bash
# Find the commit before the auth changes started
git log --oneline -20

# Rollback to specific commit (replace COMMIT_HASH)
git reset --hard COMMIT_HASH

# Force push to GitHub (⚠️ DANGEROUS - only if emergency)
git push origin main --force

# Deploy to Vercel
vercel --prod
```

### Option 2: Revert Recent Changes (Safer)
```bash
# Revert the Shared Drive fix
git revert dc241d1

# Revert the cache isolation fixes (if needed)
git revert a89b16e  # Replace with actual commit hash

# Push to GitHub
git push origin main

# Deploy to Vercel
vercel --prod
```

### Option 3: Find Last Known Good Commit
```bash
# View recent commits with dates
git log --pretty=format:"%h - %an, %ar : %s" -20

# Common known-good commits to look for:
# - Before "multi-tenant" changes
# - Before "cache isolation" changes
# - Before "Shared Drive" changes

# Check what changed in a specific commit
git show COMMIT_HASH

# Rollback to that commit
git reset --hard COMMIT_HASH
git push origin main --force
vercel --prod
```

## Recent Commit History (for reference)
```bash
# View the last 10 commits
git log --oneline -10
```

Expected output should show:
- `dc241d1` - Shared Drive fix (CURRENT)
- `a89b16e` - Cache isolation fix
- `XXXXXX` - Previous stable version

## Testing Checklist After Deployment
1. **Test Tommy's Account**:
   - Login as tommy@gmail.com
   - Check Dashboard loads without errors
   - Verify he sees his OWN data (not Shaun's)
   - Check Vercel logs for 404 errors

2. **Test Admin Account**:
   - Login as shaun@siamoon.com
   - Verify data still loads correctly
   - Check all pages work

3. **Check Vercel Logs**:
   ```bash
   # Monitor real-time logs
   vercel logs --follow
   
   # Or check in Vercel dashboard
   # https://vercel.com/tool2u/bookmate-webapp/logs
   ```

4. **Look for These Errors**:
   - ❌ "Requested entity was not found" (404) → Shared Drive access still broken
   - ❌ "Token expired" → Session issues (expected for old sessions)
   - ❌ Wrong user data displayed → Multi-tenant isolation still broken

## If Rollback is Needed

### Find Last Stable Commit (Before Auth Changes)
```bash
# Search for commits before the auth/multi-tenant work
git log --all --oneline --grep="auth" -20
git log --all --oneline --grep="multi-tenant" -20

# Or search by date
git log --since="2025-11-12" --until="2025-11-13" --oneline
```

### Example Rollback Command
```bash
# If you know the last good commit was before today
git log --before="2025-11-13 09:00" --oneline -5

# Rollback to that commit
git reset --hard COMMIT_HASH

# Force push (⚠️ This will erase recent commits!)
git push origin main --force

# Redeploy
vercel --prod
```

## What Data Will Be Lost in Rollback?
- ✅ User data is SAFE (in database, not in code)
- ✅ Spreadsheet data is SAFE (in Google Sheets, not in code)
- ❌ Recent code changes will be lost
- ❌ Will need to re-implement fixes after identifying real issue

## Alternative: Branch and Test
Instead of force-pushing, you could:
```bash
# Create a rollback branch
git checkout -b rollback-test COMMIT_HASH

# Deploy this branch to preview
vercel

# If it works, merge to main
git checkout main
git merge rollback-test
git push origin main
vercel --prod
```

## Emergency Contact Info
- Vercel Dashboard: https://vercel.com/tool2u/bookmate-webapp
- GitHub Repo: https://github.com/TOOL2U/BookMate
- Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT

## Important Notes
1. **Database is independent**: Rollback won't affect database or spreadsheet data
2. **Service account credentials**: Make sure these are still valid in Vercel env vars
3. **DNS/Domain**: Won't be affected by rollback
4. **User sessions**: May need users to re-login after rollback

---

**Current Status**: Waiting for deployment and testing
**Next Step**: Test Tommy's account thoroughly
**If broken**: Use this guide to rollback
