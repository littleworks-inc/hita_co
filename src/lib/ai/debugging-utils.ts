// =====================================
// AI Debugging & Monitoring Utilities
// src/lib/ai/debugging-utils.ts
// =====================================

import { AIProvider, AIResponse, AIGenerationRequest, ContentType } from '@/types/ai'

interface AIDebugLog {
  id: string
  timestamp: Date
  provider: AIProvider
  request: AIGenerationRequest
  response: AIResponse
  duration: number
  success: boolean
  error?: string
  retryCount?: number
}

interface AIMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  totalTokensUsed: number
  totalCost: number
  providerStats: { [provider: string]: ProviderStats }
  contentTypeStats: { [type: string]: ContentTypeStats }
  errorFrequency: { [error: string]: number }
}

interface ProviderStats {
  requests: number
  successes: number
  failures: number
  averageResponseTime: number
  totalTokens: number
  totalCost: number
  lastUsed: Date
}

interface ContentTypeStats {
  requests: number
  successes: number
  averageLength: number
  averageTokens: number
}

export class AIDebuggingUtils {
  private logs: AIDebugLog[] = []
  private readonly MAX_LOGS = 1000

  /**
   * Log AI request and response for debugging
   */
  logAIOperation(
    provider: AIProvider,
    request: AIGenerationRequest,
    response: AIResponse,
    duration: number,
    retryCount: number = 0
  ): void {
    const log: AIDebugLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      provider,
      request: this.sanitizeRequest(request),
      response: this.sanitizeResponse(response),
      duration,
      success: response.success,
      error: response.error,
      retryCount
    }

