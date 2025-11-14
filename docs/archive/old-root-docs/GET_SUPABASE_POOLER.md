# How to Get Supabase Pooled Connection String

## Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/bzyuhtyanneookgrponx
2. Click **Settings** (gear icon in left sidebar)
3. Click **Database**
4. Scroll to **Connection Pooling** section

## Step 2: Find the Connection String
Look for **Session pooler** or **Connection pooling** section.

The format will be:
```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Where:
- `[PROJECT-REF]` = `bzyuhtyanneookgrponx`
- `[PASSWORD]` = Your database password
- Port should be `5432` for session mode (or `6543` for transaction mode)

## Expected Format
Based on your project ref:
```
postgres://postgres.bzyuhtyanneookgrponx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Replace `[PASSWORD]` with your actual database password: `bookmatedatabasepassword`
