# 🚀 BookMate Reports — Phase 3 Production Launch Checklist

**Team:** WebApp / AI Reports  
**Environment:** Production  
**Phase:** 3 of 3 – Final Release  
**Date:** November 10, 2025  
**Owner:** DevOps + Backend Lead  
**Status:** 🔄 **PENDING LAUNCH**

---

## 📋 Pre-Launch Summary

**Phase 3 Development Status:** ✅ **COMPLETE**
- All features implemented and tested
- Mock services validated
- Documentation complete
- 0 TypeScript errors, 0 linting errors

**Production Infrastructure Status:** 🔄 **PENDING**
- Database setup required
- Email service integration required
- Cron scheduler configuration required
- Environment variables configuration required

---

## 🧱 1. Backend Setup

### 1.1 Database Migration

#### Prerequisites
```bash
# Install Prisma if not already installed
npm install -D prisma
npm install @prisma/client

# Initialize Prisma (already done - schema.prisma exists)
# npx prisma init
```

#### Step 1: Set Database URL
```bash
# .env.production or Vercel environment variables
DATABASE_URL="postgresql://user:password@host:5432/bookmate_production?schema=public"

# Example for Supabase:
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Example for Railway:
# DATABASE_URL="postgresql://postgres:[PASSWORD]@containers-us-west-XXX.railway.app:XXXX/railway"
```

#### Step 2: Run Migrations
```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate deploy

# Verify migration
npx prisma migrate status
```

#### Step 3: Verify Tables
```bash
# Open Prisma Studio
npx prisma studio

# Or check via SQL
npx prisma db execute --stdin <<EOF
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
EOF
```

**Expected Tables:**
- ✅ `report_templates`
- ✅ `shared_reports`
- ✅ `scheduled_reports`
- ✅ `email_delivery_logs`
- ✅ `report_jobs`
- ✅ `report_analytics`

#### Step 4: Seed Default Templates
```bash
# Add seed script to package.json
# "prisma": {
#   "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
# }

# Run seed
npx prisma db seed

# Verify
npx prisma studio
# Check that 3 default templates exist
```

**✅ Verification Checklist:**
- [ ] All 6 tables created successfully
- [ ] No migration errors in logs
- [ ] Prisma Studio shows tables
- [ ] 3 default templates seeded
- [ ] Database connection stable

---

### 1.2 Environment Variables

#### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://app.bookmate.com"

# JWT for share tokens
JWT_SECRET="generate-with-openssl-rand-base64-32"

# Email Service (SendGrid)
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="reports@bookmate.com"
SENDGRID_FROM_NAME="BookMate Reports"

# Email Service (Alternative: AWS SES)
# AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
# AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# AWS_REGION="us-east-1"
# AWS_SES_FROM_EMAIL="reports@bookmate.com"

# Frontend URL (for share links)
FRONTEND_URL="https://app.bookmate.com"
NEXT_PUBLIC_APP_URL="https://app.bookmate.com"

# Cron Security
CRON_SECRET="generate-with-openssl-rand-base64-32"

# AI (OpenAI)
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Google Sheets (existing)
GOOGLE_SHEETS_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GOOGLE_SHEETS_SPREADSHEET_ID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Monitoring (Sentry)
SENTRY_DSN="https://xxxxxxxxxxxxxxxx@xxxxxx.ingest.sentry.io/xxxxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxxxxxxxxxxxxx@xxxxxx.ingest.sentry.io/xxxxxxx"

# Rate Limiting (Upstash Redis - Optional)
UPSTASH_REDIS_REST_URL="https://xxxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Generate Secrets
```bash
# Generate random secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For CRON_SECRET
```

#### Set in Vercel
```bash
# Using Vercel CLI
vercel env add NEXTAUTH_SECRET production
vercel env add JWT_SECRET production
vercel env add CRON_SECRET production
vercel env add SENDGRID_API_KEY production
vercel env add DATABASE_URL production

# Or via Vercel Dashboard:
# https://vercel.com/[team]/[project]/settings/environment-variables
```

**✅ Verification Checklist:**
- [ ] All required env vars set in production
- [ ] Secrets generated with openssl
- [ ] Database URL points to production database
- [ ] Email service credentials verified
- [ ] Frontend URL matches production domain
- [ ] Test env vars with: `vercel env ls`

---

## 📤 2. API Deployment

