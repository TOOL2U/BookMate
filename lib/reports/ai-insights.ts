/**
 * AI Insights Generator for Financial Reports
 * 
 * Uses OpenAI to generate narrative summaries and insights
 * WITHOUT altering any financial calculations.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AITone = 'standard' | 'investor' | 'internal' | 'founder' | 'simple';

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
      temperature: input.tone === 'simple' ? 0.5 : 0.7,
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
  tone?: 'standard' | 'investor' | 'internal' | 'founder' | 'simple',
  organizationProfile?: AIInsightsInput['organizationProfile']
): string {
  let basePrompt = `You are a financial analyst providing insights for BookMate, a property management financial platform.

CRITICAL RULES:
1. NEVER recalculate or alter the provided numbers
2. Only provide narrative interpretation and context
3. Keep insights concise (2-3 sentences max per point)
4. Focus on actionable takeaways
5. Return ONLY valid JSON in the exact format specified
6. If data is missing or unavailable, acknowledge it rather than fabricating`;

  // Add tone-specific instructions
  switch (tone) {
    case 'investor':
      basePrompt += `\n\nTONE: Investor Update
- Use professional, confident language suitable for investors
- Focus on growth metrics, ROI, and financial health
- Highlight opportunities and strategic initiatives
- Be transparent about risks while maintaining confidence
- Use terms like "portfolio performance", "capital efficiency", "market position"`;
      break;

    case 'internal':
      basePrompt += `\n\nTONE: Internal Finance Team
- Use technical financial terminology
- Be direct and detailed about operational metrics
- Focus on process improvements and efficiency gains
- Highlight areas requiring immediate attention
- Use terms like "variance analysis", "cash flow optimization", "cost control"`;
      break;

    case 'founder':
      basePrompt += `\n\nTONE: Founder/Executive Summary
- Use strategic, big-picture language
- Connect financial performance to business goals
- Emphasize growth trajectory and market position
- Be concise and action-oriented
- Use terms like "runway", "burn rate", "unit economics", "scaling"`;
      break;

    case 'simple':
      basePrompt += `\n\nTONE: Simple/Non-Technical
- Use plain language, avoid jargon
- Explain financial concepts in accessible terms
- Focus on what the numbers mean in practical terms
- Use analogies and simple comparisons
- Avoid complex financial terminology`;
      break;

    default: // standard
      basePrompt += `\n\nTONE: Standard/Neutral
- Use professional but accessible language
- Balance technical accuracy with clarity
- Suitable for general business audience
- Focus on key insights and actionable recommendations`;
  }

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
