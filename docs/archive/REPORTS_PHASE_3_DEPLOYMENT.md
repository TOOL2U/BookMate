# 🚀 Phase 3 Deployment & Production Integration Guide

**Last Updated:** November 10, 2025

---

## 📋 Pre-Deployment Checklist

### ✅ Completed (Development)
- [x] All Phase 3 features implemented
- [x] Backend APIs created (templates, sharing, email, scheduling)
- [x] Frontend components integrated
- [x] Mock services in place
- [x] TypeScript compilation passes
- [x] No linting errors

### 🔄 Required for Production
- [ ] Database setup and migration
- [ ] Email service integration (SendGrid/SES)
- [ ] Cron scheduler configuration
- [ ] Environment variables configured
- [ ] Security hardening
- [ ] Performance testing
- [ ] Monitoring setup

---

## 🗄️ Database Integration

### Step 1: Choose Database

**Recommended:** PostgreSQL with Prisma ORM

**Why?**
- Robust JSONB support (for template configs, snapshots)
- Excellent timezone handling (for scheduling)
- Mature ecosystem
- Vercel/Supabase integration

### Step 2: Install Dependencies

```bash
npm install prisma @prisma/client
npx prisma init
```

### Step 3: Define Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ReportTemplate {
  id            String   @id @default(uuid())
  workspaceId   String   @map("workspace_id")
  name          String
  description   String?
  type          String   // internal-summary, investor-update, bank-compliance, custom
  config        Json     // Filters, sections, branding
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([workspaceId])
  @@map("report_templates")
}

model SharedReport {
  id           String    @id @default(uuid())
  workspaceId  String    @map("workspace_id")
  token        String    @unique
  reportName   String    @map("report_name")
  snapshot     Json      // Frozen report data
  accessConfig Json      @map("access_config") // Expiry, passcode, max views, view count
  createdAt    DateTime  @default(now()) @map("created_at")
  expiresAt    DateTime? @map("expires_at")

  @@index([token])
  @@index([expiresAt])
  @@index([workspaceId])
  @@map("shared_reports")
}

model ScheduledReport {
  id             String    @id @default(uuid())
  workspaceId    String    @map("workspace_id")
  name           String
  description    String?
  templateId     String?   @map("template_id")
  scheduleConfig Json      @map("schedule_config") // Frequency, day, time, timezone
  recipients     Json      // Array of email/name objects
  deliveryConfig Json      @map("delivery_config") // Format, includeAI, emailSubject
  status         String    @default("active") // active, paused, failed
  nextRun        DateTime? @map("next_run")
  lastRun        DateTime? @map("last_run")
  runCount       Int       @default(0) @map("run_count")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([workspaceId])
  @@index([nextRun])
  @@index([status])
  @@map("scheduled_reports")
}