### 2.1 Update API Routes for Database

**File:** `app/api/reports/templates/route.ts`

Replace in-memory storage with Prisma:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || 'default';

  const templates = await prisma.reportTemplate.findMany({
    where: {
      OR: [
        { workspaceId },
        { isDefault: true },
      ],
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return Response.json({ templates });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const template = await prisma.reportTemplate.create({
    data: {
      workspaceId: body.workspaceId || 'default',
      name: body.name,
      description: body.description,
      type: body.type,
      filters: body.filters,
      sections: body.sections,
      branding: body.brandingOverrides,
      isDefault: false,
      createdBy: body.userId,
    },
  });

  return Response.json({ template });
}

export async function PUT(request: Request) {
  const body = await request.json();
  
  const template = await prisma.reportTemplate.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description,
      filters: body.filters,
      sections: body.sections,
      branding: body.brandingOverrides,
    },
  });

  return Response.json({ template });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Template ID required' }, { status: 400 });
  }

  // Check if default template
  const template = await prisma.reportTemplate.findUnique({
    where: { id },
  });

  if (template?.isDefault) {
    return Response.json({ error: 'Cannot delete default template' }, { status: 403 });
  }

  await prisma.reportTemplate.delete({
    where: { id },
  });

  return Response.json({ success: true });
}
```

**Apply similar Prisma updates to:**
- `app/api/reports/share/route.ts`
- `app/api/reports/schedules/route.ts`
- `app/api/reports/email/route.ts`

### 2.2 Enable Async Report Jobs

**File:** `app/api/reports/generate/route.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  
  // Create job
  const job = await prisma.reportJob.create({
    data: {
      workspaceId: body.workspaceId || 'default',
      type: 'generate',
      status: 'pending',
      config: body,
      createdBy: body.userId,
    },
  });

  // Process in background (add to queue or process immediately)
  processReportJob(job.id).catch(console.error);

  return Response.json({ jobId: job.id });
}
```

**File:** `app/api/reports/status/[jobId]/route.ts` (NEW)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const job = await prisma.reportJob.findUnique({
    where: { id: params.jobId },
  });

  if (!job) {
    return Response.json({ error: 'Job not found' }, { status: 404 });
  }

  return Response.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
  });
}
```

### 2.3 Security Validation

**Install Zod for validation:**
```bash
npm install zod
```

**Example validation schema:**

```typescript
// lib/validation/reports.ts
import { z } from 'zod';

export const CreateTemplateSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['internal-summary', 'investor-update', 'bank-compliance', 'custom']),
  filters: z.object({
    dateRange: z.object({
      type: z.enum(['monthly', 'quarterly', 'ytd', 'custom', 'relative']),
    }),
  }),
});

export const ShareReportSchema = z.object({
  reportName: z.string().min(1).max(255),
  snapshot: z.object({
    period: z.object({
      type: z.string(),
      label: z.string(),
    }),
  }),
  expiryDays: z.number().min(1).max(90).optional(),
  passcode: z.string().min(4).max(50).optional(),
  maxViews: z.number().min(1).max(1000).optional(),
});

export const SendEmailSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1).max(50),
  reportName: z.string().min(1).max(255),
  pdfData: z.string(),
  customSubject: z.string().max(255).optional(),
  customMessage: z.string().max(2000).optional(),
});
```