    this.logs.push(log)

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Operation:', {
        provider,
        type: request.type,
        success: response.success,
        duration: `${duration}ms`,
        tokens: response.usage?.tokens,
        error: response.error
      })
    }
  }

  /**
   * Generate comprehensive metrics from logged operations
   */
  generateMetrics(timeWindow?: { start: Date; end: Date }): AIMetrics {
    let filteredLogs = this.logs

    if (timeWindow) {
      filteredLogs = this.logs.filter(
        log => log.timestamp >= timeWindow.start && log.timestamp <= timeWindow.end
      )
    }

    const totalRequests = filteredLogs.length
    const successfulRequests = filteredLogs.filter(log => log.success).length
    const failedRequests = totalRequests - successfulRequests

    const totalDuration = filteredLogs.reduce((sum, log) => sum + log.duration, 0)
    const averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0

    const totalTokensUsed = filteredLogs.reduce(
      (sum, log) => sum + (log.response.usage?.tokens || 0), 0
    )

    const totalCost = filteredLogs.reduce(
      (sum, log) => sum + (log.response.usage?.cost || 0), 0
    )

    // Provider statistics
    const providerStats: { [provider: string]: ProviderStats } = {}
    const contentTypeStats: { [type: string]: ContentTypeStats } = {}
    const errorFrequency: { [error: string]: number } = {}

    for (const log of filteredLogs) {
      // Provider stats
      if (!providerStats[log.provider]) {
        providerStats[log.provider] = {
          requests: 0,
          successes: 0,
          failures: 0,
          averageResponseTime: 0,
          totalTokens: 0,
          totalCost: 0,
          lastUsed: log.timestamp
        }
      }

      const pStats = providerStats[log.provider]
      pStats.requests++
      if (log.success) pStats.successes++
      else pStats.failures++
      pStats.totalTokens += log.response.usage?.tokens || 0
      pStats.totalCost += log.response.usage?.cost || 0
      pStats.lastUsed = log.timestamp > pStats.lastUsed ? log.timestamp : pStats.lastUsed

      // Content type stats
      const contentType = log.request.type
      if (!contentTypeStats[contentType]) {
        contentTypeStats[contentType] = {
          requests: 0,
          successes: 0,
          averageLength: 0,
          averageTokens: 0
        }
      }

      const cStats = contentTypeStats[contentType]
      cStats.requests++
      if (log.success) cStats.successes++
      cStats.averageTokens += log.response.usage?.tokens || 0

      // Error frequency
      if (log.error) {
        errorFrequency[log.error] = (errorFrequency[log.error] || 0) + 1
      }
    }

    // Calculate averages for provider stats
    Object.values(providerStats).forEach(stats => {
      if (stats.requests > 0) {
        const providerLogs = filteredLogs.filter(log => log.provider === Object.keys(providerStats).find(p => providerStats[p] === stats))
        const totalDuration = providerLogs.reduce((sum, log) => sum + log.duration, 0)
        stats.averageResponseTime = totalDuration / stats.requests
      }
    })

    // Calculate averages for content type stats
    Object.values(contentTypeStats).forEach(stats => {
      if (stats.requests > 0) {
        stats.averageTokens = stats.averageTokens / stats.requests
      }
    })

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      totalTokensUsed,
      totalCost,
      providerStats,
      contentTypeStats,
      errorFrequency
    }
  }

  /**
   * Get recent error logs for troubleshooting
   */
  getRecentErrors(limit: number = 20): AIDebugLog[] {
    return this.logs
      .filter(log => !log.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get logs for specific provider
   */
  getProviderLogs(provider: AIProvider, limit: number = 50): AIDebugLog[] {
    return this.logs
      .filter(log => log.provider === provider)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get slow requests (above threshold)
   */
  getSlowRequests(thresholdMs: number = 5000, limit: number = 20): AIDebugLog[] {
    return this.logs
      .filter(log => log.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Generate health report for AI system
   */
  generateHealthReport(): {
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    recommendations: string[]
    metrics: AIMetrics
  } {
    const metrics = this.generateMetrics({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    })

    const issues: string[] = []
    const recommendations: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check success rate
    const successRate = metrics.totalRequests > 0 ? 
      (metrics.successfulRequests / metrics.totalRequests) * 100 : 100

    if (successRate < 50) {
      status = 'critical'
      issues.push(`Critical: Success rate is only ${successRate.toFixed(1)}%`)
      recommendations.push('Check API keys and provider configurations')
    } else if (successRate < 80) {
      status = 'warning'
      issues.push(`Warning: Success rate is ${successRate.toFixed(1)}%`)
      recommendations.push('Monitor error patterns and consider provider failover')
    }

    // Check response times
    if (metrics.averageResponseTime > 10000) {
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`Slow response times: ${metrics.averageResponseTime.toFixed(0)}ms average`)
      recommendations.push('Consider switching to faster AI models or implementing caching')
    }

    // Check for frequent errors
    const mostCommonError = Object.entries(metrics.errorFrequency)
      .sort(([,a], [,b]) => b - a)[0]

    if (mostCommonError && mostCommonError[1] > metrics.totalRequests * 0.3) {
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`Frequent error: "${mostCommonError[0]}" (${mostCommonError[1]} times)`)
      recommendations.push('Address the most common error pattern')
    }

    // Check provider diversity
    const activeProviders = Object.keys(metrics.providerStats).length
    if (activeProviders === 1 && metrics.totalRequests > 10) {
      issues.push('Single point of failure: Only one AI provider configured')
      recommendations.push('Configure multiple AI providers for redundancy')
    }

    // Check cost efficiency
    if (metrics.totalCost > 100 && metrics.totalRequests > 0) {
      const costPerRequest = metrics.totalCost / metrics.totalRequests
      if (costPerRequest > 0.10) {
        issues.push(`High cost per request: $${costPerRequest.toFixed(3)}`)
        recommendations.push('Consider using more cost-effective AI models')
      }
    }

    return {
      status,
      issues,
      recommendations,
      metrics
    }
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp', 'provider', 'type', 'success', 'duration', 
        'tokens', 'cost', 'error', 'retryCount'
      ]
      
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.provider,
        log.request.type,
        log.success,
        log.duration,
        log.response.usage?.tokens || 0,
        log.response.usage?.cost || 0,
        log.error || '',
        log.retryCount || 0
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Clear old logs to manage memory
   */
  clearOldLogs(olderThanDays: number = 7): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    const initialCount = this.logs.length
    
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate)
    
    return initialCount - this.logs.length
  }

  /**
   * Get performance benchmarks
   */
  getBenchmarks(): {
    fastestProvider: { provider: AIProvider; avgTime: number }
    mostReliableProvider: { provider: AIProvider; successRate: number }
    mostCostEffective: { provider: AIProvider; costPerToken: number }
    bestContentType: { type: ContentType; successRate: number }
  } {
    const metrics = this.generateMetrics()
    
    // Fastest provider
    const fastestProvider = Object.entries(metrics.providerStats)
      .sort(([,a], [,b]) => a.averageResponseTime - b.averageResponseTime)[0]

    // Most reliable provider
    const mostReliableProvider = Object.entries(metrics.providerStats)
      .map(([provider, stats]) => ({
        provider,
        successRate: stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)[0]

    // Most cost effective
    const mostCostEffective = Object.entries(metrics.providerStats)
      .map(([provider, stats]) => ({
        provider,
        costPerToken: stats.totalTokens > 0 ? stats.totalCost / stats.totalTokens : 0
      }))
      .filter(p => p.costPerToken > 0)
      .sort((a, b) => a.costPerToken - b.costPerToken)[0]

    // Best performing content type
    const bestContentType = Object.entries(metrics.contentTypeStats)
      .map(([type, stats]) => ({
        type,
        successRate: stats.requests > 0 ? (stats.successes / stats.requests) * 100 : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)[0]

    return {
      fastestProvider: {
        provider: fastestProvider?.[0] as AIProvider,
        avgTime: fastestProvider?.[1]?.averageResponseTime || 0
      },
      mostReliableProvider: {
        provider: mostReliableProvider?.provider as AIProvider,
        successRate: mostReliableProvider?.successRate || 0
      },
      mostCostEffective: {
        provider: mostCostEffective?.provider as AIProvider,
        costPerToken: mostCostEffective?.costPerToken || 0
      },
      bestContentType: {
        type: bestContentType?.type as ContentType,
        successRate: bestContentType?.successRate || 0
      }
    }
  }

  /**
   * Private utility methods
   */
  private generateLogId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizeRequest(request: AIGenerationRequest): AIGenerationRequest {
    // Remove sensitive data but keep structure for debugging
    return {
      ...request,
      context: {
        ...request.context,
        // Keep only essential fields for debugging
        name: request.context.name,
        category: request.context.category,
        // Truncate arrays to prevent log bloat
        materials: request.context.materials?.slice(0, 3),
        colors: request.context.colors?.slice(0, 3)
      }
    }
  }

  private sanitizeResponse(response: AIResponse): AIResponse {
    return {
      ...response,
      // Truncate content for logging
      content: typeof response.content === 'string' 
        ? response.content.substring(0, 200) + (response.content.length > 200 ? '...' : '')
        : response.content
    }
  }
}

/**
 * Utility functions for common debugging scenarios
 */
export const aiDebugUtils = {
  /**
   * Test AI provider connection with detailed error reporting
   */
  async testProviderConnection(
    provider: AIProvider, 
    apiKey: string, 
    model?: string
  ): Promise<{
    success: boolean
    responseTime?: number
    error?: string
    details?: any
  }> {
    const startTime = Date.now()
    
    try {
      // Import the service dynamically to avoid circular dependencies
      const { enhancedAIService } = await import('./enhanced-ai-service')
      
      const result = await enhancedAIService.testConnection(provider, apiKey)
      
      return {
        success: result.success,
        responseTime: Date.now() - startTime,
        error: result.error,
        details: { provider, model }
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: { provider, model }
      }
    }
  },

  /**
   * Validate AI configuration and provide detailed feedback
   */
  async validateConfiguration(): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Check environment variables
      const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          issues.push(`Missing environment variable: ${envVar}`)
        }
      }

      // Check database connection
      try {
        const { db } = await import('@/lib/db')
        await db.storeSetting.findFirst()
      } catch (error) {
        issues.push('Database connection failed')
        recommendations.push('Check DATABASE_URL and database connectivity')
      }

      // Check AI provider configuration
      try {
        const { enhancedAIService } = await import('./enhanced-ai-service')
        const configCheck = await enhancedAIService.isConfigured()
        
        if (!configCheck.configured) {
          issues.push(`AI configuration issue: ${configCheck.error}`)
          recommendations.push('Configure AI provider and API key in store settings')
        }
      } catch (error) {
        issues.push('Failed to check AI configuration')
      }

      if (issues.length === 0) {
        recommendations.push('Configuration looks good! Consider setting up multiple AI providers for redundancy.')
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      }

    } catch (error) {
      return {
        isValid: false,
        issues: [`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check system logs and ensure all dependencies are properly installed']
      }
    }
  },

  /**
   * Generate diagnostic report for troubleshooting
   */
  async generateDiagnosticReport(): Promise<{
    timestamp: Date
    systemInfo: any
    configuration: any
    recentErrors: any[]
    performance: any
    recommendations: string[]
  }> {
    const timestamp = new Date()
    const recommendations: string[] = []

    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }

    // Configuration check
    const configValidation = await aiDebugUtils.validateConfiguration()
    
    // Recent errors (mock data structure - would come from actual logging)
    const recentErrors: any[] = []

    // Performance metrics (would come from actual monitoring)
    const performance = {
      averageResponseTime: 0,
      successRate: 0,
      requestsLastHour: 0,
      errorsLastHour: 0
    }

    // Generate recommendations based on findings
    if (!configValidation.isValid) {
      recommendations.push('Fix configuration issues before proceeding')
    }

    if (systemInfo.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      recommendations.push('High memory usage detected - consider optimizing or restarting')
    }

    recommendations.push('Regular monitoring and maintenance recommended')

    return {
      timestamp,
      systemInfo,
      configuration: configValidation,
      recentErrors,
      performance,
      recommendations
    }
  },

  /**
   * Format error for user-friendly display
   */
  formatErrorForUser(error: any): {
    title: string
    message: string
    severity: 'info' | 'warning' | 'error'
    suggestions: string[]
  } {
    if (typeof error === 'string') {
      return {
        title: 'AI Generation Error',
        message: error,
        severity: 'error',
        suggestions: ['Try again in a few moments', 'Check your internet connection']
      }
    }

    if (error.message?.includes('rate limit')) {
      return {
        title: 'Rate Limit Exceeded',
        message: 'Too many requests to the AI provider. Please wait before trying again.',
        severity: 'warning',
        suggestions: [
          'Wait 1-2 minutes before trying again',
          'Consider upgrading your AI provider plan',
          'Use a different AI provider if available'
        ]
      }
    }

    if (error.message?.includes('quota') || error.message?.includes('402')) {
      return {
        title: 'API Quota Exceeded',
        message: 'Your AI provider quota has been exceeded.',
        severity: 'error',
        suggestions: [
          'Check your AI provider billing and usage',
          'Upgrade your AI provider plan',
          'Configure an alternative AI provider'
        ]
      }
    }

    if (error.message?.includes('API key') || error.message?.includes('401')) {
      return {
        title: 'Authentication Error',
        message: 'Invalid or missing AI provider API key.',
        severity: 'error',
        suggestions: [
          'Check your AI provider API key in settings',
          'Ensure the API key has proper permissions',
          'Generate a new API key if needed'
        ]
      }
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the AI provider.',
        severity: 'warning',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ]
      }
    }

    // Generic error handling
    return {
      title: 'Content Generation Failed',
      message: error.message || 'An unexpected error occurred while generating content.',
      severity: 'error',
      suggestions: [
        'Try again with different settings',
        'Check the system status',
        'Contact support if the issue continues'
      ]
    }
  }
}

// Export singleton instance
export const aiDebugging = new AIDebuggingUtils()

// Export utility functions
export { aiDebugUtils }

/**
 * React Hook for AI debugging (to be used in components)
 */
export const useAIDebugging = () => {
  const getHealthStatus = () => aiDebugging.generateHealthReport()
  const getRecentErrors = (limit?: number) => aiDebugging.getRecentErrors(limit)
  const getMetrics = () => aiDebugging.generateMetrics()
  const getBenchmarks = () => aiDebugging.getBenchmarks()
  const clearLogs = () => aiDebugging.clearOldLogs()
  
  return {
    getHealthStatus,
    getRecentErrors,
    getMetrics,
    getBenchmarks,
    clearLogs,
    formatError: aiDebugUtils.formatErrorForUser
  }
}