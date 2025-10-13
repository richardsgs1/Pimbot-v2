// ============================================
// AI COST OPTIMIZATION & ROUTING
// ============================================

export type QueryComplexity = 'simple' | 'medium' | 'complex';

export interface AIProvider {
  name: 'openai' | 'gemini' | 'claude';
  model: string;
  costPer1k: number;
}

// Estimated costs per 1000 tokens (input + output blended)
const PROVIDERS = {
  simple: { name: 'gemini' as const, model: 'gemini-flash', costPer1k: 0.00034 },
  medium: { name: 'gemini' as const, model: 'gemini-pro', costPer1k: 0.00175 },
  complex: { name: 'openai' as const, model: 'gpt-4o-mini', costPer1k: 0.00068 }
};

/**
 * Route queries to cost-effective AI models based on complexity
 */
export const routeQuery = (complexity: QueryComplexity): AIProvider => {
  return PROVIDERS[complexity];
};

/**
 * Analyze query text to determine complexity level
 */
export const analyzeQueryComplexity = (query: string, context?: string): QueryComplexity => {
  const lowerQuery = query.toLowerCase();
  const totalLength = query.length + (context?.length || 0);
  
  // Simple queries - quick lookups, status checks
  const simpleKeywords = [
    'status', 'what is', 'show me', 'list', 'how many',
    'when', 'who', 'where', 'display', 'get'
  ];
  
  // Complex queries - analysis, recommendations, planning
  const complexKeywords = [
    'analyze', 'compare', 'strategy', 'recommend', 'optimize',
    'predict', 'evaluate', 'assess', 'plan', 'forecast',
    'calculate', 'determine', 'identify risks', 'suggest'
  ];
  
  // Check for complex keywords
  if (complexKeywords.some(kw => lowerQuery.includes(kw))) {
    return 'complex';
  }
  
  // Check for simple keywords and short length
  if (simpleKeywords.some(kw => lowerQuery.includes(kw)) && totalLength < 150) {
    return 'simple';
  }
  
  // Very long queries are complex
  if (totalLength > 500) {
    return 'complex';
  }
  
  // Default to medium
  return 'medium';
};

/**
 * Estimate cost of a query in dollars
 */
export const estimateQueryCost = (
  query: string,
  context?: string,
  complexity?: QueryComplexity
): number => {
  const detectedComplexity = complexity || analyzeQueryComplexity(query, context);
  const provider = routeQuery(detectedComplexity);
  
  // Rough estimation: 4 chars ≈ 1 token
  const estimatedTokens = (query.length + (context?.length || 0)) / 4;
  const estimatedOutput = estimatedTokens * 1.5; // Responses typically 1.5x input
  const totalTokens = estimatedTokens + estimatedOutput;
  
  return (totalTokens / 1000) * provider.costPer1k;
};