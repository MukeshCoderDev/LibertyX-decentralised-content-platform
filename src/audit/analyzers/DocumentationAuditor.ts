// Documentation Auditing Module

import { DocumentationReport } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DocumentationFile {
  path: string;
  type: 'README' | 'API' | 'ARCHITECTURE' | 'DEPLOYMENT' | 'CHANGELOG' | 'CONTRIBUTING' | 'OTHER';
  exists: boolean;
  wordCount: number;
  lastModified: Date;
  quality: number;
  issues: string[];
}

export interface APIDocumentation {
  functions: Array<{
    name: string;
    file: string;
    line: number;
    hasJSDoc: boolean;
    hasExamples: boolean;
    hasParameters: boolean;
    hasReturnType: boolean;
  }>;
  coverage: number;
  missingDocs: string[];
}

export class DocumentationAuditor {
  private minDocCoverage: number;
  private requiredFiles: string[];

  constructor(
    minDocCoverage: number = 80,
    requiredFiles: string[] = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md']
  ) {
    this.minDocCoverage = minDocCoverage;
    this.requiredFiles = requiredFiles;
  }

  /**
   * Validate API documentation coverage
   */
  async validateAPIDocumentation(): Promise<{
    coverage: number;
    totalFunctions: number;
    documentedFunctions: number;
    missingDocs: Array<{
      function: string;
      file: string;
      line: number;
      issues: string[];
    }>;
    recommendations: string[];
  }> {
    try {
      const sourceFiles = await this.findSourceFiles();
      const functions: APIDocumentation['functions'] = [];

      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const fileFunctions = await this.extractFunctions(file, content);
        functions.push(...fileFunctions);
      }

      const documentedFunctions = functions.filter(f => f.hasJSDoc).length;
      const coverage = functions.length > 0 ? (documentedFunctions / functions.length) * 100 : 100;

      const missingDocs = functions
        .filter(f => !f.hasJSDoc)
        .map(f => ({
          function: f.name,
          file: f.file,
          line: f.line,
          issues: this.identifyDocumentationIssues(f)
        }));

      const recommendations: string[] = [];
      
      if (coverage < this.minDocCoverage) {
        recommendations.push(`API documentation coverage ${coverage.toFixed(1)}% is below ${this.minDocCoverage}% threshold`);
        recommendations.push('Add JSDoc comments to all public functions');
      }

      if (missingDocs.length > 0) {
        recommendations.push(`Document ${missingDocs.length} functions missing JSDoc comments`);
        recommendations.push('Include parameter descriptions and return types');
        recommendations.push('Add usage examples for complex functions');
      }

      return {
        coverage: Math.round(coverage * 100) / 100,
        totalFunctions: functions.length,
        documentedFunctions,
        missingDocs,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `API documentation validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION',
        'MEDIUM',
        'Ensure source files are accessible for documentation analysis'
      );
    }
  }

  /**
   * Extract functions from source code
   */
  private async extractFunctions(file: string, content: string): Promise<APIDocumentation['functions']> {
    const functions: APIDocumentation['functions'] = [];
    const lines = content.split('\n');

    // Function patterns for different languages
    const functionPatterns = [
      // TypeScript/JavaScript functions
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      /(?:export\s+)?(\w+)\s*:\s*\([^)]*\)\s*=>/g,
      // Class methods
      /(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      pattern.lastIndex = 0;

      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        const position = this.getLineNumber(content, match.index);
        
        // Check for JSDoc comment before function
        const hasJSDoc = this.hasJSDocComment(lines, position - 1);
        const hasExamples = hasJSDoc && this.hasExamples(lines, position - 1);
        const hasParameters = hasJSDoc && this.hasParameterDocs(lines, position - 1);
        const hasReturnType = hasJSDoc && this.hasReturnTypeDocs(lines, position - 1);

        functions.push({
          name: functionName,
          file,
          line: position,
          hasJSDoc,
          hasExamples,
          hasParameters,
          hasReturnType
        });
      }
    }

    return functions;
  }

  /**
   * Check if function has JSDoc comment
   */
  private hasJSDocComment(lines: string[], lineIndex: number): boolean {
    // Look backwards for JSDoc comment
    for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
      const line = lines[i]?.trim();
      if (line === '*/') {
        // Found end of JSDoc, look for start
        for (let j = i; j >= 0; j--) {
          if (lines[j]?.trim().startsWith('/**')) {
            return true;
          }
        }
      }
      if (line && !line.startsWith('*') && !line.startsWith('//') && line !== '') {
        break; // Found non-comment code
      }
    }
    return false;
  }

  /**
   * Check if JSDoc has examples
   */
  private hasExamples(lines: string[], lineIndex: number): boolean {
    return this.hasJSDocTag(lines, lineIndex, '@example');
  }

  /**
   * Check if JSDoc has parameter documentation
   */
  private hasParameterDocs(lines: string[], lineIndex: number): boolean {
    return this.hasJSDocTag(lines, lineIndex, '@param');
  }

  /**
   * Check if JSDoc has return type documentation
   */
  private hasReturnTypeDocs(lines: string[], lineIndex: number): boolean {
    return this.hasJSDocTag(lines, lineIndex, '@returns') || 
           this.hasJSDocTag(lines, lineIndex, '@return');
  }

  /**
   * Check if JSDoc has specific tag
   */
  private hasJSDocTag(lines: string[], lineIndex: number, tag: string): boolean {
    for (let i = lineIndex; i >= Math.max(0, lineIndex - 20); i--) {
      const line = lines[i]?.trim();
      if (line?.includes(tag)) {
        return true;
      }
      if (line?.startsWith('/**')) {
        break;
      }
    }
    return false;
  }

  /**
   * Identify documentation issues for a function
   */
  private identifyDocumentationIssues(func: APIDocumentation['functions'][0]): string[] {
    const issues: string[] = [];

    if (!func.hasJSDoc) {
      issues.push('Missing JSDoc comment');
    } else {
      if (!func.hasParameters) {
        issues.push('Missing parameter documentation');
      }
      if (!func.hasReturnType) {
        issues.push('Missing return type documentation');
      }
      if (!func.hasExamples) {
        issues.push('Missing usage examples');
      }
    }

    return issues;
  }

  /**
   * Check architecture documentation
   */
  async checkArchitectureDocumentation(): Promise<{
    exists: boolean;
    completeness: number;
    sections: Array<{
      name: string;
      exists: boolean;
      quality: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const archFiles = await this.findArchitectureFiles();
      const recommendations: string[] = [];

      if (archFiles.length === 0) {
        recommendations.push('Create architecture documentation');
        recommendations.push('Document system design and component relationships');
        return {
          exists: false,
          completeness: 0,
          sections: [],
          recommendations
        };
      }

      const sections = [
        { name: 'System Overview', keywords: ['overview', 'architecture', 'system'] },
        { name: 'Component Diagram', keywords: ['diagram', 'component', 'flow'] },
        { name: 'Data Flow', keywords: ['data', 'flow', 'process'] },
        { name: 'Technology Stack', keywords: ['technology', 'stack', 'dependencies'] },
        { name: 'Security Architecture', keywords: ['security', 'authentication', 'authorization'] },
        { name: 'Deployment Architecture', keywords: ['deployment', 'infrastructure', 'environment'] }
      ];

      const sectionResults = [];
      let totalQuality = 0;

      for (const section of sections) {
        const sectionExists = await this.checkSectionExists(archFiles, section.keywords);
        const quality = sectionExists ? await this.assessSectionQuality(archFiles, section.keywords) : 0;
        
        sectionResults.push({
          name: section.name,
          exists: sectionExists,
          quality
        });

        totalQuality += quality;
      }

      const completeness = (totalQuality / sections.length);

      if (completeness < 70) {
        recommendations.push('Improve architecture documentation completeness');
        recommendations.push('Add missing sections: ' + 
          sectionResults.filter(s => !s.exists).map(s => s.name).join(', '));
      }

      return {
        exists: true,
        completeness: Math.round(completeness),
        sections: sectionResults,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Architecture documentation check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION',
        'MEDIUM',
        'Ensure architecture documentation files are accessible'
      );
    }
  }

  /**
   * Audit deployment instructions
   */
  async auditDeploymentInstructions(): Promise<{
    exists: boolean;
    completeness: number;
    steps: Array<{
      name: string;
      exists: boolean;
      clarity: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const deploymentFiles = await this.findDeploymentFiles();
      const recommendations: string[] = [];

      if (deploymentFiles.length === 0) {
        recommendations.push('Create deployment documentation');
        recommendations.push('Document setup and deployment procedures');
        return {
          exists: false,
          completeness: 0,
          steps: [],
          recommendations
        };
      }

      const requiredSteps = [
        { name: 'Prerequisites', keywords: ['prerequisite', 'requirement', 'dependency'] },
        { name: 'Installation', keywords: ['install', 'setup', 'npm install'] },
        { name: 'Configuration', keywords: ['config', 'environment', 'env'] },
        { name: 'Build Process', keywords: ['build', 'compile', 'bundle'] },
        { name: 'Deployment Steps', keywords: ['deploy', 'production', 'server'] },
        { name: 'Verification', keywords: ['test', 'verify', 'check'] }
      ];

      const stepResults = [];
      let totalClarity = 0;

      for (const step of requiredSteps) {
        const stepExists = await this.checkSectionExists(deploymentFiles, step.keywords);
        const clarity = stepExists ? await this.assessSectionQuality(deploymentFiles, step.keywords) : 0;
        
        stepResults.push({
          name: step.name,
          exists: stepExists,
          clarity
        });

        totalClarity += clarity;
      }

      const completeness = (totalClarity / requiredSteps.length);

      if (completeness < 80) {
        recommendations.push('Improve deployment documentation completeness');
        recommendations.push('Add missing steps: ' + 
          stepResults.filter(s => !s.exists).map(s => s.name).join(', '));
      }

      return {
        exists: true,
        completeness: Math.round(completeness),
        steps: stepResults,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Deployment instructions audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION',
        'MEDIUM',
        'Ensure deployment documentation files are accessible'
      );
    }
  }

  /**
   * Validate code comment coverage
   */
  async validateCodeComments(): Promise<{
    coverage: number;
    totalComplexFunctions: number;
    commentedFunctions: number;
    recommendations: string[];
  }> {
    try {
      const sourceFiles = await this.findSourceFiles();
      let totalComplexFunctions = 0;
      let commentedFunctions = 0;

      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const complexFunctions = await this.findComplexFunctions(content);
        
        totalComplexFunctions += complexFunctions.length;
        
        for (const func of complexFunctions) {
          if (this.hasInlineComments(content, func.startLine, func.endLine)) {
            commentedFunctions++;
          }
        }
      }

      const coverage = totalComplexFunctions > 0 ? (commentedFunctions / totalComplexFunctions) * 100 : 100;

      const recommendations: string[] = [];
      
      if (coverage < 60) {
        recommendations.push(`Code comment coverage ${coverage.toFixed(1)}% is low`);
        recommendations.push('Add inline comments to explain complex logic');
        recommendations.push('Document business rules and algorithms');
      }

      return {
        coverage: Math.round(coverage * 100) / 100,
        totalComplexFunctions,
        commentedFunctions,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Code comment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DOCUMENTATION',
        'LOW',
        'Ensure source files are accessible for comment analysis'
      );
    }
  }

  /**
   * Generate comprehensive documentation report
   */
  async generateDocumentationReport(): Promise<DocumentationReport> {
    const [apiDocs, archDocs, deploymentDocs, codeComments] = await Promise.all([
      this.validateAPIDocumentation(),
      this.checkArchitectureDocumentation(),
      this.auditDeploymentInstructions(),
      this.validateCodeComments()
    ]);

    // Check for required files
    const requiredFilesStatus = await this.checkRequiredFiles();

    // Calculate overall score
    let score = 0;
    score += apiDocs.coverage * 0.3; // 30% weight
    score += archDocs.completeness * 0.25; // 25% weight
    score += deploymentDocs.completeness * 0.25; // 25% weight
    score += codeComments.coverage * 0.2; // 20% weight

    const missingDocumentation = [
      ...apiDocs.missingDocs.map(d => `API: ${d.function}`),
      ...(!archDocs.exists ? ['Architecture documentation'] : []),
      ...(!deploymentDocs.exists ? ['Deployment instructions'] : []),
      ...requiredFilesStatus.missing
    ];

    return {
      apiDocumentationCoverage: apiDocs.coverage,
      architectureDocumentationComplete: archDocs.exists && archDocs.completeness >= 70,
      deploymentInstructionsValid: deploymentDocs.exists && deploymentDocs.completeness >= 80,
      codeCommentCoverage: codeComments.coverage,
      missingDocumentation,
      documentationQualityScore: Math.round(score),
      recommendations: [
        ...apiDocs.recommendations,
        ...archDocs.recommendations,
        ...deploymentDocs.recommendations,
        ...codeComments.recommendations,
        ...requiredFilesStatus.recommendations
      ]
    };
  }

  // Helper methods

  private async findSourceFiles(): Promise<string[]> {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return this.findFilesByExtensions(['src'], extensions);
  }

  private async findArchitectureFiles(): Promise<string[]> {
    const patterns = ['ARCHITECTURE', 'DESIGN', 'docs/architecture', 'docs/design'];
    return this.findFilesByPatterns(patterns);
  }

  private async findDeploymentFiles(): Promise<string[]> {
    const patterns = ['DEPLOYMENT', 'DEPLOY', 'INSTALL', 'SETUP', 'docs/deployment'];
    return this.findFilesByPatterns(patterns);
  }

  private async findFilesByExtensions(dirs: string[], extensions: string[]): Promise<string[]> {
    const files: string[] = [];
    
    for (const dir of dirs) {
      try {
        const dirFiles = await this.getFilesRecursively(dir);
        files.push(...dirFiles.filter(f => extensions.some(ext => f.endsWith(ext))));
      } catch {
        // Directory doesn't exist
      }
    }

    return files;
  }

  private async findFilesByPatterns(patterns: string[]): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.md', '.txt', '.rst'];
    
    for (const pattern of patterns) {
      for (const ext of extensions) {
        const filePath = `${pattern}${ext}`;
        try {
          await fs.access(filePath);
          files.push(filePath);
        } catch {
          // File doesn't exist
        }
      }
    }

    return files;
  }

  private async getFilesRecursively(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
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

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private async checkSectionExists(files: string[], keywords: string[]): Promise<boolean> {
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lowerContent = content.toLowerCase();
        
        if (keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
          return true;
        }
      } catch {
        // File read error
      }
    }
    return false;
  }

  private async assessSectionQuality(files: string[], keywords: string[]): Promise<number> {
    let maxQuality = 0;
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const quality = this.calculateContentQuality(content, keywords);
        maxQuality = Math.max(maxQuality, quality);
      } catch {
        // File read error
      }
    }
    
    return maxQuality;
  }

  private calculateContentQuality(content: string, keywords: string[]): number {
    const wordCount = content.split(/\s+/).length;
    const keywordMatches = keywords.filter(k => 
      content.toLowerCase().includes(k.toLowerCase())
    ).length;
    
    let quality = 0;
    
    // Base quality from word count
    if (wordCount > 100) quality += 40;
    else if (wordCount > 50) quality += 20;
    
    // Quality from keyword coverage
    quality += (keywordMatches / keywords.length) * 40;
    
    // Quality from structure (headers, lists, etc.)
    if (content.includes('#')) quality += 10; // Has headers
    if (content.includes('-') || content.includes('*')) quality += 10; // Has lists
    
    return Math.min(100, quality);
  }

  private async findComplexFunctions(content: string): Promise<Array<{
    name: string;
    startLine: number;
    endLine: number;
  }>> {
    // Simplified complex function detection
    const functions: Array<{ name: string; startLine: number; endLine: number }> = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for functions with high complexity indicators
      if (line.includes('function') || line.includes('=>')) {
        const complexity = this.calculateLineComplexity(content, i, i + 20);
        
        if (complexity > 5) { // Arbitrary complexity threshold
          functions.push({
            name: this.extractFunctionName(line) || 'anonymous',
            startLine: i + 1,
            endLine: i + 20 // Simplified
          });
        }
      }
    }
    
    return functions;
  }

  private calculateLineComplexity(content: string, startLine: number, endLine: number): number {
    const lines = content.split('\n').slice(startLine, endLine);
    const complexityIndicators = ['if', 'for', 'while', 'switch', 'catch', '&&', '||'];
    
    let complexity = 0;
    for (const line of lines) {
      for (const indicator of complexityIndicators) {
        complexity += (line.match(new RegExp(indicator, 'g')) || []).length;
      }
    }
    
    return complexity;
  }

  private extractFunctionName(line: string): string | null {
    const match = line.match(/function\s+(\w+)|(\w+)\s*[=:]\s*(?:function|\()/);
    return match ? (match[1] || match[2]) : null;
  }

  private hasInlineComments(content: string, startLine: number, endLine: number): boolean {
    const lines = content.split('\n').slice(startLine - 1, endLine);
    
    for (const line of lines) {
      if (line.includes('//') || line.includes('/*')) {
        return true;
      }
    }
    
    return false;
  }

  private async checkRequiredFiles(): Promise<{
    existing: string[];
    missing: string[];
    recommendations: string[];
  }> {
    const existing: string[] = [];
    const missing: string[] = [];
    
    for (const file of this.requiredFiles) {
      try {
        await fs.access(file);
        existing.push(file);
      } catch {
        missing.push(file);
      }
    }
    
    const recommendations: string[] = [];
    if (missing.length > 0) {
      recommendations.push(`Create missing documentation files: ${missing.join(', ')}`);
    }
    
    return { existing, missing, recommendations };
  }
}