model EmailDeliveryLog {
  id            String   @id @default(uuid())
  workspaceId   String   @map("workspace_id")
  scheduleId    String?  @map("schedule_id")
  recipients    Json     // Array of email addresses
  reportName    String   @map("report_name")
  status        String   // sent, failed, bounced
  error         String?
  sentAt        DateTime @default(now()) @map("sent_at")

  @@index([workspaceId])
  @@index([scheduleId])
  @@map("email_delivery_logs")
}
```

### Step 4: Run Migration

```bash
npx prisma migrate dev --name add_reports_phase_3
npx prisma generate
```

### Step 5: Update API Routes

**Example:** `app/api/reports/templates/route.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  const templates = await prisma.reportTemplate.findMany({
    where: { workspaceId: workspaceId || undefined },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ templates });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const template = await prisma.reportTemplate.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name,
      description: body.description,
      type: body.type,
      config: body.config,
    },
  });

  return Response.json({ template });
}
```

---

## 📧 Email Service Integration

### Option 1: SendGrid (Recommended)

**Step 1: Sign Up**
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Verify sender identity (email or domain)
3. Generate API key

**Step 2: Install SDK**
```bash
npm install @sendgrid/mail
```

**Step 3: Configure Environment**
```bash
# .env.local
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=reports@yourdomain.com
SENDGRID_FROM_NAME=BookMate Reports
```

**Step 4: Update Email Route**

**File:** `app/api/reports/email/route.ts`

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  const { recipients, reportName, pdfData, customSubject, customMessage } = await request.json();

  try {
    const msg = {
      to: recipients.map((r: any) => r.email),
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME || 'BookMate',
      },
      subject: customSubject || `${reportName}`,
      text: customMessage || `Please find attached your ${reportName}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFC700;">BookMate Financial Report</h2>
          <p>${customMessage || `Your requested report is ready.`}</p>
          <p style="color: #666; font-size: 14px;">
            This is an automated message from BookMate. Please do not reply to this email.
          </p>
        </div>
      `,
      attachments: [{
        content: pdfData,
        filename: `${reportName}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      }],
    };

    await sgMail.send(msg);

    // Log to database
    await prisma.emailDeliveryLog.create({
      data: {
        workspaceId: 'workspace-id', // Get from auth
        recipients: recipients,
        reportName,
        status: 'sent',
      },
    });

    return Response.json({ success: true, messageId: 'generated-id' });
  } catch (error: any) {
    console.error('SendGrid error:', error);
    
    await prisma.emailDeliveryLog.create({
      data: {
        workspaceId: 'workspace-id',
        recipients: recipients,
        reportName,
        status: 'failed',
        error: error.message,
      },
    });

    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### Option 2: AWS SES

**Step 1: Install SDK**
```bash
npm install @aws-sdk/client-ses
```

**Step 2: Configure**
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

---

## ⏰ Cron Scheduler Setup

### Option 1: Vercel Cron (Easiest for Vercel Deployments)

**Step 1: Create Cron Endpoint**

**File:** `app/api/cron/reports/route.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  
  // Fetch due schedules
  const dueSchedules = await prisma.scheduledReport.findMany({
    where: {
      status: 'active',
      nextRun: { lte: now },
    },
  });

  console.log(`Found ${dueSchedules.length} due schedules`);

  for (const schedule of dueSchedules) {
    try {
      await executeSchedule(schedule);
      
      // Update schedule
      const nextRun = calculateNextRun(
        schedule.scheduleConfig.frequency,
        schedule.scheduleConfig.dayOfWeek,
        schedule.scheduleConfig.dayOfMonth,
        schedule.scheduleConfig.time,
        schedule.scheduleConfig.timezone
      );

      await prisma.scheduledReport.update({
        where: { id: schedule.id },
        data: {
          lastRun: now,
          nextRun,
          runCount: schedule.runCount + 1,
        },
      });
    } catch (error) {
      console.error(`Schedule ${schedule.id} failed:`, error);
      
      await prisma.scheduledReport.update({
        where: { id: schedule.id },
        data: { status: 'failed' },
      });
    }
  }

  return Response.json({ processed: dueSchedules.length });
}

async function executeSchedule(schedule: any) {
  // 1. Generate report data
  const reportData = await generateReport(schedule.templateId);
  
  // 2. Generate PDF
  const pdfData = await generatePDF(reportData);
  
  // 3. Send email
  await sendEmail({
    recipients: schedule.recipients,
    reportName: schedule.name,
    pdfData,
  });
}
```

**Step 2: Configure `vercel.json`**

```json
{
  "crons": [{
    "path": "/api/cron/reports",
    "schedule": "*/5 * * * *"
  }]
}
```

**Step 3: Set Environment Variable**
```bash
vercel env add CRON_SECRET
# Enter a random secret (e.g., generated with `openssl rand -base64 32`)
```

### Option 2: node-cron (For Self-Hosted)

**Step 1: Install**
```bash
npm install node-cron
```

**Step 2: Create Scheduler Service**

**File:** `lib/cron/scheduler.ts`

```typescript
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function startScheduler() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled reports check...');
    
    const now = new Date();
    const dueSchedules = await prisma.scheduledReport.findMany({
      where: {
        status: 'active',
        nextRun: { lte: now },
      },
    });

    for (const schedule of dueSchedules) {
      await executeSchedule(schedule);
    }
  });
}
```

**Step 3: Start in Next.js**

**File:** `app/api/cron/start/route.ts` (call once on server start)

```typescript
import { startScheduler } from '@/lib/cron/scheduler';

let isStarted = false;

export async function GET() {
  if (!isStarted) {
    startScheduler();
    isStarted = true;
    return Response.json({ status: 'Scheduler started' });
  }
  return Response.json({ status: 'Already running' });
}
```

---

## 🔒 Security Hardening

### 1. Token Signing

**Install JWT**
```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

**Update Share Token Generation**

```typescript
import jwt from 'jsonwebtoken';

function generateShareToken(reportId: string, workspaceId: string): string {
  const payload = {
    reportId,
    workspaceId,
    type: 'share',
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '90d', // Max expiry
  });
}

function verifyShareToken(token: string): { reportId: string; workspaceId: string } {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { reportId: payload.reportId, workspaceId: payload.workspaceId };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

### 2. Rate Limiting

**Install**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Implementation**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 emails per hour
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with email sending...
}
```

### 3. Input Validation

**Install Zod**
```bash
npm install zod
```

**Example Validation**

```typescript
import { z } from 'zod';

const EmailRequestSchema = z.object({
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).max(50),
  reportName: z.string().min(1).max(255),
  pdfData: z.string(),
  customSubject: z.string().max(255).optional(),
  customMessage: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = EmailRequestSchema.parse(body);
    // Process with validated data...
  } catch (error) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

---

## 📊 Monitoring Setup

### 1. Error Tracking with Sentry

**Install**
```bash
npm install @sentry/nextjs
```