**Use in API routes:**

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateTemplateSchema.parse(body);
    
    // Process with validated data
    const template = await prisma.reportTemplate.create({
      data: validated,
    });
    
    return Response.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    throw error;
  }
}
```

**✅ Verification Checklist:**
- [ ] All API routes updated to use Prisma
- [ ] Async job processing implemented
- [ ] Zod validation added to all endpoints
- [ ] Rate limiting configured (if using Upstash)
- [ ] JWT signing implemented for share tokens
- [ ] Manual Postman tests passed for all endpoints
- [ ] Expired link returns 403
- [ ] Invalid passcode returns 401

---

## 📧 3. Email & Scheduling System

### 3.1 SendGrid Integration

**Install SDK:**
```bash
npm install @sendgrid/mail
```

**Update:** `app/api/reports/email/route.ts`

```typescript
import sgMail from '@sendgrid/mail';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  const body = await request.json();
  const { recipients, reportName, period, pdfData, customSubject, customMessage } = body;

  try {
    const msg = {
      to: recipients.map((r: any) => r.email),
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || 'BookMate Reports',
      },
      subject: customSubject || `${reportName} - ${period.label}`,
      text: customMessage || `Please find attached your ${reportName} for ${period.label}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FFC700; padding: 20px; text-align: center;">
            <h1 style="margin: 0; color: #000;">BookMate Financial Report</h1>
          </div>
          <div style="padding: 30px; background: #fff;">
            <p style="font-size: 16px; line-height: 1.6;">
              ${customMessage || `Your requested ${reportName} for ${period.label} is ready.`}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This is an automated message from BookMate. Please do not reply to this email.
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} BookMate. All rights reserved.
          </div>
        </div>
      `,
      attachments: [
        {
          content: pdfData,
          filename: `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    const response = await sgMail.send(msg);

    // Log delivery
    await prisma.emailDeliveryLog.create({
      data: {
        workspaceId: body.workspaceId || 'default',
        reportName,
        reportPeriod: period.label,
        recipients,
        emailProvider: 'sendgrid',
        messageId: response[0].headers['x-message-id'],
        status: 'sent',
        pdfSize: Buffer.from(pdfData, 'base64').length,
      },
    });

    return Response.json({ 
      success: true, 
      messageId: response[0].headers['x-message-id'] 
    });
  } catch (error: any) {
    console.error('SendGrid error:', error);

    // Log failure
    await prisma.emailDeliveryLog.create({
      data: {
        workspaceId: body.workspaceId || 'default',
        reportName,
        reportPeriod: period.label,
        recipients,
        emailProvider: 'sendgrid',
        status: 'failed',
        error: error.message,
      },
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**Test email sending:**
```bash
curl -X POST https://app.bookmate.com/api/reports/email \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"email": "test@example.com"}],
    "reportName": "Test Report",
    "period": {"label": "November 2025"},
    "pdfData": "base64_encoded_pdf_data",
    "customSubject": "Test Email",
    "customMessage": "This is a test email from BookMate Reports."
  }'
```

### 3.2 Cron Scheduler Setup

**Create:** `app/api/cron/reports/route.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  console.log(`[CRON] Running scheduled reports check at ${now.toISOString()}`);

  try {
    // Find due schedules
    const dueSchedules = await prisma.scheduledReport.findMany({
      where: {
        status: 'active',
        nextRun: { lte: now },
      },
    });

    console.log(`[CRON] Found ${dueSchedules.length} due schedules`);

    const results = [];

    for (const schedule of dueSchedules) {
      try {
        console.log(`[CRON] Processing schedule: ${schedule.name} (${schedule.id})`);

        // 1. Generate report
        const reportData = await generateReportForSchedule(schedule);

        // 2. Generate PDF
        const pdfData = await generatePDFForSchedule(reportData);

        // 3. Send email
        await sendScheduledEmail(schedule, reportData, pdfData);

        // 4. Calculate next run
        const nextRun = calculateNextRun(
          schedule.scheduleConfig.frequency,
          schedule.scheduleConfig.dayOfWeek,
          schedule.scheduleConfig.dayOfMonth,
          schedule.scheduleConfig.time,
          schedule.scheduleConfig.timezone
        );

        // 5. Update schedule
        await prisma.scheduledReport.update({
          where: { id: schedule.id },
          data: {
            lastRun: now,
            nextRun,
            runCount: schedule.runCount + 1,
            failureCount: 0,
            lastError: null,
          },
        });

        results.push({ id: schedule.id, status: 'success' });
        console.log(`[CRON] ✅ Schedule ${schedule.id} completed successfully`);
      } catch (error: any) {
        console.error(`[CRON] ❌ Schedule ${schedule.id} failed:`, error);

        // Update failure
        await prisma.scheduledReport.update({
          where: { id: schedule.id },
          data: {
            failureCount: schedule.failureCount + 1,
            lastError: error.message,
            status: schedule.failureCount + 1 >= 3 ? 'failed' : 'active',
          },
        });

        results.push({ id: schedule.id, status: 'failed', error: error.message });
      }
    }

    return Response.json({
      timestamp: now.toISOString(),
      processed: dueSchedules.length,
      results,
    });
  } catch (error: any) {
    console.error('[CRON] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function generateReportForSchedule(schedule: any) {
  // Implementation: Call report generation logic
  // Return ReportData
}

async function generatePDFForSchedule(reportData: any) {
  // Implementation: Generate PDF from report data
  // Return base64 PDF data
}

async function sendScheduledEmail(schedule: any, reportData: any, pdfData: string) {
  // Implementation: Send via /api/reports/email or directly with SendGrid
}

function calculateNextRun(
  frequency: string,
  dayOfWeek: number,
  dayOfMonth: number,
  time: string,
  timezone: string
): Date {
  // Implementation from lib/reports/sharing.ts
}
```

**Create:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/reports",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Test cron endpoint:**
```bash
curl https://app.bookmate.com/api/cron/reports \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**✅ Verification Checklist:**
- [ ] SendGrid API key configured
- [ ] Test email sent successfully
- [ ] Email appears in inbox (not spam)
- [ ] PDF attachment opens correctly
- [ ] Email delivery logged in database
- [ ] Cron endpoint created
- [ ] `vercel.json` configured
- [ ] Cron secret set in environment
- [ ] Manual cron trigger successful
- [ ] Schedule status updates correctly

---

## 🔐 4. Security & Access Controls

### 4.1 JWT Token Signing

**Install:**
```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

**Update:** `lib/reports/sharing.ts`

```typescript
import jwt from 'jsonwebtoken';

export function generateShareToken(reportId: string, workspaceId: string): string {
  const payload = {
    reportId,
    workspaceId,
    type: 'share',
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '90d', // Max expiry
  });
}

export function verifyShareToken(token: string): { reportId: string; workspaceId: string } {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return {
      reportId: payload.reportId,
      workspaceId: payload.workspaceId,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

### 4.2 Passcode Hashing

**Install:**
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Usage:**
```typescript
import bcrypt from 'bcryptjs';

// When creating share link with passcode
const hashedPasscode = await bcrypt.hash(passcode, 10);

// When validating passcode
const isValid = await bcrypt.compare(providedPasscode, storedHashedPasscode);
```

### 4.3 Rate Limiting

**Install Upstash (optional but recommended):**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create:** `lib/ratelimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const shareLinkRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 per hour
  analytics: true,
});

export const emailRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 emails per hour
  analytics: true,
});

export const scheduleRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 schedules per hour
  analytics: true,
});
```

**Apply in routes:**
```typescript
import { emailRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await emailRateLimit.limit(ip);

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with request...
}
```

**✅ Verification Checklist:**
- [ ] JWT_SECRET generated and set
- [ ] Share tokens use JWT signing
- [ ] Token verification working
- [ ] Passcode hashing implemented
- [ ] Rate limiting configured
- [ ] Expired link test returns 403
- [ ] Invalid token test returns 401
- [ ] Invalid passcode test returns 401
- [ ] Rate limit test returns 429

---

## ⚙️ 5. Performance & Observability

### 5.1 Sentry Setup

**Install:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Configure:** `sentry.client.config.ts` and `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Don't send sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});
```

**Usage in API routes:**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // API logic
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'reports',
      action: 'generate',
    },
    extra: {
      reportType: body.type,
      workspaceId: body.workspaceId,
    },
  });
  throw error;
}
```

### 5.2 Custom Metrics

**Create:** `lib/analytics/metrics.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function trackReportGeneration(
  workspaceId: string,
  reportType: string,
  generationTime: number,
  aiTokensUsed?: number
) {
  await prisma.reportAnalytics.create({
    data: {
      workspaceId,
      eventType: 'generated',
      reportType,
      generationTime,
      aiTokensUsed,
      timestamp: new Date(),
    },
  });
}

