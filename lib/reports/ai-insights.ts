/**
 * AI Insights Generator for Financial Reports
 * 
 * Uses OpenAI to generate narrative summaries and insights
 * WITHOUT altering any financial calculations.
 * 
 * Integrated with tone-config.ts for consistent AI tone across the app
 */

import OpenAI from 'openai';
import { TONE_PROMPTS, buildAIPrompt, type ReportTone } from '@/lib/ai/tone-config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use standardized tones from tone-config
export type AITone = ReportTone;

export interface AIInsightsInput {
  period: {
    type: string;
    start: string;
    end: string;
    label: string;
  };
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    cashPosition: number;
  };
  trends?: {
    revenuePrevious?: number;
    expensesPrevious?: number;
    profitPrevious?: number;
  };
  breakdown: {
    topExpenses: { category: string; amount: number }[];
    topRevenues?: { category: string; amount: number }[];
  };
  // Phase 3: AI Tone & Context
  tone?: AITone;
  language?: string;
  organizationProfile?: {
    businessName?: string;
    sector?: string;
    keyProperties?: string[];
    goals?: string[];
  };
}

export interface AIInsightsOutput {
  executiveSummary: string[];
  keyTrends: string[];
  risks: string[];
  opportunities: string[];
}

export async function generateAIInsights(
  input: AIInsightsInput
): Promise<AIInsightsOutput> {
  try {
    const prompt = buildPrompt(input);
    const systemPrompt = buildSystemPrompt(input.tone, input.organizationProfile);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      // Use different temperature based on tone
      // casual: more creative (0.7), investor/executive: more precise (0.5), standard: balanced (0.6)
      temperature: input.tone === 'casual' ? 0.7 : input.tone === 'investor' || input.tone === 'executive' ? 0.5 : 0.6,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    
    // Validate structure
    return {
      executiveSummary: Array.isArray(parsed.executiveSummary) 
        ? parsed.executiveSummary.slice(0, 4) 
        : [],
      keyTrends: Array.isArray(parsed.keyTrends) 
        ? parsed.keyTrends.slice(0, 4) 
        : [],
      risks: Array.isArray(parsed.risks) 
        ? parsed.risks.slice(0, 3) 
        : [],
      opportunities: Array.isArray(parsed.opportunities) 
        ? parsed.opportunities.slice(0, 3) 
        : [],
    };
  } catch (error) {
    console.error('AI Insights generation failed:', error);
    throw new Error('Failed to generate AI insights');
  }
}

function buildSystemPrompt(
  tone: ReportTone = 'standard',
  organizationProfile?: AIInsightsInput['organizationProfile']
): string {
  // Get standardized tone configuration
  const toneConfig = TONE_PROMPTS[tone];
  
  let basePrompt = `You are a financial analyst providing insights for BookMate, a property management financial platform.

CRITICAL RULES:
1. NEVER recalculate or alter the provided numbers
2. Only provide narrative interpretation and context
3. Keep insights concise (2-3 sentences max per point)
4. Focus on actionable takeaways
5. Return ONLY valid JSON in the exact format specified
6. If data is missing or unavailable, acknowledge it rather than fabricating

${toneConfig.systemPrompt}

STYLE: ${toneConfig.style}
FOCUS AREAS: ${toneConfig.focusAreas.join(', ')}
LANGUAGE GUIDELINES: ${toneConfig.language}`;

  // Add organization context if provided
  if (organizationProfile) {
    basePrompt += `\n\nORGANIZATION CONTEXT:`;
    
    if (organizationProfile.businessName) {
      basePrompt += `\n- Business: ${organizationProfile.businessName}`;
    }
    
    if (organizationProfile.sector) {
      basePrompt += `\n- Sector: ${organizationProfile.sector}`;
    }
    
    if (organizationProfile.keyProperties && organizationProfile.keyProperties.length > 0) {
      basePrompt += `\n- Key Properties: ${organizationProfile.keyProperties.join(', ')}`;
    }
    
    if (organizationProfile.goals && organizationProfile.goals.length > 0) {
      basePrompt += `\n- Goals: ${organizationProfile.goals.join(', ')}`;
    }
    
    basePrompt += `\n\nUse this context to make insights more relevant, but NEVER fabricate data about these properties or goals.`;
  }

  return basePrompt;
}

function buildPrompt(input: AIInsightsInput): string {
  const { period, metrics, trends, breakdown } = input;

  let prompt = `Analyze this financial report for ${period.label} (${period.start} to ${period.end}):

FINANCIAL METRICS (DO NOT RECALCULATE):
- Total Revenue: $${metrics.totalRevenue.toLocaleString()}
- Total Expenses: $${metrics.totalExpenses.toLocaleString()}
- Net Profit: $${metrics.netProfit.toLocaleString()}
- Profit Margin: ${metrics.profitMargin.toFixed(1)}%
- Cash Position: $${metrics.cashPosition.toLocaleString()}
`;

  if (trends?.revenuePrevious) {
    const revenueChange = ((metrics.totalRevenue - trends.revenuePrevious) / trends.revenuePrevious * 100).toFixed(1);
    const expenseChange = trends.expensesPrevious 
      ? ((metrics.totalExpenses - trends.expensesPrevious) / trends.expensesPrevious * 100).toFixed(1)
      : null;
    
    prompt += `\nTRENDS vs PREVIOUS PERIOD:
- Revenue: ${revenueChange}% ${Number(revenueChange) >= 0 ? 'increase' : 'decrease'}
${expenseChange ? `- Expenses: ${expenseChange}% ${Number(expenseChange) >= 0 ? 'increase' : 'decrease'}` : ''}
`;
  }

  if (breakdown.topExpenses.length > 0) {
    prompt += `\nTOP EXPENSE CATEGORIES:
${breakdown.topExpenses.map(e => `- ${e.category}: $${e.amount.toLocaleString()}`).join('\n')}
`;
  }

  prompt += `\nProvide insights in JSON format with these exact keys:
{
  "executiveSummary": ["point 1", "point 2", "point 3"],
  "keyTrends": ["trend 1", "trend 2", "trend 3"],
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"]
}

Guidelines:
- Executive Summary: High-level overview and key takeaways (3-4 points)
- Key Trends: Notable patterns in revenue, expenses, or profitability (2-4 points)
- Risks: Potential concerns or areas requiring attention (2-3 points)
- Opportunities: Areas for improvement or growth (2-3 points)

Keep each point concise (2-3 sentences). Be specific and actionable.`;

  return prompt;
}
