// Core Audit Types and Interfaces

export interface AuditConfiguration {
  codeQuality: {
    enableTypeScriptCheck: boolean;
    enableESLint: boolean;
    maxComplexity: number;
    maxFunctionLength: number;
  };
  security: {
    enableContractAudit: boolean;
    enableDependencyScan: boolean;
    enableInputValidation: boolean;
    riskThreshold: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  testing: {
    minCoverageThreshold: number;
    enableUnitTests: boolean;
    enableIntegrationTests: boolean;
    enableE2ETests: boolean;
  };
  performance: {
    maxBundleSize: number;
    maxLoadTime: number;
    enableGasOptimization: boolean;
  };
  accessibility: {
    wcagLevel: 'A' | 'AA' | 'AAA';
    enableKeyboardTesting: boolean;
    enableScreenReaderTesting: boolean;
  };
  documentation: {
    minAPIDocCoverage: number;
    requireArchitectureDocs: boolean;
    requireDeploymentDocs: boolean;
  };
}

// Code Quality Types
export interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface LintingIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ComplexityViolation {
  file: string;
  function: string;
  line: number;
  complexity: number;
  threshold: number;
  type: 'cyclomatic' | 'cognitive' | 'length';
}

export interface UnusedImport {
  file: string;
  line: number;
  import: string;
  module: string;
}

export interface QualityReport {
  typeScriptErrors: TypeScriptError[];
  lintingIssues: LintingIssue[];
  complexityViolations: ComplexityViolation[];
  unusedImports: UnusedImport[];
  overallScore: number;
  recommendations: string[];
}

// Security Types
export interface ContractVulnerability {
  contract: string;
  function: string;
  vulnerability: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  mitigation: string;
}

export interface ValidationIssue {
  file: string;
  line: number;
  input: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerability: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  patchAvailable: boolean;
}

export interface PrivateKeyExposure {
  file: string;
  line: number;
  type: 'hardcoded' | 'logged' | 'exposed';
  severity: 'HIGH' | 'CRITICAL';
}

export interface SecurityReport {
  contractVulnerabilities: ContractVulnerability[];
  inputValidationIssues: ValidationIssue[];
  dependencyVulnerabilities: DependencyVulnerability[];
  privateKeyExposures: PrivateKeyExposure[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mitigationSteps: string[];
}

// Testing Types
export interface UnitTestResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  duration: number;
}

export interface IntegrationTestResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  duration: number;
}

export interface ComponentTestResult {
  totalComponents: number;
  testedComponents: number;
  coverage: number;
  renderingIssues: string[];
}

export interface E2ETestResult {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  duration: number;
}

export interface CoverageReport {
  unitTestCoverage: number;
  integrationTestCoverage: number;
  componentTestCoverage: number;
  e2eTestCoverage: number;
  overallCoverage: number;
  uncoveredFiles: string[];
  criticalPathsCovered: boolean;
}

// Performance Types
export interface BundleSizeMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
}

export interface LoadTimeMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export interface GasUsageMetrics {
  averageGasUsed: number;
  maxGasUsed: number;
  optimizationPotential: number;
  costInEth: number;
}

export interface MemoryUsageMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  leaksDetected: boolean;
}

export interface PerformanceReport {
  bundleSize: BundleSizeMetrics;
  loadTimes: LoadTimeMetrics;
  gasUsage: GasUsageMetrics;
  memoryUsage: MemoryUsageMetrics;
  optimizationRecommendations: string[];
}

// Accessibility Types
export interface WCAGViolation {
  element: string;
  rule: string;
  level: 'A' | 'AA' | 'AAA';
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  fix: string;
}

