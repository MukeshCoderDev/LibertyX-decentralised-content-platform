// Comprehensive Audit Report Generator

import { ComprehensiveAuditReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReportOptions {
  outputPath: string;
  format: 'json' | 'html' | 'both';
  includeDetails: boolean;
  includeCharts: boolean;
  theme: 'light' | 'dark';
}

export class ReportGenerator {
  private options: ReportOptions;

  constructor(options: Partial<ReportOptions> = {}) {
    this.options = {
      outputPath: './audit-reports',
      format: 'both',
      includeDetails: true,
      includeCharts: true,
      theme: 'light',
      ...options
    };
  }

  /**
   * Generate comprehensive audit report
   */
  async generateReport(auditReport: ComprehensiveAuditReport): Promise<{
    jsonPath?: string;
    htmlPath?: string;
  }> {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputPath, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const results: { jsonPath?: string; htmlPath?: string } = {};

      // Generate JSON report
      if (this.options.format === 'json' || this.options.format === 'both') {
        const jsonPath = path.join(this.options.outputPath, `audit-report-${timestamp}.json`);
        await this.generateJsonReport(auditReport, jsonPath);
        results.jsonPath = jsonPath;
      }

      // Generate HTML report
      if (this.options.format === 'html' || this.options.format === 'both') {
        const htmlPath = path.join(this.options.outputPath, `audit-report-${timestamp}.html`);
        await this.generateHtmlReport(auditReport, htmlPath);
        results.htmlPath = htmlPath;
      }

      return results;

    } catch (error) {
      throw new AuditError(
        `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION',
        'HIGH',
        'Check output directory permissions and disk space'
      );
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJsonReport(auditReport: ComprehensiveAuditReport, outputPath: string): Promise<void> {
    const jsonReport = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        format: 'json'
      },
      ...auditReport
    };

    await fs.writeFile(outputPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(auditReport: ComprehensiveAuditReport, outputPath: string): Promise<void> {
    const html = this.generateHtmlContent(auditReport);
    await fs.writeFile(outputPath, html, 'utf-8');
  }

  /**
   * Generate HTML content
   */
  private generateHtmlContent(report: ComprehensiveAuditReport): string {
    const theme = this.options.theme;
    const includeCharts = this.options.includeCharts;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibertyX Audit Report</title>
    <style>
        ${this.getStyles(theme)}
    </style>
    ${includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
</head>
<body>
    <div class="container">
        ${this.generateHeader(report)}
        ${this.generateSummary(report)}
        ${this.generateScoreOverview(report)}
        ${includeCharts ? this.generateCharts(report) : ''}
        ${this.generatePhaseReports(report)}
        ${this.generateRecommendations(report)}
        ${this.generateFooter(report)}
    </div>
    ${includeCharts ? this.generateChartScripts(report) : ''}
</body>
</html>`;
  }

  /**
   * Generate CSS styles
   */
  private getStyles(theme: 'light' | 'dark'): string {
    const colors = theme === 'dark' ? {
      bg: '#1a1a1a',
      cardBg: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#444444',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    } : {
      bg: '#f8fafc',
      cardBg: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };

    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${colors.bg};
            color: ${colors.text};
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: ${colors.cardBg};
            border-radius: 12px;
            border: 1px solid ${colors.border};
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: ${colors.text};
        }
        
        .header .subtitle {
            color: ${colors.textSecondary};
            font-size: 1.1rem;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .summary-card {
            background: ${colors.cardBg};
            padding: 25px;
            border-radius: 12px;
            border: 1px solid ${colors.border};
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        
        .summary-card p {
            color: ${colors.textSecondary};
            font-size: 0.9rem;
        }
        
        .score-excellent { color: ${colors.success}; }
        .score-good { color: ${colors.info}; }
        .score-warning { color: ${colors.warning}; }
        .score-poor { color: ${colors.error}; }
        
        .status-passed { color: ${colors.success}; }
        .status-warning { color: ${colors.warning}; }
        .status-failed { color: ${colors.error}; }
        
        .phase-section {
            margin-bottom: 40px;
        }
        
        .phase-card {
            background: ${colors.cardBg};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        
        .phase-header {
            padding: 20px;
            border-bottom: 1px solid ${colors.border};
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .phase-title {
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .phase-score {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .phase-content {
            padding: 20px;
        }
        
        .recommendations {
            background: ${colors.cardBg};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 40px;
        }
        
        .recommendations h2 {
            margin-bottom: 20px;
            color: ${colors.text};
        }
        
        .recommendations ul {
            list-style: none;
        }
        
        .recommendations li {
            padding: 10px 0;
            border-bottom: 1px solid ${colors.border};
            position: relative;
            padding-left: 25px;
        }
        
        .recommendations li:before {
            content: '→';
            position: absolute;
            left: 0;
            color: ${colors.info};
            font-weight: bold;
        }
        
        .chart-container {
            background: ${colors.cardBg};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 40px;
        }
        
        .chart-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: ${colors.textSecondary};
            border-top: 1px solid ${colors.border};
            margin-top: 40px;
        }
        
        .details-toggle {
            background: ${colors.info};
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .details-content {
            display: none;
            margin-top: 15px;
            padding: 15px;
            background: ${colors.bg};
            border-radius: 8px;
            border: 1px solid ${colors.border};
        }
        
        .details-content.show {
            display: block;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .summary {
                grid-template-columns: 1fr;
            }
            
            .chart-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
  }

  /**
   * Generate header section
   */
  private generateHeader(report: ComprehensiveAuditReport): string {
    return `
        <div class="header">
            <h1>🔍 LibertyX Audit Report</h1>
            <p class="subtitle">Generated on ${report.timestamp.toLocaleString()}</p>
            <p class="subtitle">Execution time: ${(report.executionTime / 1000).toFixed(2)} seconds</p>
        </div>
    `;
  }

  /**
   * Generate summary section
   */
  private generateSummary(report: ComprehensiveAuditReport): string {
    const getScoreClass = (score: number) => {
      if (score >= 90) return 'score-excellent';
      if (score >= 80) return 'score-good';
      if (score >= 70) return 'score-warning';
      return 'score-poor';
    };

    const getStatusClass = (status: string) => {
      return `status-${status}`;
    };

    return `
        <div class="summary">
            <div class="summary-card">
                <h3 class="${getScoreClass(report.overallScore)}">${report.overallScore}/100</h3>
                <p>Overall Score</p>
            </div>
            <div class="summary-card">
                <h3 class="${getStatusClass(report.overallStatus)}">${report.overallStatus.toUpperCase()}</h3>
                <p>Overall Status</p>
            </div>
            <div class="summary-card">
                <h3>${report.productionReadiness.replace('_', ' ')}</h3>
                <p>Production Readiness</p>
            </div>
            <div class="summary-card">
                <h3>${report.phasesPassed.length}/${report.phasesExecuted.length}</h3>
                <p>Phases Passed</p>
            </div>
        </div>
    `;
  }

  /**
   * Generate score overview
   */
  private generateScoreOverview(report: ComprehensiveAuditReport): string {
    const phases = report.phasesExecuted.map(phase => {
      const phaseReport = report.reports[phase];
      const score = phaseReport?.score || 0;
      const status = phaseReport?.status || 'failed';
      
      return {
        name: phase.replace('_', ' '),
        score,
        status
      };
    });

    const phaseCards = phases.map(phase => `
        <div class="summary-card">
            <h3 class="${phase.status === 'passed' ? 'score-excellent' : 'score-poor'}">${phase.score}</h3>
            <p>${phase.name}</p>
        </div>
    `).join('');

    return `
        <div class="phase-section">
            <h2>📊 Phase Scores</h2>
            <div class="summary">
                ${phaseCards}
            </div>
        </div>
    `;
  }

  /**
   * Generate charts section
   */
  private generateCharts(report: ComprehensiveAuditReport): string {
    return `
        <div class="chart-container">
            <h2>📈 Visual Analysis</h2>
            <div class="chart-grid">
                <div>
                    <h3>Phase Scores</h3>
                    <canvas id="phaseScoresChart" width="400" height="200"></canvas>
                </div>
                <div>
                    <h3>Status Distribution</h3>
                    <canvas id="statusChart" width="400" height="200"></canvas>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Generate phase reports section
   */
  private generatePhaseReports(report: ComprehensiveAuditReport): string {
    const phaseReportsHtml = report.phasesExecuted.map(phase => {
      const phaseReport = report.reports[phase];
      if (!phaseReport) return '';

      const statusClass = `status-${phaseReport.status}`;
      const scoreClass = phaseReport.score >= 80 ? 'score-excellent' : 
                        phaseReport.score >= 70 ? 'score-good' :
                        phaseReport.score >= 60 ? 'score-warning' : 'score-poor';

      return `
            <div class="phase-card">
                <div class="phase-header">
                    <div>
                        <h3 class="phase-title">${phase.replace('_', ' ')}</h3>
                        <p class="${statusClass}">${phaseReport.status.toUpperCase()}</p>
                    </div>
                    <div class="phase-score ${scoreClass}">${phaseReport.score}/100</div>
                </div>
                <div class="phase-content">
                    <p><strong>Summary:</strong> ${phaseReport.summary}</p>
                    ${this.options.includeDetails ? `
                        <button class="details-toggle" onclick="toggleDetails('${phase}')">
                            Show Details
                        </button>
                        <div id="details-${phase}" class="details-content">
                            <pre>${JSON.stringify(phaseReport.details, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="phase-section">
            <h2>📋 Detailed Phase Reports</h2>
            ${phaseReportsHtml}
        </div>
    `;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendations(report: ComprehensiveAuditReport): string {
    const recommendations = report.recommendations.slice(0, 20); // Limit to top 20
    
    const recommendationsHtml = recommendations.map(rec => `
        <li>${rec}</li>
    `).join('');

    return `
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            <ul>
                ${recommendationsHtml}
            </ul>
        </div>
    `;
  }

  /**
   * Generate footer section
   */
  private generateFooter(report: ComprehensiveAuditReport): string {
    return `
        <div class="footer">
            <p>Generated by LibertyX Audit System v1.0.0</p>
            <p>Report ID: ${report.timestamp.getTime()}</p>
            <p>For questions or support, contact the development team</p>
        </div>
        
        <script>
            function toggleDetails(phase) {
                const details = document.getElementById('details-' + phase);
                const button = event.target;
                
                if (details.classList.contains('show')) {
                    details.classList.remove('show');
                    button.textContent = 'Show Details';
                } else {
                    details.classList.add('show');
                    button.textContent = 'Hide Details';
                }
            }
        </script>
    `;
  }

  /**
   * Generate chart scripts
   */
  private generateChartScripts(report: ComprehensiveAuditReport): string {
    const phases = report.phasesExecuted.map(phase => ({
      name: phase.replace('_', ' '),
      score: report.reports[phase]?.score || 0
    }));

    const statusCounts = {
      passed: report.phasesPassed.length,
      failed: report.phasesFailed.length,
      errors: report.errors.length
    };

    return `
        <script>
            // Phase Scores Chart
            const phaseCtx = document.getElementById('phaseScoresChart');
            if (phaseCtx) {
                new Chart(phaseCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(phases.map(p => p.name))},
                        datasets: [{
                            label: 'Score',
                            data: ${JSON.stringify(phases.map(p => p.score))},
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                });
            }
            
            // Status Distribution Chart
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx) {
                new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Passed', 'Failed', 'Errors'],
                        datasets: [{
                            data: [${statusCounts.passed}, ${statusCounts.failed}, ${statusCounts.errors}],
                            backgroundColor: [
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(245, 158, 11, 0.8)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            }
        </script>
    `;
  }

  /**
   * Generate summary report for CI/CD
   */
  async generateSummaryReport(auditReport: ComprehensiveAuditReport): Promise<string> {
    const summary = {
      timestamp: auditReport.timestamp,
      overallScore: auditReport.overallScore,
      overallStatus: auditReport.overallStatus,
      productionReadiness: auditReport.productionReadiness,
      phasesExecuted: auditReport.phasesExecuted.length,
      phasesPassed: auditReport.phasesPassed.length,
      phasesFailed: auditReport.phasesFailed.length,
      errors: auditReport.errors.length,
      executionTime: auditReport.executionTime,
      topRecommendations: auditReport.recommendations.slice(0, 5)
    };

    return JSON.stringify(summary, null, 2);
  }
}