export async function trackReportShared(
  workspaceId: string,
  reportType: string
) {
  await prisma.reportAnalytics.create({
    data: {
      workspaceId,
      eventType: 'shared',
      reportType,
      timestamp: new Date(),
    },
  });
}

export async function trackEmailSent(
  workspaceId: string,
  reportType: string,
  recipientCount: number
) {
  await prisma.reportAnalytics.create({
    data: {
      workspaceId,
      eventType: 'emailed',
      reportType,
      timestamp: new Date(),
      metadata: { recipientCount },
    },
  });
}
```

### 5.3 Performance Monitoring

**Add to report generation:**
```typescript
const startTime = Date.now();

// Generate report
const reportData = await generateReport(...);

const duration = Date.now() - startTime;
await trackReportGeneration(workspaceId, reportType, duration);

if (duration > 5000) {
  console.warn(`Slow report generation: ${duration}ms`);
}
```

**✅ Verification Checklist:**
- [ ] Sentry installed and configured
- [ ] Error tracking working (test with intentional error)
- [ ] Custom metrics tracking implemented
- [ ] Analytics table populating
- [ ] Performance warnings logged for slow operations
- [ ] Dashboard created (Vercel Analytics or custom)

---

## 🧪 6. QA Verification

### 6.1 Data Accuracy Tests

**Test Script:** `scripts/verify-report-accuracy.ts`

```typescript
import { generateMonthlyReport } from '@/lib/reports/generators';
import { exportReportToPDF } from '@/lib/reports/pdf-export';

