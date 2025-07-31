// Audit Utility Functions

import { CriticalIssue, Recommendation } from '../types/index.js';

/**
 * Calculate overall audit score based on individual component scores
 */
export function calculateOverallScore(scores: {
  codeQuality: number;
  security: number;
  testing: number;
  performance: number;
  accessibility: number;
  documentation: number;
}): number {
  const weights = {
    codeQuality: 0.15,
    security: 0.25,
    testing: 0.20,
    performance: 0.15,
    accessibility: 0.15,
    documentation: 0.10
  };

  return Math.round(
    scores.codeQuality * weights.codeQuality +
    scores.security * weights.security +
    scores.testing * weights.testing +
    scores.performance * weights.performance +
    scores.accessibility * weights.accessibility +
    scores.documentation * weights.documentation
  );
}

/**
 * Determine production readiness level based on score and critical issues
 */
export function determineReadinessLevel(
  overallScore: number,
  criticalIssues: CriticalIssue[]
): 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'PRODUCTION_READY' {
  const criticalCount = criticalIssues.filter(issue => issue.severity === 'CRITICAL').length;
  const highCount = criticalIssues.filter(issue => issue.severity === 'HIGH').length;

  if (criticalCount > 0) {
    return 'NOT_READY';
  }

  if (highCount > 5 || overallScore < 60) {
    return 'NEEDS_WORK';
  }

  if (highCount > 0 || overallScore < 85) {
    return 'READY';
  }

  return 'PRODUCTION_READY';
}

/**
 * Generate next steps based on audit results
 */
export function generateNextSteps(
  criticalIssues: CriticalIssue[],
  recommendations: Recommendation[]
): string[] {
  const steps: string[] = [];

  // Handle critical issues first
  const criticalCount = criticalIssues.filter(issue => issue.severity === 'CRITICAL').length;
  if (criticalCount > 0) {
    steps.push(`Address ${criticalCount} critical security and quality issues immediately`);
  }

  // Handle high priority issues
  const highCount = criticalIssues.filter(issue => issue.severity === 'HIGH').length;
  if (highCount > 0) {
    steps.push(`Resolve ${highCount} high-priority issues before production deployment`);
  }

  // Add top recommendations
  const highPriorityRecommendations = recommendations
    .filter(rec => rec.priority === 'HIGH')
    .slice(0, 3);

  highPriorityRecommendations.forEach(rec => {
    steps.push(`Implement: ${rec.title}`);
  });

  // Add general guidance
  if (steps.length === 0) {
    steps.push('Continue monitoring and maintaining code quality standards');
    steps.push('Regular security audits and dependency updates');
    steps.push('Maintain test coverage above threshold');
  }

  return steps;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}

/**
 * Calculate percentage with proper rounding
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate severity color for UI display
 */
export function getSeverityColor(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
  switch (severity) {
    case 'LOW':
      return '#28a745'; // Green
    case 'MEDIUM':
      return '#ffc107'; // Yellow
    case 'HIGH':
      return '#fd7e14'; // Orange
    case 'CRITICAL':
      return '#dc3545'; // Red
    default:
      return '#6c757d'; // Gray
  }
}

/**
 * Sort issues by severity (critical first)
 */
export function sortBySeverity<T extends { severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>(
  issues: T[]
): T[] {
  const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  return [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Group issues by category
 */
export function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Generate timestamp for reports
 */
export function generateTimestamp(): Date {
  return new Date();
}

/**
 * Validate file path exists and is accessible
 */
export async function validateFilePath(filePath: string): Promise<boolean> {
  try {
    // In a real implementation, this would check file system access
    // For now, just validate the path format
    return filePath.length > 0 && !filePath.includes('..') && !filePath.startsWith('/');
  } catch {
    return false;
  }
}

/**
 * Sanitize file path for security
 */
export function sanitizeFilePath(filePath: string): string {
  return filePath
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .trim();
}

/**
 * Generate unique audit ID
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object for immutability
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}