export interface KeyboardIssue {
  element: string;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScreenReaderIssue {
  element: string;
  issue: string;
  ariaLabel: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ColorContrastFailure {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  requiredRatio: number;
}

export interface AccessibilityReport {
  wcagViolations: WCAGViolation[];
  keyboardNavigationIssues: KeyboardIssue[];
  screenReaderIssues: ScreenReaderIssue[];
  colorContrastFailures: ColorContrastFailure[];
  complianceLevel: 'A' | 'AA' | 'AAA' | 'NON_COMPLIANT';
  remediationSteps: string[];
}

// Documentation Types
export interface DocumentationReport {
  apiDocumentationCoverage: number;
  architectureDocumentationComplete: boolean;
  deploymentInstructionsValid: boolean;
  codeCommentCoverage: number;
  missingDocumentation: string[];
  documentationQualityScore: number;
}

// Critical Issues and Recommendations
export interface CriticalIssue {
  category: 'CODE_QUALITY' | 'SECURITY' | 'TESTING' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'DOCUMENTATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  file?: string;
  line?: number;
  remediation: string;
  impact: string;
}

export interface Recommendation {
  category: 'CODE_QUALITY' | 'SECURITY' | 'TESTING' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'DOCUMENTATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Comprehensive Audit Report
export interface ComprehensiveAuditReport {
  timestamp: Date;
  projectVersion: string;
  auditConfiguration: AuditConfiguration;
  
  codeQualityReport: QualityReport;
  securityReport: SecurityReport;
  coverageReport: CoverageReport;
  performanceReport: PerformanceReport;
  accessibilityReport: AccessibilityReport;
  documentationReport: DocumentationReport;
  
  overallScore: number;
  readinessLevel: 'NOT_READY' | 'NEEDS_WORK' | 'READY' | 'PRODUCTION_READY';
  criticalIssues: CriticalIssue[];
  recommendations: Recommendation[];
  nextSteps: string[];
}

// Analyzer Interfaces
export interface CodeQualityAnalyzer {
  analyzeTypeScript(): Promise<TypeScriptError[]>;
  runESLint(): Promise<LintingIssue[]>;
  checkComplexity(): Promise<ComplexityViolation[]>;
  validateImports(): Promise<UnusedImport[]>;
  generateQualityReport(): Promise<QualityReport>;
}

export interface SecurityAuditor {
  scanSmartContracts(): Promise<ContractVulnerability[]>;
  validateInputSanitization(): Promise<ValidationIssue[]>;
  checkDependencyVulnerabilities(): Promise<DependencyVulnerability[]>;
  auditPrivateKeyHandling(): Promise<PrivateKeyExposure[]>;
  generateSecurityReport(): Promise<SecurityReport>;
}

export interface TestCoverageAnalyzer {
  runUnitTests(): Promise<UnitTestResult>;
  executeIntegrationTests(): Promise<IntegrationTestResult>;
  performComponentTests(): Promise<ComponentTestResult>;
  runE2ETests(): Promise<E2ETestResult>;
  generateCoverageReport(): Promise<CoverageReport>;
}

export interface PerformanceProfiler {
  analyzeBundleSize(): Promise<BundleSizeMetrics>;
  profilePageLoadTimes(): Promise<LoadTimeMetrics>;
  optimizeGasUsage(): Promise<GasUsageMetrics>;
  detectMemoryLeaks(): Promise<MemoryUsageMetrics>;
  generatePerformanceReport(): Promise<PerformanceReport>;
}

export interface AccessibilityValidator {
  validateWCAGCompliance(): Promise<WCAGViolation[]>;
  testKeyboardNavigation(): Promise<KeyboardIssue[]>;
  auditScreenReaderCompatibility(): Promise<ScreenReaderIssue[]>;
  checkColorContrast(): Promise<ColorContrastFailure[]>;
  generateAccessibilityReport(): Promise<AccessibilityReport>;
}

export interface DocumentationAuditor {
  validateAPIDocumentation(): Promise<number>;
  checkArchitectureDocumentation(): Promise<boolean>;
  auditDeploymentInstructions(): Promise<boolean>;
  validateCodeComments(): Promise<number>;
  generateDocumentationReport(): Promise<DocumentationReport>;
}