async function verifyDataAccuracy() {
  console.log('Starting data accuracy verification...\n');

  // 1. Generate report
  const reportData = await generateMonthlyReport();
  console.log('Report Data:');
  console.log('- Total Revenue:', reportData.summary.totalRevenue);
  console.log('- Total Expenses:', reportData.summary.totalExpenses);
  console.log('- Net Profit:', reportData.summary.netProfit);

  // 2. Generate PDF
  // Manual verification: Open PDF and check numbers match

  // 3. Create share link
  // Manual verification: Access share link and check numbers match

  // 4. Verify AI summary only references real data
  // Manual review: Read AI insights and confirm no fabricated numbers

  console.log('\n✅ Verification complete. Manual review required.');
}

verifyDataAccuracy();
```

### 6.2 Cross-Browser Testing

**Test Matrix:**
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)

**Test Scenarios:**
- [ ] PDF download works in all browsers
- [ ] Charts render correctly
- [ ] Sharing modal opens and functions
- [ ] Email sends successfully
- [ ] Public viewer accessible
- [ ] Passcode input works

### 6.3 Role-Based Access

**Test Users:**
- Owner: Full access to all features
- Staff: View-only access to shared reports

**Test Cases:**
- [ ] Owner can create templates
- [ ] Owner can share reports
- [ ] Owner can schedule reports
- [ ] Staff can view shared reports
- [ ] Staff cannot create schedules
- [ ] Staff cannot delete templates

**✅ Verification Checklist:**
- [ ] UI numbers match PDF numbers
- [ ] PDF numbers match share link numbers
- [ ] AI summary references only real data
- [ ] All browsers tested successfully
- [ ] Role permissions enforced
- [ ] Mobile responsive design working

---

## 🚀 7. Deployment

### 7.1 Pre-Deployment

```bash
# 1. Final build test
npm run build

# 2. Type check
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Run tests (if available)
npm run test

# 5. Check for console.logs
grep -r "console.log" app/api/
grep -r "console.log" lib/

# 6. Review .env.production
cat .env.production
```

### 7.2 Deploy to Production

```bash
# Using Vercel CLI
vercel --prod

# Or merge and push to main (if auto-deploy enabled)
git checkout main
git merge reports-phase3
git push origin main
```

### 7.3 Post-Deployment Smoke Tests

**Automated Test Script:** `scripts/smoke-test.sh`

```bash
#!/bin/bash

BASE_URL="https://app.bookmate.com"
BEARER_TOKEN="your-test-token"

echo "🧪 Running smoke tests..."

# Test 1: Health check
echo "Test 1: Health check"
curl -f $BASE_URL/api/health || exit 1

# Test 2: Generate report
echo "Test 2: Generate report"
REPORT_RESPONSE=$(curl -s -X POST $BASE_URL/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d '{"type":"monthly"}')

JOB_ID=$(echo $REPORT_RESPONSE | jq -r '.jobId')
echo "Job ID: $JOB_ID"

# Test 3: Check job status
sleep 3
echo "Test 3: Check job status"
curl -f $BASE_URL/api/reports/status/$JOB_ID || exit 1

# Test 4: Create share link
echo "Test 4: Create share link"
curl -s -X POST $BASE_URL/api/reports/share \
  -H "Content-Type: application/json" \
  -d '{"reportName":"Test","snapshot":{"period":{"label":"Test"}}}' || exit 1

# Test 5: Send test email
echo "Test 5: Send email"
curl -s -X POST $BASE_URL/api/reports/email \
  -H "Content-Type: application/json" \
  -d '{"recipients":[{"email":"test@bookmate.com"}],"reportName":"Test","period":{"label":"Test"},"pdfData":""}' || exit 1

