/**
 * AI Report Tone Configuration
 * Personalizes AI-generated report narratives based on user preferences
 */

export type ReportTone = 'standard' | 'investor' | 'casual' | 'executive';

export interface CompanyContext {
  name: string;
  sector: string;
  goal?: string;
  industry?: string;
}

export interface AIToneConfig {
  tone: ReportTone;
  context?: CompanyContext;
}

/**
 * Tone-specific prompt modifiers
 */
export const TONE_PROMPTS: Record<ReportTone, {
  systemPrompt: string;
  style: string;
  focusAreas: string[];
  language: string;
}> = {
  standard: {
    systemPrompt: 'You are a professional financial analyst providing clear, balanced insights.',
    style: 'Professional, informative, and objective',
    focusAreas: [
      'Key financial metrics',
      'Trends and patterns',
      'Notable changes',
      'Actionable insights',
    ],
    language: 'Use clear business terminology. Maintain a neutral, professional tone.',
  },
  
  investor: {
    systemPrompt: 'You are a financial advisor preparing reports for investors and stakeholders.',
    style: 'Formal, data-driven, and strategic',
    focusAreas: [
      'ROI and profitability metrics',
      'Growth indicators',
      'Risk factors',
      'Investment opportunities',
      'Competitive positioning',
    ],
    language: 'Use formal financial terminology. Focus on numbers, percentages, and strategic implications. Be concise and fact-based.',
  },
  
  casual: {
    systemPrompt: 'You are a friendly financial advisor explaining complex topics in simple terms.',
    style: 'Conversational, approachable, and simplified',
    focusAreas: [
      'What the numbers mean in plain language',
      'Practical next steps',
      'Areas of concern explained simply',
      'Positive developments',
    ],
    language: 'Use everyday language. Avoid jargon. Break down complex concepts. Be encouraging and supportive.',
  },
  
  executive: {
    systemPrompt: 'You are providing executive summaries for C-level decision makers.',
    style: 'Brief, strategic, and action-oriented',
    focusAreas: [
      'Bottom-line impact',
      'Strategic implications',
      'Critical issues requiring attention',
      'High-level recommendations',
    ],
    language: 'Be extremely concise. Lead with impact. Use bullet points. Focus on decisions and actions needed.',
  },
};

/**
 * Build AI prompt with tone and context
 */
export function buildAIPrompt(
  config: AIToneConfig,
  reportData: {
    reportType: string;
    period: string;
    metrics: Record<string, any>;
    trends?: Record<string, any>;
  }
): string {
  const toneConfig = TONE_PROMPTS[config.tone];
  
  // Build context section
  let contextSection = '';
  if (config.context) {
    contextSection = `
Company Context:
- Name: ${config.context.name}
- Sector: ${config.context.sector}
${config.context.goal ? `- Goal: ${config.context.goal}` : ''}
${config.context.industry ? `- Industry: ${config.context.industry}` : ''}
`;
  }
  
  // Build the full prompt
  return `${toneConfig.systemPrompt}

${contextSection}

Report Type: ${reportData.reportType}
Period: ${reportData.period}

${toneConfig.language}

Focus on: ${toneConfig.focusAreas.join(', ')}

Financial Data:
${JSON.stringify(reportData.metrics, null, 2)}

${reportData.trends ? `Trends: ${JSON.stringify(reportData.trends, null, 2)}` : ''}

Generate a ${toneConfig.style} narrative analysis of this financial data.`;
}

/**
 * Default company context (can be overridden by user preferences)
 */
export const DEFAULT_COMPANY_CONTEXT: CompanyContext = {
  name: 'Sia Moon Co., Ltd.',
  sector: 'Property Management',
  goal: 'Simplify bookkeeping for SMEs',
  industry: 'Real Estate & Property Services',
};

/**
 * Get user's preferred tone from Firestore
 */
export async function getUserTonePreference(
  userId: string
): Promise<AIToneConfig> {
  // This will be implemented when Firestore user preferences are set up
  // For now, return default
  return {
    tone: 'standard',
    context: DEFAULT_COMPANY_CONTEXT,
  };
}

/**
 * Save user's tone preference to Firestore
 */
export async function saveUserTonePreference(
  userId: string,
  config: AIToneConfig
): Promise<void> {
  // This will be implemented with Firestore integration
  // For now, log the preference
  console.log(`[AI Tone] Saving preference for ${userId}:`, config);
}

/**
 * Example usage in report generation
 */
export function generateReportNarrative(
  config: AIToneConfig,
  reportData: {
    reportType: string;
    period: string;
    metrics: Record<string, any>;
    trends?: Record<string, any>;
  }
): {
  prompt: string;
  metadata: {
    tone: ReportTone;
    style: string;
    timestamp: string;
  };
} {
  const prompt = buildAIPrompt(config, reportData);
  const toneConfig = TONE_PROMPTS[config.tone];
  
  return {
    prompt,
    metadata: {
      tone: config.tone,
      style: toneConfig.style,
      timestamp: new Date().toISOString(),
    },
  };
}