**Configure**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Use in Code**
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await sendEmail(...);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'reports',
      action: 'email-send',
    },
    extra: {
      recipients: recipients.length,
      reportName,
    },
  });
  throw error;
}
```

### 2. Custom Metrics

**File:** `lib/analytics/metrics.ts`

```typescript
export function trackReportGeneration(duration: number, type: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'report_generated', {
      duration_ms: duration,
      report_type: type,
    });
  }
}

export function trackShareLinkCreated(expiryDays: number, hasPasscode: boolean) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'share_link_created', {
      expiry_days: expiryDays,
      has_passcode: hasPasscode,
    });
  }
}
```

---

## 🧪 Testing Before Production

### 1. Unit Tests

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**Example Test**

```typescript
// lib/reports/__tests__/templates.test.ts
import { calculateRelativeDateRange } from '../templates';

describe('calculateRelativeDateRange', () => {
  it('should calculate last-month correctly', () => {
    const result = calculateRelativeDateRange('last-month');
    expect(result.start).toBeDefined();
    expect(result.end).toBeDefined();
  });
});
```

### 2. Integration Tests

**Test Schedule Creation**
```bash
curl -X POST http://localhost:3000/api/reports/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Schedule",
    "schedule": {
      "frequency": "weekly",
      "dayOfWeek": 1,
      "time": "09:00",
      "timezone": "America/New_York"
    },
    "recipients": [{"email": "test@example.com"}],
    "delivery": {"format": "pdf", "includeAI": true}
  }'
```

### 3. Load Testing

**Install k6**
```bash
brew install k6  # macOS
```

**Test Script**
```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.post('http://localhost:3000/api/reports/generate', {
    type: 'monthly',
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

**Run**
```bash
k6 run load-test.js
```

---

## 🚀 Deployment Steps

### 1. Pre-Deployment

```bash
# 1. Run all tests
npm run test

# 2. Build locally
npm run build

# 3. Check for TypeScript errors
npx tsc --noEmit

# 4. Run linter
npm run lint
```

### 2. Environment Setup

**Vercel Dashboard:**
1. Go to project settings
2. Add environment variables:
   - `DATABASE_URL`
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`
   - `CRON_SECRET`
   - `JWT_SECRET`
   - `OPENAI_API_KEY` (already set)

### 3. Deploy to Staging

```bash
vercel --env=staging
```

**Test:**
1. Create template
2. Generate report with AI
3. Create share link
4. Send test email
5. Create schedule
6. Verify schedule management page

### 4. Deploy to Production

```bash
vercel --prod
```

### 5. Post-Deployment

**Verify:**
- [ ] All pages load without errors
- [ ] Database connections working
- [ ] Email delivery functioning
- [ ] Cron jobs executing
- [ ] Monitoring showing data
- [ ] Error tracking active

**Monitor for 24 hours:**
- Check error rates in Sentry
- Verify cron executions in logs
- Monitor email delivery rates
- Check database query performance

---

## 📞 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
npx prisma db push

# Check connection pooling
# Add to DATABASE_URL: ?pgbouncer=true&connection_limit=1
```

### Email Not Sending

**Error:** `Invalid API key`

**Solution:**
1. Verify SENDGRID_API_KEY in Vercel dashboard
2. Check API key permissions in SendGrid
3. Verify sender email is verified

### Cron Not Executing

**Error:** Schedules not running

**Solution:**
1. Check Vercel Cron dashboard
2. Verify CRON_SECRET matches
3. Check function logs for errors
4. Ensure `/api/cron/reports` returns 200

### Share Links Not Working

**Error:** `Invalid token`

**Solution:**
1. Check JWT_SECRET is set
2. Verify token not expired
3. Check database for shared report entry
4. Verify workspace isolation

---

## ✅ Production Readiness Checklist

### Infrastructure
- [ ] PostgreSQL database provisioned
- [ ] SendGrid account verified
- [ ] Vercel Cron configured
- [ ] CDN configured for PDFs
- [ ] Redis for caching (optional)

### Security
- [ ] JWT secret generated and set
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention in email templates

### Monitoring
- [ ] Sentry error tracking active
- [ ] Custom metrics tracking
- [ ] Database query monitoring
- [ ] Cron job monitoring
- [ ] Email delivery monitoring

### Documentation
- [ ] API documentation updated
- [ ] User guide created
- [ ] Runbook for on-call
- [ ] Rollback plan documented

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Manual QA checklist completed
- [ ] Staging environment tested

---

## 🎉 You're Ready!

Once all checklist items are complete, Phase 3 is production-ready!

**Need Help?**
- Check REPORTS_PHASE_3_COMPLETE.md for feature documentation
- Review code comments in implementation files
- Test in staging before production deployment

**Next Phase Ideas:**
- Phase 4: Advanced analytics and insights
- Phase 5: Collaborative features
- Phase 6: Mobile app integration
