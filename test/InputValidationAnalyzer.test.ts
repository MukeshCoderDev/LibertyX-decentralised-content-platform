// Input Validation Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputValidationAnalyzer } from '../src/audit/analyzers/InputValidationAnalyzer.js';
import { AuditError } from '../src/audit/errors/AuditError.js';
import * as ts from 'typescript';

// Mock TypeScript compiler API
vi.mock('typescript', async () => {
  const actual = await vi.importActual('typescript');
  return {
    ...actual,
    findConfigFile: vi.fn(),
    readConfigFile: vi.fn(),
    parseJsonConfigFileContent: vi.fn(),
    createProgram: vi.fn(),
    isPropertyAccessExpression: vi.fn(),
    isFunctionDeclaration: vi.fn(),
    isMethodDeclaration: vi.fn(),
    isVariableDeclaration: vi.fn(),
    isIdentifier: vi.fn(),
    forEachChild: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn()
    }
  };
});

describe('InputValidationAnalyzer', () => {
  let analyzer: InputValidationAnalyzer;
  let mockProgram: any;

  beforeEach(() => {
    analyzer = new InputValidationAnalyzer();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock program
    mockProgram = {
      getSourceFiles: vi.fn(() => [])
    };

    // Setup default mocks
    (ts.findConfigFile as any).mockReturnValue('./tsconfig.json');
    (ts.readConfigFile as any).mockReturnValue({ config: {} });
    (ts.parseJsonConfigFileContent as any).mockReturnValue({
      options: {},
      fileNames: ['test.ts'],
      errors: []
    });
    (ts.createProgram as any).mockReturnValue(mockProgram);
  });

  describe('validateInputSanitization', () => {
    it('should validate input sanitization for empty codebase', async () => {
      mockProgram.getSourceFiles.mockReturnValue([]);

      const result = await analyzer.validateInputSanitization();

      expect(result.inputSources).toHaveLength(0);
      expect(result.validationIssues).toHaveLength(0);
      expect(result.vulnerabilities).toHaveLength(0);
      expect(result.riskLevel).toBe('LOW');
      expect(result.statistics.totalInputs).toBe(0);
      expect(result.statistics.validationCoverage).toBe(100);
      expect(result.statistics.sanitizationCoverage).toBe(100);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should detect input sources and validation issues', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'api.ts',
        getFullText: () => `
          const userInput = req.body.data;
          const userId = req.params.id;
          document.innerHTML = userInput;
        `,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockPropertyAccess = {
        getText: () => 'req.body',
        name: { text: 'data' },
        getStart: () => 0
      };

      const mockVariableDeclaration = {
        name: { text: 'userInput' },
        initializer: { getText: () => 'req.body.data' },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isPropertyAccessExpression as any).mockImplementation((node: any) => 
        node === mockPropertyAccess
      );
      (ts.isVariableDeclaration as any).mockImplementation((node: any) => 
        node === mockVariableDeclaration
      );
      (ts.isIdentifier as any).mockReturnValue(true);
      (ts.isFunctionDeclaration as any).mockReturnValue(false);
      (ts.isMethodDeclaration as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockPropertyAccess);
          callback(mockVariableDeclaration);
        }
      });

      const result = await analyzer.validateInputSanitization();

      expect(result.inputSources.length).toBeGreaterThan(0);
      expect(result.validationIssues.length).toBeGreaterThan(0);
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.riskLevel).not.toBe('LOW');
      
      // Check for XSS vulnerability
      const xssVulns = result.vulnerabilities.filter(v => v.type === 'XSS');
      expect(xssVulns.length).toBeGreaterThan(0);
    });

    it('should handle TypeScript program initialization failure', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.validateInputSanitization()).rejects.toThrow(AuditError);
    });

    it('should handle TypeScript configuration errors', async () => {
      (ts.parseJsonConfigFileContent as any).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ messageText: 'Config error' }]
      });

      await expect(analyzer.validateInputSanitization()).rejects.toThrow(AuditError);
    });

    it('should detect various input source types', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'inputs.ts',
        getFullText: () => `
          const body = req.body;
          const params = req.params;
          const query = req.query;
          const files = req.files;
          const cookie = document.cookie;
          const storage = localStorage.getItem('key');
        `,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const inputSources = [
        { getText: () => 'req.body', name: { text: 'body' }, getStart: () => 0 },
        { getText: () => 'req.params', name: { text: 'params' }, getStart: () => 10 },
        { getText: () => 'req.query', name: { text: 'query' }, getStart: () => 20 },
        { getText: () => 'req.files', name: { text: 'files' }, getStart: () => 30 },
        { getText: () => 'document.cookie', name: { text: 'cookie' }, getStart: () => 40 },
        { getText: () => 'localStorage.getItem', name: { text: 'getItem' }, getStart: () => 50 }
      ];

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isPropertyAccessExpression as any).mockImplementation((node: any) => 
        inputSources.includes(node)
      );
      (ts.isVariableDeclaration as any).mockReturnValue(false);
      (ts.isFunctionDeclaration as any).mockReturnValue(false);
      (ts.isMethodDeclaration as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          inputSources.forEach(source => callback(source));
        }
      });

      const result = await analyzer.validateInputSanitization();

      expect(result.inputSources.length).toBeGreaterThan(0);
      
      // Check for different input types
      const inputTypes = result.inputSources.map(i => i.type);
      expect(inputTypes).toContain('api_request');
      expect(inputTypes).toContain('url_param');
      expect(inputTypes).toContain('query_param');
    });

    it('should calculate risk levels correctly', async () => {
      const vulnerableCode = `
        document.innerHTML = userInput;
        eval(userInput);
        query("SELECT * FROM users WHERE id = " + userId);
        exec("rm -rf " + userPath);
      `;

      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'vulnerable.ts',
        getFullText: () => vulnerableCode,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.validateInputSanitization();

      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      
      // Should detect multiple vulnerability types
      const vulnTypes = result.vulnerabilities.map(v => v.type);
      expect(vulnTypes).toContain('XSS');
      expect(vulnTypes).toContain('SQL_INJECTION');
      expect(vulnTypes).toContain('COMMAND_INJECTION');
    });

    it('should provide appropriate recommendations', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'unvalidated.ts',
        getFullText: () => 'const input = req.body.data;',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockVariableDeclaration = {
        name: { text: 'input' },
        initializer: { getText: () => 'req.body.data' },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isVariableDeclaration as any).mockImplementation((node: any) => 
        node === mockVariableDeclaration
      );
      (ts.isIdentifier as any).mockReturnValue(true);
      (ts.isPropertyAccessExpression as any).mockReturnValue(false);
      (ts.isFunctionDeclaration as any).mockReturnValue(false);
      (ts.isMethodDeclaration as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockVariableDeclaration);
        }
      });

      const result = await analyzer.validateInputSanitization();

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('validation'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('sanitization'))).toBe(true);
    });
  });

  describe('detectXSSAndInjectionAttacks', () => {
    it('should detect XSS and injection vulnerabilities', async () => {
      const vulnerableCode = `
        document.innerHTML = userInput;
        query("SELECT * FROM users WHERE id = " + userId);
        eval(maliciousCode);
      `;

      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'vulnerable.ts',
        getFullText: () => vulnerableCode,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      const result = await analyzer.detectXSSAndInjectionAttacks();

      expect(result.xssVulnerabilities.length).toBeGreaterThan(0);
      expect(result.injectionVulnerabilities.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      expect(result.recommendations.some(r => r.includes('XSS'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('injection'))).toBe(true);
    });

    it('should analyze specific files when provided', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'specific.ts',
        getFullText: () => 'document.innerHTML = input;',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      const result = await analyzer.detectXSSAndInjectionAttacks(['specific.ts']);

      expect(result).toBeDefined();
      expect(Array.isArray(result.xssVulnerabilities)).toBe(true);
      expect(Array.isArray(result.injectionVulnerabilities)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle clean code with no vulnerabilities', async () => {
      const cleanCode = `
        const safeElement = document.createElement('div');
        safeElement.textContent = userInput;
        const query = db.prepare('SELECT * FROM users WHERE id = ?');
        query.run(userId);
      `;

      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'clean.ts',
        getFullText: () => cleanCode,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      const result = await analyzer.detectXSSAndInjectionAttacks();

      expect(result.xssVulnerabilities).toHaveLength(0);
      expect(result.injectionVulnerabilities).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle program creation errors', async () => {
      (ts.createProgram as any).mockImplementation(() => {
        throw new Error('Program creation failed');
      });

      await expect(analyzer.validateInputSanitization()).rejects.toThrow(AuditError);
    });

    it('should handle missing program gracefully', async () => {
      // Force program to be null
      analyzer['program'] = null;
      (ts.createProgram as any).mockReturnValue(null);

      await expect(analyzer.validateInputSanitization()).rejects.toThrow(AuditError);
    });
  });

  describe('validation patterns', () => {
    it('should have proper validation and sanitization patterns', () => {
      const validationMethods = analyzer['validationMethods'];
      const sanitizationMethods = analyzer['sanitizationMethods'];
      const dangerousPatterns = analyzer['dangerousPatterns'];

      expect(Array.isArray(validationMethods)).toBe(true);
      expect(validationMethods.length).toBeGreaterThan(0);
      expect(validationMethods).toContain('validate');
      expect(validationMethods).toContain('sanitize');

      expect(Array.isArray(sanitizationMethods)).toBe(true);
      expect(sanitizationMethods.length).toBeGreaterThan(0);
      expect(sanitizationMethods).toContain('escape');
      expect(sanitizationMethods).toContain('clean');

      expect(Array.isArray(dangerousPatterns)).toBe(true);
      expect(dangerousPatterns.length).toBeGreaterThan(0);
      
      // Check pattern structure
      for (const pattern of dangerousPatterns) {
        expect(typeof pattern.name).toBe('string');
        expect(Array.isArray(pattern.patterns)).toBe(true);
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(pattern.severity);
        expect(typeof pattern.description).toBe('string');
        expect(typeof pattern.recommendation).toBe('string');
      }
    });
  });
});