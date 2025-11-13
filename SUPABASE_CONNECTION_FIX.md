# Supabase Connection Issue - Root Cause Found

## Problem
Supabase hosted databases have TWO connection modes:

1. **Direct Connection** (port 5432)
   - Works from: Local machines, servers with persistent connections
   - Does NOT work from: Serverless functions (Vercel, AWS Lambda)
   - URL: `db.bzyuhtyanneookgrponx.supabase.co:5432`

2. **Pooled Connection** (port 6543 for transaction mode, 5432 for session mode)
   - Works from: Serverless functions
   - Required for: Vercel, Netlify, AWS Lambda
   - URL: `aws-0-ap-southeast-1.pooler.supabase.com`

## The "Tenant or user not found" Error

This error occurs when using the pooler with **transaction mode** (port 6543).
Supabase's pooler in transaction mode doesn't support all PostgreSQL features.

## Solution

Use the **Session Pooler** instead:

```
postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Key differences:
- Port: 5432 (session mode) instead of 6543 (transaction mode)
- User format: `postgres.PROJECT_REF` instead of just `postgres`

This pooler mode supports:
✅ All Prisma features
✅ Prepared statements
✅ Session variables
✅ Full PostgreSQL compatibility

