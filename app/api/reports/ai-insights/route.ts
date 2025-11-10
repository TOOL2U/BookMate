/**
 * API Route: /api/reports/ai-insights
 * 
 * Generates AI-powered narrative insights for financial reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAIInsights, AIInsightsInput } from '@/lib/reports/ai-insights';

export async function POST(req: NextRequest) {
  try {
    const input: AIInsightsInput = await req.json();

    // Validate required fields
    if (!input.period || !input.metrics) {
      return NextResponse.json(
        { error: 'Missing required fields: period and metrics' },
        { status: 400 }
      );
    }

    // Generate insights
    const insights = await generateAIInsights(input);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('AI Insights API error:', error);
    
    // Check for OpenAI quota errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('insufficient_quota');
    
    return NextResponse.json(
      { 
        error: isQuotaError ? 'OpenAI API quota exceeded' : 'Failed to generate AI insights',
        details: errorMessage,
        quotaExceeded: isQuotaError
      },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}
