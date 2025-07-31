// TypeScript Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TypeScriptAnalyzer } from '../src/audit/analyzers/TypeScriptAnalyzer.js';
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
    flattenDiagnosticMessageText: vi.fn(),
    isVariableDeclaration: vi.fn(),
    isParameter: vi.fn(),
    isFunctionDeclaration: vi.fn(),
    isExportDeclaration: vi.fn(),
    isVariableStatement: vi.fn(),
    isImportDeclaration: vi.fn(),
    isNamedExports: vi.fn(),
    isNamedImports: vi.fn(),
    isIdentifier: vi.fn(),
    forEachChild: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn()
    },
    DiagnosticCategory: {
      Error: 1,
      Warning: 0
    },
    SyntaxKind: {
      ExportKeyword: 93,
      VariableDeclaration: 254
    }
  };
});

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;
  let mockProgram: any;
  let mockChecker: any;

  beforeEach(() => {
    analyzer = new TypeScriptAnalyzer();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock program
    mockProgram = {
      getSemanticDiagnostics: vi.fn(() => []),
      getSyntacticDiagnostics: vi.fn(() => []),
      getDeclarationDiagnostics: vi.fn(() => []),
      getCompilerOptions: vi.fn(() => ({})),
      getSourceFiles: vi.fn(() => []),
      getTypeChecker: vi.fn(() => mockChecker)
    };

    mockChecker = {
      getTypeAtLocation: vi.fn(),
      typeToString: vi.fn()
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

  describe('analyzeTypeScript', () => {
    it('should analyze TypeScript files and return errors', async () => {
      const mockDiagnostic = {
        file: {
          fileName: 'test.ts',
          getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
        },
        start: 0,
        messageText: 'Type error',
        category: ts.DiagnosticCategory.Error
      };

      mockProgram.getSemanticDiagnostics.mockReturnValue([mockDiagnostic]);
      (ts.flattenDiagnosticMessageText as any).mockReturnValue('Type error');

      const errors = await analyzer.analyzeTypeScript();

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        file: 'test.ts',
        line: 1,
        column: 1,
        message: 'Type error',
        severity: 'error'
      });
    });

    it('should handle warnings correctly', async () => {
      const mockDiagnostic = {
        file: {
          fileName: 'test.ts',
          getLineAndCharacterOfPosition: vi.fn(() => ({ line: 5, character: 10 }))
        },
        start: 50,
        messageText: 'Warning message',
        category: ts.DiagnosticCategory.Warning
      };

      mockProgram.getSemanticDiagnostics.mockReturnValue([mockDiagnostic]);
      (ts.flattenDiagnosticMessageText as any).mockReturnValue('Warning message');

      const errors = await analyzer.analyzeTypeScript();

      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('warning');
      expect(errors[0].line).toBe(6);
      expect(errors[0].column).toBe(11);
    });

    it('should throw AuditError when config file not found', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(AuditError);
    });

    it('should throw AuditError when config has errors', async () => {
      (ts.parseJsonConfigFileContent as any).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ messageText: 'Config error' }]
      });

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(AuditError);
    });
  });

  describe('checkStrictCompliance', () => {
    it('should check strict mode compliance', async () => {
      mockProgram.getCompilerOptions.mockReturnValue({
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        noUnusedLocals: false
      });

      const result = await analyzer.checkStrictCompliance();

      expect(result.hasStrictMode).toBe(true);
      expect(result.strictChecks.strict).toBe(true);
      expect(result.strictChecks.noImplicitAny).toBe(true);
      expect(result.strictChecks.noUnusedLocals).toBe(false);
      expect(result.recommendations).toContain('Enable noUnusedLocals to catch unused variables');
    });

    it('should provide recommendations for non-strict mode', async () => {
      mockProgram.getCompilerOptions.mockReturnValue({
        strict: false,
        noImplicitAny: false
      });

      const result = await analyzer.checkStrictCompliance();

      expect(result.hasStrictMode).toBe(false);
      expect(result.recommendations).toContain('Enable strict mode for better type safety');
      expect(result.recommendations).toContain('Enable noImplicitAny to catch untyped variables');
    });
  });

  describe('analyzeTypeCoverage', () => {
    it('should analyze type coverage', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts'
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      
      // Mock AST traversal
      const mockNode = {
        kind: ts.SyntaxKind.VariableDeclaration
      };

      mockChecker.getTypeAtLocation.mockReturnValue({});
      mockChecker.typeToString.mockReturnValue('string');

      // Mock ts.isVariableDeclaration and ts.forEachChild
      (ts.isVariableDeclaration as any).mockReturnValue(true);
      (ts.isParameter as any).mockReturnValue(false);
      (ts.isFunctionDeclaration as any).mockReturnValue(false);
      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        // Only call callback once to avoid infinite recursion
        if (node === mockSourceFile) {
          callback(mockNode);
        }
      });

      const result = await analyzer.analyzeTypeCoverage();

      expect(result.totalSymbols).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
    });

    it('should identify files with any types', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts'
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      mockChecker.typeToString.mockReturnValue('any');

      (ts.isVariableDeclaration as any).mockReturnValue(true);
      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        // Only call callback once to avoid infinite recursion
        if (node === mockSourceFile) {
          callback({});
        }
      });

      const result = await analyzer.analyzeTypeCoverage();

      expect(result.untypedFiles).toContain('test.ts');
    });
  });

  describe('findUnusedExports', () => {
    it('should find unused exports', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      // Mock export detection
      (ts.isExportDeclaration as any).mockReturnValue(false);
      (ts.isFunctionDeclaration as any).mockReturnValue(false);
      (ts.isVariableStatement as any).mockReturnValue(false);
      (ts.isImportDeclaration as any).mockReturnValue(false);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.findUnusedExports();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateTypeScriptReport', () => {
    it('should generate comprehensive report', async () => {
      // Setup mocks for all sub-methods
      mockProgram.getSemanticDiagnostics.mockReturnValue([]);
      mockProgram.getSyntacticDiagnostics.mockReturnValue([]);
      mockProgram.getDeclarationDiagnostics.mockReturnValue([]);
      mockProgram.getCompilerOptions.mockReturnValue({ strict: true });
      mockProgram.getSourceFiles.mockReturnValue([]);

      const report = await analyzer.generateTypeScriptReport();

      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('strictCompliance');
      expect(report).toHaveProperty('typeCoverage');
      expect(report).toHaveProperty('unusedExports');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('recommendations');
      
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should calculate score based on errors and compliance', async () => {
      const mockError = {
        file: {
          fileName: 'test.ts',
          getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
        },
        start: 0,
        messageText: 'Error',
        category: ts.DiagnosticCategory.Error
      };

      mockProgram.getSemanticDiagnostics.mockReturnValue([mockError]);
      mockProgram.getCompilerOptions.mockReturnValue({ strict: false });
      (ts.flattenDiagnosticMessageText as any).mockReturnValue('Error');

      const report = await analyzer.generateTypeScriptReport();

      expect(report.score).toBeLessThan(100); // Should be penalized for errors
    });
  });

  describe('error handling', () => {
    it('should handle TypeScript program initialization failure', async () => {
      (ts.createProgram as any).mockImplementation(() => {
        throw new Error('Program creation failed');
      });

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(AuditError);
    });

    it('should handle missing TypeScript configuration gracefully', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(
        expect.objectContaining({
          category: 'CODE_QUALITY',
          severity: 'HIGH'
        })
      );
    });
  });
});