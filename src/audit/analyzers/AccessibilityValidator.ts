// Accessibility Validation Module

import { AccessibilityReport, WCAGViolation } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';

export interface AccessibilityRule {
  id: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  description: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
}

export class AccessibilityValidator {
  private wcagLevel: 'A' | 'AA' | 'AAA';
  private accessibilityRules: AccessibilityRule[] = [];

  constructor(wcagLevel: 'A' | 'AA' | 'AAA' = 'AA') {
    this.wcagLevel = wcagLevel;
    this.initializeAccessibilityRules();
  }

  /**
   * Initialize WCAG accessibility rules
   */
  private initializeAccessibilityRules(): void {
    this.accessibilityRules = [
      // Images and Media
      {
        id: 'img-alt',
        wcagLevel: 'A',
        wcagCriterion: '1.1.1',
        description: 'Images must have alternative text',
        pattern: /<img(?![^>]*alt\s*=)/gi,
        severity: 'HIGH',
        recommendation: 'Add alt attribute to all images'
      },
      {
        id: 'decorative-img',
        wcagLevel: 'A',
        wcagCriterion: '1.1.1',
        description: 'Decorative images should have empty alt text',
        pattern: /<img[^>]*alt\s*=\s*["'][^"']+["'][^>]*>/gi,
        severity: 'MEDIUM',
        recommendation: 'Use alt="" for decorative images'
      },

      // Form Controls
      {
        id: 'form-label',
        wcagLevel: 'A',
        wcagCriterion: '1.3.1',
        description: 'Form inputs must have associated labels',
        pattern: /<input(?![^>]*(?:aria-label|aria-labelledby))(?![^>]*id\s*=\s*["'][^"']*["'][^>]*<label[^>]*for\s*=\s*["'][^"']*["'])/gi,
        severity: 'HIGH',
        recommendation: 'Associate labels with form controls using for/id or aria-label'
      },
      {
        id: 'button-text',
        wcagLevel: 'A',
        wcagCriterion: '2.4.4',
        description: 'Buttons must have accessible text',
        pattern: /<button(?![^>]*aria-label)(?![^>]*title)[^>]*>\s*<\/button>/gi,
        severity: 'HIGH',
        recommendation: 'Provide text content or aria-label for buttons'
      },

      // Headings and Structure
      {
        id: 'heading-order',
        wcagLevel: 'A',
        wcagCriterion: '1.3.1',
        description: 'Headings should follow logical order',
        pattern: /<h[1-6][^>]*>/gi,
        severity: 'MEDIUM',
        recommendation: 'Use headings in logical order (h1, h2, h3, etc.)'
      },
      {
        id: 'page-title',
        wcagLevel: 'A',
        wcagCriterion: '2.4.2',
        description: 'Pages must have descriptive titles',
        pattern: /<title>\s*<\/title>|<title>[^<]{1,10}<\/title>/gi,
        severity: 'HIGH',
        recommendation: 'Provide descriptive page titles'
      },

      // Color and Contrast
      {
        id: 'color-only',
        wcagLevel: 'A',
        wcagCriterion: '1.4.1',
        description: 'Information should not be conveyed by color alone',
        pattern: /style\s*=\s*["'][^"']*color\s*:\s*red[^"']*["']/gi,
        severity: 'MEDIUM',
        recommendation: 'Use additional visual indicators beyond color'
      },

      // Keyboard Navigation
      {
        id: 'tabindex-positive',
        wcagLevel: 'A',
        wcagCriterion: '2.4.3',
        description: 'Avoid positive tabindex values',
        pattern: /tabindex\s*=\s*["'][1-9]\d*["']/gi,
        severity: 'MEDIUM',
        recommendation: 'Use tabindex="0" or rely on natural tab order'
      },
      {
        id: 'focus-visible',
        wcagLevel: 'AA',
        wcagCriterion: '2.4.7',
        description: 'Interactive elements must have visible focus indicators',
        pattern: /outline\s*:\s*none|outline\s*:\s*0/gi,
        severity: 'HIGH',
        recommendation: 'Ensure focus indicators are visible for keyboard users'
      },

      // ARIA
      {
        id: 'aria-hidden-focusable',
        wcagLevel: 'A',
        wcagCriterion: '4.1.2',
        description: 'Elements with aria-hidden should not be focusable',
        pattern: /aria-hidden\s*=\s*["']true["'][^>]*(?:tabindex\s*=\s*["']0["']|href)/gi,
        severity: 'HIGH',
        recommendation: 'Remove tabindex or href from aria-hidden elements'
      },
      {
        id: 'aria-label-empty',
        wcagLevel: 'A',
        wcagCriterion: '4.1.2',
        description: 'aria-label should not be empty',
        pattern: /aria-label\s*=\s*["']\s*["']/gi,
        severity: 'MEDIUM',
        recommendation: 'Provide meaningful aria-label text'
      },

      // Interactive Elements
      {
        id: 'click-events-keyboard',
        wcagLevel: 'A',
        wcagCriterion: '2.1.1',
        description: 'Click events should have keyboard equivalents',
        pattern: /onClick(?![^}]*onKeyDown|[^}]*onKeyPress)/gi,
        severity: 'HIGH',
        recommendation: 'Add keyboard event handlers for click events'
      },

      // Media
      {
        id: 'video-captions',
        wcagLevel: 'A',
        wcagCriterion: '1.2.2',
        description: 'Videos should have captions',
        pattern: /<video(?![^>]*<track[^>]*kind\s*=\s*["']captions["'])/gi,
        severity: 'HIGH',
        recommendation: 'Provide captions for video content'
      },

      // Language
      {
        id: 'html-lang',
        wcagLevel: 'A',
        wcagCriterion: '3.1.1',
        description: 'HTML elements should have lang attribute',
        pattern: /<html(?![^>]*lang\s*=)/gi,
        severity: 'HIGH',
        recommendation: 'Add lang attribute to html element'
      }
    ];
  }

  /**
   * Validate WCAG compliance
   */
  async validateWCAGCompliance(filePaths?: string[]): Promise<{
    violations: WCAGViolation[];
    complianceLevel: 'A' | 'AA' | 'AAA' | 'NON_COMPLIANT';
    score: number;
  }> {
    try {
      const files = filePaths || await this.findHTMLFiles();
      const violations: WCAGViolation[] = [];

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const fileViolations = await this.scanFileForViolations(file, content);
        violations.push(...fileViolations);
      }

      // Filter violations by WCAG level
      const relevantViolations = violations.filter(v => 
        this.isRelevantForLevel(v.wcagLevel, this.wcagLevel)
      );

      // Calculate compliance level
      const complianceLevel = this.calculateComplianceLevel(relevantViolations);
      
      // Calculate score
      const score = this.calculateAccessibilityScore(relevantViolations);

      return {
        violations: relevantViolations,
        complianceLevel,
        score
      };

    } catch (error) {
      throw new AuditError(
        `WCAG compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ACCESSIBILITY',
        'HIGH',
        'Ensure HTML files are accessible for analysis'
      );
    }
  }

  /**
   * Scan file for accessibility violations
   */
  private async scanFileForViolations(file: string, content: string): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];
    const lines = content.split('\n');

    for (const rule of this.accessibilityRules) {
      let match;
      rule.pattern.lastIndex = 0; // Reset regex state

      while ((match = rule.pattern.exec(content)) !== null) {
        const position = this.getLineAndColumn(content, match.index);
        
        violations.push({
          ruleId: rule.id,
          wcagLevel: rule.wcagLevel,
          wcagCriterion: rule.wcagCriterion,
          severity: rule.severity,
          file,
          line: position.line,
          column: position.column,
          description: rule.description,
          element: match[0],
          recommendation: rule.recommendation
        });
      }
    }

    // Additional context-aware checks
    violations.push(...await this.performContextualChecks(file, content));

    return violations;
  }

  /**
   * Perform contextual accessibility checks
   */
  private async performContextualChecks(file: string, content: string): Promise<WCAGViolation[]> {
    const violations: WCAGViolation[] = [];

    // Check heading hierarchy
    const headingViolations = this.checkHeadingHierarchy(file, content);
    violations.push(...headingViolations);

    // Check color contrast (simplified)
    const contrastViolations = this.checkColorContrast(file, content);
    violations.push(...contrastViolations);

    // Check landmark usage
    const landmarkViolations = this.checkLandmarks(file, content);
    violations.push(...landmarkViolations);

    return violations;
  }

  /**
   * Check heading hierarchy
   */
  private checkHeadingHierarchy(file: string, content: string): WCAGViolation[] {
    const violations: WCAGViolation[] = [];
    const headingMatches = Array.from(content.matchAll(/<h([1-6])[^>]*>/gi));
    
    let previousLevel = 0;
    
    for (const match of headingMatches) {
      const level = parseInt(match[1]);
      const position = this.getLineAndColumn(content, match.index!);
      
      if (level > previousLevel + 1) {
        violations.push({
          ruleId: 'heading-hierarchy',
          wcagLevel: 'A',
          wcagCriterion: '1.3.1',
          severity: 'MEDIUM',
          file,
          line: position.line,
          column: position.column,
          description: `Heading level h${level} skips levels`,
          element: match[0],
          recommendation: 'Use headings in sequential order'
        });
      }
      
      previousLevel = level;
    }

    return violations;
  }

  /**
   * Check color contrast (simplified)
   */
  private checkColorContrast(file: string, content: string): WCAGViolation[] {
    const violations: WCAGViolation[] = [];
    
    // Look for potential low contrast combinations
    const lowContrastPatterns = [
      /color\s*:\s*#[a-f0-9]{6}.*background-color\s*:\s*#[a-f0-9]{6}/gi,
      /background\s*:\s*white.*color\s*:\s*#[cdef][a-f0-9]{5}/gi
    ];

    for (const pattern of lowContrastPatterns) {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        const position = this.getLineAndColumn(content, match.index);
        
        violations.push({
          ruleId: 'color-contrast',
          wcagLevel: 'AA',
          wcagCriterion: '1.4.3',
          severity: 'MEDIUM',
          file,
          line: position.line,
          column: position.column,
          description: 'Potential low color contrast',
          element: match[0],
          recommendation: 'Ensure color contrast ratio meets WCAG AA standards (4.5:1 for normal text)'
        });
      }
    }

    return violations;
  }

  /**
   * Check landmark usage
   */
  private checkLandmarks(file: string, content: string): WCAGViolation[] {
    const violations: WCAGViolation[] = [];
    
    // Check for missing main landmark
    if (!content.includes('<main') && !content.includes('role="main"')) {
      violations.push({
        ruleId: 'landmark-main',
        wcagLevel: 'A',
        wcagCriterion: '1.3.1',
        severity: 'MEDIUM',
        file,
        line: 1,
        column: 1,
        description: 'Page should have a main landmark',
        element: '<html>',
        recommendation: 'Add <main> element or role="main" to identify main content'
      });
    }

    return violations;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<{
    focusableElements: number;
    keyboardAccessible: number;
    tabOrder: Array<{ element: string; tabIndex: number }>;
    violations: Array<{ element: string; issue: string; recommendation: string }>;
  }> {
    try {
      const files = await this.findHTMLFiles();
      let focusableElements = 0;
      let keyboardAccessible = 0;
      const tabOrder: Array<{ element: string; tabIndex: number }> = [];
      const violations: Array<{ element: string; issue: string; recommendation: string }> = [];

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Find focusable elements
        const focusablePatterns = [
          /<a[^>]*href/gi,
          /<button/gi,
          /<input(?![^>]*type\s*=\s*["']hidden["'])/gi,
          /<select/gi,
          /<textarea/gi,
          /tabindex\s*=\s*["']0["']/gi
        ];

        for (const pattern of focusablePatterns) {
          const matches = Array.from(content.matchAll(pattern));
          focusableElements += matches.length;

          for (const match of matches) {
            // Check if element has keyboard event handlers
            const elementContent = this.extractElementContent(content, match.index!);
            if (elementContent.includes('onKeyDown') || elementContent.includes('onKeyPress') || 
                elementContent.includes('onKeyUp') || match[0].includes('href')) {
              keyboardAccessible++;
            } else if (match[0].includes('onClick')) {
              violations.push({
                element: match[0],
                issue: 'Click handler without keyboard equivalent',
                recommendation: 'Add onKeyDown or onKeyPress handler'
              });
            }

            // Extract tab index
            const tabIndexMatch = elementContent.match(/tabindex\s*=\s*["']([^"']*)["']/i);
            if (tabIndexMatch) {
              tabOrder.push({
                element: match[0],
                tabIndex: parseInt(tabIndexMatch[1]) || 0
              });
            }
          }
        }
      }

      return {
        focusableElements,
        keyboardAccessible,
        tabOrder: tabOrder.sort((a, b) => a.tabIndex - b.tabIndex),
        violations
      };

    } catch (error) {
      throw new AuditError(
        `Keyboard navigation testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ACCESSIBILITY',
        'HIGH',
        'Ensure HTML files are accessible for keyboard navigation analysis'
      );
    }
  }

  /**
   * Audit screen reader compatibility
   */
  async auditScreenReaderCompatibility(): Promise<{
    ariaLabels: number;
    ariaDescriptions: number;
    semanticElements: number;
    violations: Array<{ element: string; issue: string; recommendation: string }>;
  }> {
    try {
      const files = await this.findHTMLFiles();
      let ariaLabels = 0;
      let ariaDescriptions = 0;
      let semanticElements = 0;
      const violations: Array<{ element: string; issue: string; recommendation: string }> = [];

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Count ARIA labels and descriptions
        ariaLabels += (content.match(/aria-label\s*=/gi) || []).length;
        ariaDescriptions += (content.match(/aria-describedby\s*=/gi) || []).length;
        
        // Count semantic elements
        const semanticPatterns = [
          /<header/gi, /<nav/gi, /<main/gi, /<section/gi, 
          /<article/gi, /<aside/gi, /<footer/gi, /<h[1-6]/gi
        ];
        
        for (const pattern of semanticPatterns) {
          semanticElements += (content.match(pattern) || []).length;
        }

        // Check for screen reader issues
        const divClickables = content.match(/<div[^>]*onClick/gi);
        if (divClickables) {
          for (const div of divClickables) {
            if (!div.includes('role=') && !div.includes('tabindex=')) {
              violations.push({
                element: div,
                issue: 'Clickable div without proper role or tabindex',
                recommendation: 'Use button element or add role="button" and tabindex="0"'
              });
            }
          }
        }
      }

      return {
        ariaLabels,
        ariaDescriptions,
        semanticElements,
        violations
      };

    } catch (error) {
      throw new AuditError(
        `Screen reader compatibility audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ACCESSIBILITY',
        'HIGH',
        'Ensure HTML files are accessible for screen reader analysis'
      );
    }
  }

  /**
   * Check color contrast ratios
   */
  async checkColorContrast(): Promise<{
    totalElements: number;
    passedElements: number;
    failedElements: Array<{
      element: string;
      foreground: string;
      background: string;
      ratio: number;
      required: number;
    }>;
  }> {
    // Simplified color contrast checking
    // In a real implementation, this would use tools like axe-core or color contrast analyzers
    
    return {
      totalElements: 0,
      passedElements: 0,
      failedElements: []
    };
  }

  /**
   * Generate comprehensive accessibility report
   */
  async generateAccessibilityReport(): Promise<AccessibilityReport> {
    const [wcagCompliance, keyboardNav, screenReader, colorContrast] = await Promise.all([
      this.validateWCAGCompliance(),
      this.testKeyboardNavigation(),
      this.auditScreenReaderCompatibility(),
      this.checkColorContrast()
    ]);

    const totalViolations = wcagCompliance.violations.length + 
                           keyboardNav.violations.length + 
                           screenReader.violations.length;

    const remediationSteps = [
      ...wcagCompliance.violations.map(v => v.recommendation),
      ...keyboardNav.violations.map(v => v.recommendation),
      ...screenReader.violations.map(v => v.recommendation)
    ].filter((step, index, array) => array.indexOf(step) === index); // Remove duplicates

    return {
      wcagViolations: wcagCompliance.violations,
      keyboardNavigationIssues: keyboardNav.violations.map(v => ({
        element: v.element,
        issue: v.issue,
        recommendation: v.recommendation
      })),
      screenReaderIssues: screenReader.violations.map(v => ({
        element: v.element,
        issue: v.issue,
        recommendation: v.recommendation
      })),
      colorContrastFailures: colorContrast.failedElements.map(f => ({
        element: f.element,
        foreground: f.foreground,
        background: f.background,
        ratio: f.ratio,
        required: f.required
      })),
      complianceLevel: wcagCompliance.complianceLevel,
      remediationSteps,
      statistics: {
        totalViolations,
        criticalViolations: wcagCompliance.violations.filter(v => v.severity === 'CRITICAL').length,
        wcagScore: wcagCompliance.score,
        keyboardAccessibility: keyboardNav.keyboardAccessible / Math.max(keyboardNav.focusableElements, 1) * 100,
        screenReaderCompatibility: screenReader.ariaLabels + screenReader.semanticElements,
        colorContrastPassed: colorContrast.passedElements / Math.max(colorContrast.totalElements, 1) * 100
      }
    };
  }

  // Helper methods

  private async findHTMLFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.html', '.htm', '.jsx', '.tsx'];
    
    try {
      const srcFiles = await this.getFilesRecursively('src');
      const publicFiles = await this.getFilesRecursively('public').catch(() => []);
      
      const allFiles = [...srcFiles, ...publicFiles];
      
      for (const file of allFiles) {
        if (extensions.some(ext => file.endsWith(ext))) {
          files.push(file);
        }
      }
    } catch {
      // No files found
    }

    return files;
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        
        if (entry.isDirectory()) {
          files.push(...await this.getFilesRecursively(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return files;
  }

  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const lines = content.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private extractElementContent(content: string, startIndex: number): string {
    const tagEnd = content.indexOf('>', startIndex);
    return content.substring(startIndex, tagEnd + 1);
  }

  private isRelevantForLevel(ruleLevel: 'A' | 'AA' | 'AAA', targetLevel: 'A' | 'AA' | 'AAA'): boolean {
    const levels = { 'A': 1, 'AA': 2, 'AAA': 3 };
    return levels[ruleLevel] <= levels[targetLevel];
  }

  private calculateComplianceLevel(violations: WCAGViolation[]): 'A' | 'AA' | 'AAA' | 'NON_COMPLIANT' {
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH');
    
    if (criticalViolations.length > 0) {
      return 'NON_COMPLIANT';
    }
    
    const aaViolations = violations.filter(v => v.wcagLevel === 'AA');
    if (aaViolations.length === 0) {
      return 'AA';
    }
    
    const aViolations = violations.filter(v => v.wcagLevel === 'A');
    if (aViolations.length === 0) {
      return 'A';
    }
    
    return 'NON_COMPLIANT';
  }

  private calculateAccessibilityScore(violations: WCAGViolation[]): number {
    let score = 100;
    
    for (const violation of violations) {
      switch (violation.severity) {
        case 'CRITICAL': score -= 15; break;
        case 'HIGH': score -= 10; break;
        case 'MEDIUM': score -= 5; break;
        case 'LOW': score -= 2; break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
}