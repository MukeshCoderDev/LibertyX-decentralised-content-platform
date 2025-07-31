// Audit Error Handling System

export class AuditError extends Error {
  constructor(
    message: string,
    public category: 'CODE_QUALITY' | 'SECURITY' | 'TESTING' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'DOCUMENTATION',
    public severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    public remediation?: string,
    public file?: string,
    public line?: number
  ) {
    super(message);
    this.name = 'AuditError';
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuditError);
    }
  }

  /**
   * Convert error to a structured format for reporting
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      remediation: this.remediation,
      file: this.file,
      line: this.line,
      stack: this.stack
    };
  }

  /**
   * Create a user-friendly error message
   */
  getUserMessage(): string {
    let message = `[${this.category}] ${this.message}`;
    
    if (this.file) {
      message += ` (${this.file}`;
      if (this.line) {
        message += `:${this.line}`;
      }
      message += ')';
    }
    
    if (this.remediation) {
      message += `\nRemediation: ${this.remediation}`;
    }
    
    return message;
  }

  /**
   * Check if this is a critical error that should fail the audit
   */
  isCritical(): boolean {
    return this.severity === 'CRITICAL';
  }

  /**
   * Check if this is a high severity error
   */
  isHigh(): boolean {
    return this.severity === 'HIGH';
  }
}

export interface ErrorReport {
  totalErrors: number;
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  errorsByCategory: Record<string, number>;
  errors: AuditError[];
}

export interface ErrorHandler {
  handleAuditError(error: AuditError): Promise<void>;
  logAuditFailure(category: string, details: any): Promise<void>;
  generateErrorReport(): Promise<ErrorReport>;
}

export class DefaultErrorHandler implements ErrorHandler {
  private errors: AuditError[] = [];

  async handleAuditError(error: AuditError): Promise<void> {
    this.errors.push(error);
    
    // Log critical errors immediately
    if (error.isCritical()) {
      console.error('CRITICAL AUDIT ERROR:', error.getUserMessage());
    } else if (error.isHigh()) {
      console.warn('HIGH SEVERITY AUDIT ERROR:', error.getUserMessage());
    }
  }

  async logAuditFailure(category: string, details: any): Promise<void> {
    const error = new AuditError(
      `Audit failure in ${category}`,
      category as any,
      'HIGH',
      'Review audit configuration and dependencies'
    );
    
    console.error('Audit Failure:', {
      category,
      details,
      error: error.toJSON()
    });
    
    await this.handleAuditError(error);
  }

  async generateErrorReport(): Promise<ErrorReport> {
    const errorsByCategory: Record<string, number> = {};
    let criticalErrors = 0;
    let highSeverityErrors = 0;
    let mediumSeverityErrors = 0;
    let lowSeverityErrors = 0;

    for (const error of this.errors) {
      // Count by category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      
      // Count by severity
      switch (error.severity) {
        case 'CRITICAL':
          criticalErrors++;
          break;
        case 'HIGH':
          highSeverityErrors++;
          break;
        case 'MEDIUM':
          mediumSeverityErrors++;
          break;
        case 'LOW':
          lowSeverityErrors++;
          break;
      }
    }

    return {
      totalErrors: this.errors.length,
      criticalErrors,
      highSeverityErrors,
      mediumSeverityErrors,
      lowSeverityErrors,
      errorsByCategory,
      errors: [...this.errors]
    };
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get all errors of a specific severity
   */
  getErrorsBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): AuditError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get all errors of a specific category
   */
  getErrorsByCategory(category: 'CODE_QUALITY' | 'SECURITY' | 'TESTING' | 'PERFORMANCE' | 'ACCESSIBILITY' | 'DOCUMENTATION'): AuditError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Check if there are any critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(error => error.isCritical());
  }

  /**
   * Check if audit should fail based on error severity
   */
  shouldFailAudit(): boolean {
    return this.hasCriticalErrors();
  }
}