echo "✅ All smoke tests passed"
```

### 7.4 Monitor for 48 Hours

**Key Metrics to Watch:**
- Error rate (should be <1%)
- Response times (95th percentile <3s)
- Database connections
- Email delivery rate (should be >95%)
- Schedule execution rate (should be 100%)

**Monitoring Checklist:**
- [ ] Sentry dashboard shows no critical errors
- [ ] Vercel Analytics shows normal traffic
- [ ] Database query performance acceptable
- [ ] Email delivery logs show success
- [ ] Scheduled reports executing on time
- [ ] No user-reported issues

**✅ Verification Checklist:**
- [ ] Build succeeds locally
- [ ] Type check passes
- [ ] Lint passes
- [ ] Deployed to production
- [ ] Health check passes
- [ ] All smoke tests pass
- [ ] 48-hour monitoring complete
- [ ] Stakeholders notified

---

## ✅ 8. Post-Launch

### 8.1 Performance Benchmarks

**Run after 1 week:**

```sql
-- Average report generation time
SELECT 
  AVG(generation_time) as avg_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time) as p95_time_ms
FROM report_analytics
WHERE event_type = 'generated'
AND timestamp > NOW() - INTERVAL '7 days';

-- Email delivery success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM email_delivery_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Schedule execution success rate
SELECT 
  COUNT(*) as total_runs,
  SUM(CASE WHEN failure_count = 0 THEN 1 ELSE 0 END) as successful_runs,
  ROUND(SUM(CASE WHEN failure_count = 0 THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as success_rate
FROM scheduled_reports
WHERE last_run > NOW() - INTERVAL '7 days';
```

### 8.2 User Feedback Collection

**Create feedback form:** `/feedback/reports`

**Track:**
- Feature usage (which features most used)
- User satisfaction (1-5 rating)
- Feature requests
- Bug reports

### 8.3 Prepare Launch Announcement

**Email Template:**

```
Subject: 🚀 New Reports Features Live: Templates, AI Tones, Sharing & More!

Hi [Name],

We're excited to announce that BookMate Reports Phase 3 is now live!

🎯 What's New:

✅ Saved Report Templates
   Save your favorite report configurations and reuse them instantly.
   Pre-loaded templates: Investor Update, Internal Summary, Bank Compliance

✅ AI-Powered Insights with 5 Tones
   Customize AI narratives for your audience:
   • Standard (professional)
   • Investor (growth-focused)
   • Internal (technical)
   • Founder (strategic)
   • Simple (plain language)

✅ Secure Shareable Links
   Share reports with investors, banks, or stakeholders
   • Set expiration dates
   • Add passcode protection
   • Limit view counts

✅ Email Delivery
   Send reports directly via email with PDF attachments

✅ Automated Scheduling
   Schedule weekly, monthly, or quarterly reports
   Automatic generation and email delivery

🎬 Getting Started:
1. Go to Reports page
2. Select a template (or create your own)
3. Generate your report
4. Click "Share / Schedule" to distribute

📚 Documentation: [link]
💬 Questions? Reply to this email or reach out to support@bookmate.com

Happy reporting!
The BookMate Team
```

**✅ Post-Launch Checklist:**
- [ ] Monitor logs for first 48 hours
- [ ] Review analytics after 1 week
- [ ] Collect user feedback
- [ ] Launch announcement sent
- [ ] Documentation published
- [ ] Support team briefed
- [ ] Celebrate! 🎉

---

## 🔒 Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Project Lead** | _____________ | ________ | _____________ |
| **Backend Lead** | _____________ | ________ | _____________ |
| **Frontend Lead** | _____________ | ________ | _____________ |
| **QA Lead** | _____________ | ________ | _____________ |
| **DevOps** | _____________ | ________ | _____________ |

---

## 📚 Additional Resources

- **REPORTS_PHASE_3_COMPLETE.md** - Full feature documentation
- **REPORTS_PHASE_3_DEPLOYMENT.md** - Detailed deployment guide
- **REPORTS_QUICK_REFERENCE.md** - Quick reference for developers
- **REPORTS_ARCHITECTURE_DIAGRAM.md** - System architecture
- **REPORTS_PHASE_3_CHECKLIST.md** - Detailed task checklist

---

**Last Updated:** November 10, 2025  
**Next Review:** Post-production (48 hours after launch)  
**Status:** 🔄 Ready for Production Launch
