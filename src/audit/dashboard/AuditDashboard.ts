// Interactive Audit Dashboard Generator

import { ComprehensiveAuditReport, AuditReport, AuditPhase } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DashboardOptions {
  outputPath: string;
  title: string;
  theme: 'light' | 'dark';
  includeHistoricalData: boolean;
  enableInteractivity: boolean;
  showTrends: boolean;
}

export interface HistoricalData {
  timestamp: Date;
  overallScore: number;
  phaseScores: Record<AuditPhase, number>;
  productionReadiness: string;
}

export class AuditDashboard {
  private options: DashboardOptions;
  private historicalData: HistoricalData[] = [];

  constructor(options: Partial<DashboardOptions> = {}) {
    this.options = {
      outputPath: './audit-dashboard',
      title: 'LibertyX Audit Dashboard',
      theme: 'light',
      includeHistoricalData: true,
      enableInteractivity: true,
      showTrends: true,
      ...options
    };
  }

  /**
   * Generate interactive audit dashboard
   */
  async generateDashboard(auditReport: ComprehensiveAuditReport): Promise<string> {
    try {
      // Ensure output directory exists
      await fs.mkdir(this.options.outputPath, { recursive: true });

      // Load historical data if enabled
      if (this.options.includeHistoricalData) {
        await this.loadHistoricalData();
        await this.addToHistoricalData(auditReport);
      }

      // Generate dashboard HTML
      const dashboardPath = path.join(this.options.outputPath, 'index.html');
      const dashboardHtml = this.generateDashboardHtml(auditReport);
      
      await fs.writeFile(dashboardPath, dashboardHtml, 'utf-8');

      // Copy static assets
      await this.copyStaticAssets();

      return dashboardPath;

    } catch (error) {
      throw new AuditError(
        `Dashboard generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DASHBOARD',
        'HIGH',
        'Check output directory permissions and disk space'
      );
    }
  }

  /**
   * Generate dashboard HTML content
   */
  private generateDashboardHtml(report: ComprehensiveAuditReport): string {
    const theme = this.options.theme;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <link rel="stylesheet" href="./assets/dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
</head>
<body class="theme-${theme}">
    <div class="dashboard-container">
        ${this.generateHeader(report)}
        ${this.generateOverviewSection(report)}
        ${this.generatePhaseDetailsSection(report)}
        ${this.options.showTrends ? this.generateTrendsSection() : ''}
        ${this.generateRecommendationsSection(report)}
        ${this.generateFooter(report)}
    </div>
    
    <script src="./assets/dashboard.js"></script>
    <script>
        // Initialize dashboard with data
        window.auditData = ${JSON.stringify(report)};
        window.historicalData = ${JSON.stringify(this.historicalData)};
        window.dashboardOptions = ${JSON.stringify(this.options)};
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
        });
    </script>
</body>
</html>`;
  }

  /**
   * Generate header section
   */
  private generateHeader(report: ComprehensiveAuditReport): string {
    const statusIcon = this.getStatusIcon(report.overallStatus);
    const readinessColor = this.getReadinessColor(report.productionReadiness);
    
    return `
        <header class="dashboard-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="dashboard-title">
                        <span class="title-icon">🔍</span>
                        ${this.options.title}
                    </h1>
                    <p class="dashboard-subtitle">
                        Generated on ${report.timestamp.toLocaleString()}
                    </p>
                </div>
                <div class="header-right">
                    <div class="status-badge status-${report.overallStatus}">
                        ${statusIcon} ${report.overallStatus.toUpperCase()}
                    </div>
                    <div class="readiness-badge readiness-${report.productionReadiness.toLowerCase()}">
                        ${report.productionReadiness.replace('_', ' ')}
                    </div>
                </div>
            </div>
        </header>
    `;
  }

  /**
   * Generate overview section
   */
  private generateOverviewSection(report: ComprehensiveAuditReport): string {
    return `
        <section class="overview-section">
            <div class="overview-grid">
                <div class="metric-card score-card">
                    <div class="metric-value score-${this.getScoreClass(report.overallScore)}">
                        ${report.overallScore}
                    </div>
                    <div class="metric-label">Overall Score</div>
                    <div class="metric-chart">
                        <canvas id="scoreGauge" width="120" height="120"></canvas>
                    </div>
                </div>
                
                <div class="metric-card phases-card">
                    <div class="metric-value">${report.phasesPassed.length}/${report.phasesExecuted.length}</div>
                    <div class="metric-label">Phases Passed</div>
                    <div class="phases-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(report.phasesPassed.length / report.phasesExecuted.length) * 100}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card execution-card">
                    <div class="metric-value">${(report.executionTime / 1000).toFixed(1)}s</div>
                    <div class="metric-label">Execution Time</div>
                    <div class="execution-details">
                        <span class="detail-item">
                            <span class="detail-icon">⚡</span>
                            ${report.config.parallel ? 'Parallel' : 'Sequential'}
                        </span>
                    </div>
                </div>
                
                <div class="metric-card errors-card">
                    <div class="metric-value ${report.errors.length > 0 ? 'has-errors' : ''}">${report.errors.length}</div>
                    <div class="metric-label">Errors</div>
                    ${report.errors.length > 0 ? `
                        <div class="error-preview">
                            <button class="show-errors-btn" onclick="toggleErrorDetails()">
                                View Details
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </section>
    `;
  }

  /**
   * Generate phase details section
   */
  private generatePhaseDetailsSection(report: ComprehensiveAuditReport): string {
    const phaseCards = report.phasesExecuted.map(phase => {
      const phaseReport = report.reports[phase];
      if (!phaseReport) return '';

      const scoreClass = this.getScoreClass(phaseReport.score);
      const statusIcon = this.getStatusIcon(phaseReport.status);
      
      return `
            <div class="phase-card" data-phase="${phase}">
                <div class="phase-header">
                    <div class="phase-title">
                        <span class="phase-icon">${this.getPhaseIcon(phase)}</span>
                        <h3>${phase.replace('_', ' ')}</h3>
                    </div>
                    <div class="phase-score score-${scoreClass}">
                        ${phaseReport.score}/100
                    </div>
                </div>
                
                <div class="phase-content">
                    <div class="phase-status status-${phaseReport.status}">
                        ${statusIcon} ${phaseReport.status.toUpperCase()}
                    </div>
                    
                    <p class="phase-summary">${phaseReport.summary}</p>
                    
                    <div class="phase-actions">
                        <button class="btn-secondary" onclick="showPhaseDetails('${phase}')">
                            View Details
                        </button>
                        <button class="btn-secondary" onclick="showPhaseRecommendations('${phase}')">
                            Recommendations
                        </button>
                    </div>
                </div>
                
                <div class="phase-chart">
                    <canvas id="phase-${phase}-chart" width="200" height="100"></canvas>
                </div>
            </div>
        `;
    }).join('');

    return `
        <section class="phases-section">
            <h2 class="section-title">
                <span class="section-icon">📋</span>
                Phase Analysis
            </h2>
            <div class="phases-grid">
                ${phaseCards}
            </div>
        </section>
    `;
  }

  /**
   * Generate trends section
   */
  private generateTrendsSection(): string {
    if (this.historicalData.length < 2) {
      return `
            <section class="trends-section">
                <h2 class="section-title">
                    <span class="section-icon">📈</span>
                    Trends Analysis
                </h2>
                <div class="no-data-message">
                    <p>Insufficient historical data for trend analysis.</p>
                    <p>Run more audits to see trends over time.</p>
                </div>
            </section>
        `;
    }

    return `
        <section class="trends-section">
            <h2 class="section-title">
                <span class="section-icon">📈</span>
                Trends Analysis
            </h2>
            
            <div class="trends-grid">
                <div class="trend-card">
                    <h3>Overall Score Trend</h3>
                    <canvas id="scoreTrendChart" width="400" height="200"></canvas>
                </div>
                
                <div class="trend-card">
                    <h3>Phase Performance</h3>
                    <canvas id="phaseTrendChart" width="400" height="200"></canvas>
                </div>
                
                <div class="trend-card">
                    <h3>Production Readiness</h3>
                    <canvas id="readinessTrendChart" width="400" height="200"></canvas>
                </div>
                
                <div class="trend-card">
                    <h3>Audit Frequency</h3>
                    <canvas id="frequencyChart" width="400" height="200"></canvas>
                </div>
            </div>
        </section>
    `;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendationsSection(report: ComprehensiveAuditReport): string {
    const topRecommendations = report.recommendations.slice(0, 10);
    const recommendationItems = topRecommendations.map((rec, index) => `
        <div class="recommendation-item" data-priority="${this.getRecommendationPriority(rec)}">
            <div class="recommendation-number">${index + 1}</div>
            <div class="recommendation-content">
                <p>${rec}</p>
            </div>
            <div class="recommendation-actions">
                <button class="btn-small" onclick="markRecommendationDone(${index})">
                    Mark Done
                </button>
            </div>
        </div>
    `).join('');

    return `
        <section class="recommendations-section">
            <h2 class="section-title">
                <span class="section-icon">💡</span>
                Recommendations
            </h2>
            
            <div class="recommendations-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="high">High Priority</button>
                <button class="filter-btn" data-filter="medium">Medium Priority</button>
                <button class="filter-btn" data-filter="low">Low Priority</button>
            </div>
            
            <div class="recommendations-list">
                ${recommendationItems}
            </div>
        </section>
    `;
  }

  /**
   * Generate footer section
   */
  private generateFooter(report: ComprehensiveAuditReport): string {
    return `
        <footer class="dashboard-footer">
            <div class="footer-content">
                <div class="footer-left">
                    <p>Generated by LibertyX Audit System v1.0.0</p>
                    <p>Report ID: ${report.timestamp.getTime()}</p>
                </div>
                <div class="footer-right">
                    <button class="btn-secondary" onclick="exportReport()">
                        Export Report
                    </button>
                    <button class="btn-secondary" onclick="shareReport()">
                        Share Report
                    </button>
                    <button class="btn-primary" onclick="runNewAudit()">
                        Run New Audit
                    </button>
                </div>
            </div>
        </footer>
        
        <!-- Modals -->
        <div id="phaseDetailsModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Phase Details</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>
        
        <div id="errorDetailsModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Error Details</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="errorList">
                        ${report.errors.map(error => `
                            <div class="error-item">
                                <h4>${error.phase}</h4>
                                <p>${error.message}</p>
                                ${error.stack ? `<pre class="error-stack">${error.stack}</pre>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
  }

  /**
   * Copy static assets for dashboard
   */
  private async copyStaticAssets(): Promise<void> {
    const assetsDir = path.join(this.options.outputPath, 'assets');
    await fs.mkdir(assetsDir, { recursive: true });

    // Generate CSS
    const css = this.generateDashboardCSS();
    await fs.writeFile(path.join(assetsDir, 'dashboard.css'), css, 'utf-8');

    // Generate JavaScript
    const js = this.generateDashboardJS();
    await fs.writeFile(path.join(assetsDir, 'dashboard.js'), js, 'utf-8');

    // Generate favicon
    const favicon = this.generateFaviconSVG();
    await fs.writeFile(path.join(assetsDir, 'favicon.svg'), favicon, 'utf-8');
  }

  /**
   * Generate dashboard CSS
   */
  private generateDashboardCSS(): string {
    const theme = this.options.theme;
    const colors = theme === 'dark' ? {
      bg: '#0f172a',
      cardBg: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      accent: '#8b5cf6'
    } : {
      bg: '#f8fafc',
      cardBg: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      primary: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      accent: '#8b5cf6'
    };

    return `
/* Dashboard Styles */
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

.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

/* Header */
.dashboard-header {
    background: ${colors.cardBg};
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 30px;
    border: 1px solid ${colors.border};
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dashboard-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.title-icon {
    margin-right: 12px;
}

.dashboard-subtitle {
    color: ${colors.textSecondary};
    font-size: 1.1rem;
}

.status-badge, .readiness-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.9rem;
    margin-left: 12px;
}

.status-passed { background: ${colors.success}20; color: ${colors.success}; }
.status-warning { background: ${colors.warning}20; color: ${colors.warning}; }
.status-failed { background: ${colors.error}20; color: ${colors.error}; }

/* Overview Section */
.overview-section {
    margin-bottom: 40px;
}

.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
}

.metric-card {
    background: ${colors.cardBg};
    border: 1px solid ${colors.border};
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.metric-value {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.metric-label {
    color: ${colors.textSecondary};
    font-size: 1rem;
    margin-bottom: 16px;
}

.score-excellent { color: ${colors.success}; }
.score-good { color: ${colors.primary}; }
.score-warning { color: ${colors.warning}; }
.score-poor { color: ${colors.error}; }

/* Phase Cards */
.phases-section {
    margin-bottom: 40px;
}

.section-title {
    font-size: 1.8rem;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
}

.section-icon {
    margin-right: 12px;
}

.phases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
}

.phase-card {
    background: ${colors.cardBg};
    border: 1px solid ${colors.border};
    border-radius: 12px;
    padding: 24px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.phase-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.phase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.phase-title {
    display: flex;
    align-items: center;
}

.phase-icon {
    margin-right: 8px;
    font-size: 1.2rem;
}

.phase-score {
    font-size: 1.5rem;
    font-weight: 700;
}

/* Buttons */
.btn-primary, .btn-secondary, .btn-small {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: ${colors.primary};
    color: white;
}

.btn-secondary {
    background: ${colors.border};
    color: ${colors.text};
}

.btn-small {
    padding: 4px 8px;
    font-size: 0.8rem;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: ${colors.cardBg};
    margin: 5% auto;
    padding: 0;
    border-radius: 12px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid ${colors.border};
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: ${colors.textSecondary};
}

.modal-body {
    padding: 20px;
}

/* Responsive */
@media (max-width: 768px) {
    .dashboard-container {
        padding: 10px;
    }
    
    .header-content {
        flex-direction: column;
        text-align: center;
    }
    
    .overview-grid {
        grid-template-columns: 1fr;
    }
    
    .phases-grid {
        grid-template-columns: 1fr;
    }
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.metric-card, .phase-card {
    animation: fadeIn 0.5s ease-out;
}
    `;
  }

  /**
   * Generate dashboard JavaScript
   */
  private generateDashboardJS(): string {
    return `
// Dashboard JavaScript
let currentModal = null;

function initializeDashboard() {
    initializeCharts();
    setupEventListeners();
    loadUserPreferences();
}

function initializeCharts() {
    // Score gauge chart
    const scoreCtx = document.getElementById('scoreGauge');
    if (scoreCtx && window.auditData) {
        createScoreGauge(scoreCtx, window.auditData.overallScore);
    }
    
    // Phase charts
    if (window.auditData && window.auditData.phasesExecuted) {
        window.auditData.phasesExecuted.forEach(phase => {
            const ctx = document.getElementById(\`phase-\${phase}-chart\`);
            if (ctx && window.auditData.reports[phase]) {
                createPhaseChart(ctx, window.auditData.reports[phase]);
            }
        });
    }
    
    // Trend charts
    if (window.historicalData && window.historicalData.length > 1) {
        initializeTrendCharts();
    }
}

function createScoreGauge(ctx, score) {
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                    getScoreColor(score),
                    'rgba(200, 200, 200, 0.2)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

function createPhaseChart(ctx, phaseReport) {
    // Simple bar chart showing phase score
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Score'],
            datasets: [{
                data: [phaseReport.score],
                backgroundColor: getScoreColor(phaseReport.score),
                borderRadius: 4
            }]
        },
        options: {
            responsive: false,
            scales: {
                y: { beginAtZero: true, max: 100, display: false },
                x: { display: false }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

function initializeTrendCharts() {
    // Score trend chart
    const scoreTrendCtx = document.getElementById('scoreTrendChart');
    if (scoreTrendCtx) {
        const labels = window.historicalData.map(d => new Date(d.timestamp).toLocaleDateString());
        const scores = window.historicalData.map(d => d.overallScore);
        
        new Chart(scoreTrendCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Overall Score',
                    data: scores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    }
}

function setupEventListeners() {
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Recommendation filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterRecommendations(this.dataset.filter);
        });
    });
}

function showPhaseDetails(phase) {
    const phaseReport = window.auditData.reports[phase];
    if (!phaseReport) return;
    
    const modal = document.getElementById('phaseDetailsModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = \`\${phase.replace('_', ' ')} Details\`;
    body.innerHTML = \`
        <div class="phase-detail-content">
            <h4>Summary</h4>
            <p>\${phaseReport.summary}</p>
            
            <h4>Score</h4>
            <p>\${phaseReport.score}/100</p>
            
            <h4>Status</h4>
            <p>\${phaseReport.status}</p>
            
            <h4>Details</h4>
            <pre>\${JSON.stringify(phaseReport.details, null, 2)}</pre>
        </div>
    \`;
    
    modal.style.display = 'block';
    currentModal = modal;
}

function showPhaseRecommendations(phase) {
    const phaseReport = window.auditData.reports[phase];
    if (!phaseReport || !phaseReport.recommendations) return;
    
    const modal = document.getElementById('phaseDetailsModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = \`\${phase.replace('_', ' ')} Recommendations\`;
    body.innerHTML = \`
        <div class="recommendations-content">
            <ul>
                \${phaseReport.recommendations.map(rec => \`<li>\${rec}</li>\`).join('')}
            </ul>
        </div>
    \`;
    
    modal.style.display = 'block';
    currentModal = modal;
}

function toggleErrorDetails() {
    const modal = document.getElementById('errorDetailsModal');
    modal.style.display = 'block';
    currentModal = modal;
}

function closeModal() {
    if (currentModal) {
        currentModal.style.display = 'none';
        currentModal = null;
    }
}

function filterRecommendations(filter) {
    const items = document.querySelectorAll('.recommendation-item');
    items.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'flex';
        } else {
            const priority = item.dataset.priority;
            item.style.display = priority === filter ? 'flex' : 'none';
        }
    });
}

function markRecommendationDone(index) {
    const item = document.querySelector(\`.recommendation-item:nth-child(\${index + 1})\`);
    if (item) {
        item.classList.add('completed');
        item.style.opacity = '0.5';
    }
}

function exportReport() {
    // Create downloadable JSON report
    const dataStr = JSON.stringify(window.auditData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`audit-report-\${new Date().toISOString().slice(0,10)}.json\`;
    link.click();
    URL.revokeObjectURL(url);
}

function shareReport() {
    if (navigator.share) {
        navigator.share({
            title: 'LibertyX Audit Report',
            text: \`Audit Score: \${window.auditData.overallScore}/100\`,
            url: window.location.href
        });
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Report URL copied to clipboard!');
        });
    }
}

function runNewAudit() {
    // This would typically trigger a new audit run
    alert('New audit functionality would be implemented here');
}

function getScoreColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
}

function loadUserPreferences() {
    // Load user preferences from localStorage
    const theme = localStorage.getItem('dashboard-theme');
    if (theme) {
        document.body.className = \`theme-\${theme}\`;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentModal) {
        closeModal();
    }
});
    `;
  }

  /**
   * Generate favicon SVG
   */
  private generateFaviconSVG(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#3b82f6" rx="6"/>
  <path d="M8 12h16v2H8zm0 4h16v2H8zm0 4h12v2H8z" fill="white"/>
  <circle cx="22" cy="20" r="3" fill="#10b981"/>
</svg>`;
  }

  /**
   * Load historical audit data
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const historyPath = path.join(this.options.outputPath, 'history.json');
      const historyContent = await fs.readFile(historyPath, 'utf-8');
      this.historicalData = JSON.parse(historyContent);
    } catch (error) {
      // No historical data exists yet
      this.historicalData = [];
    }
  }

  /**
   * Add current report to historical data
   */
  private async addToHistoricalData(report: ComprehensiveAuditReport): Promise<void> {
    const historyEntry: HistoricalData = {
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      phaseScores: {},
      productionReadiness: report.productionReadiness
    };

    // Extract phase scores
    for (const phase of report.phasesExecuted) {
      const phaseReport = report.reports[phase];
      if (phaseReport) {
        historyEntry.phaseScores[phase] = phaseReport.score;
      }
    }

    this.historicalData.push(historyEntry);

    // Keep only last 50 entries
    if (this.historicalData.length > 50) {
      this.historicalData = this.historicalData.slice(-50);
    }

    // Save updated history
    const historyPath = path.join(this.options.outputPath, 'history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.historicalData, null, 2), 'utf-8');
  }

  /**
   * Helper methods
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  private getReadinessColor(readiness: string): string {
    switch (readiness) {
      case 'EXCELLENT': return 'success';
      case 'READY': return 'primary';
      case 'NEEDS_WORK': return 'warning';
      case 'NOT_READY': return 'error';
      default: return 'secondary';
    }
  }

  private getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'warning';
    return 'poor';
  }

  private getPhaseIcon(phase: AuditPhase): string {
    switch (phase) {
      case 'CODE_QUALITY': return '🔧';
      case 'SECURITY': return '🔒';
      case 'TESTING': return '🧪';
      case 'PERFORMANCE': return '⚡';
      case 'ACCESSIBILITY': return '♿';
      case 'DOCUMENTATION': return '📚';
      default: return '📋';
    }
  }

  private getRecommendationPriority(recommendation: string): string {
    const highPriorityKeywords = ['critical', 'security', 'vulnerability', 'fix', 'urgent'];
    const mediumPriorityKeywords = ['improve', 'optimize', 'enhance', 'update'];
    
    const lowerRec = recommendation.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => lowerRec.includes(keyword))) {
      return 'high';
    } else if (mediumPriorityKeywords.some(keyword => lowerRec.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }
}