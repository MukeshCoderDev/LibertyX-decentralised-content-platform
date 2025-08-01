// Test for TypeScript Analyzer

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TypeScriptAnalyzer } from '../src/audit/analyzers/TypeScriptAnalyzer.js';
import { AuditError } from '../src/audit/errors/AuditError.js';

// Mock TypeScript module
vi.mock('typescript', () => ({
  findConfigFile: vi.fn(),
  readConfigFile: vi.fn(),
  parseJsonConfigFileContent: vi.fn(),
  createProgram: vi.fn(),
  sys: {
    fileExists: vi.fn(),
    readFile: vi.fn()
  },
  DiagnosticCategory: {
    Error: 1,
    Warning: 0
  },
  flattenDiagnosticMessageText: vi.fn((text) => text),
  isVariableDeclaration: vi.fn(),
  isParameter: vi.fn(),
  isFunctionDeclaration: vi.fn(),
  isExportDeclaration: vi.fn(),
  isNamedExports: vi.fn(),
  isImportDeclaration: vi.fn(),
  isNamedImports: vi.fn(),
  isIdentifier: vi.fn(),
  isVariableStatement: vi.fn(),
  SyntaxKind: {
    ExportKeyword: 93
  },
  forEachChild: vi.fn()
}));

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;

  beforeEach(() => {
    analyzer = new TypeScriptAnalyzer();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create analyzer with default config path', () => {
      expect(analyzer).toBeInstanceOf(TypeScriptAnalyzer);
    });

    it('should create analyzer with custom config path', () => {
      const customAnalyzer = new TypeScriptAnalyzer('./custom-tsconfig.json');
      expect(customAnalyzer).toBeInstanceOf(TypeScriptAnalyzer);
    });
  });

  describe('analyzeTypeScript', () => {
    it('should handle missing TypeScript config', async () => {
      const ts = await import('typescript');
      vi.mocked(ts.findConfigFile).mockReturnValue(undefined);

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(AuditError);
    });

    it('should handle TypeScript configuration errors', async () => {
      const ts = await import('typescript');
      vi.mocked(ts.findConfigFile).mockReturnValue('./tsconfig.json');
      vi.mocked(ts.readConfigFile).mockReturnValue({
        config: {},
        error: undefined
      });
      vi.mocked(ts.parseJsonConfigFileContent).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ 
          messageText: 'Config error',
          category: 1,
          code: 1001,
          file: undefined,
          start: undefined,
          length: undefined
        }]
      });

      await expect(analyzer.analyzeTypeScript()).rejects.toThrow(AuditError);
    });

    it('should analyze TypeScript files successfully', async () => {
      const ts = await import('typescript');
      
      // Mock successful configuration
      vi.mocked(ts.findConfigFile).mockReturnValue('./tsconfig.json');
      vi.mocked(ts.readConfigFile).mockReturnValue({
        config: {},
        error: undefined
      });
      vi.mocked(ts.parseJsonConfigFileContent).mockReturnValue({
        options: {},
        fileNames: ['test.ts'],
        errors: []
      });

      // Mock program with diagnostics
      const mockProgram = {
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getDeclarationDiagnostics: vi.fn().mockReturnValue([
          {
            file: {
              fileName: 'test.ts',
              getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 0, character: 0 })
            },
            start: 0,
            messageText: 'Test error',
            category: 1 // Error
          }
        ]),
        getCompilerOptions: vi.fn().mockReturnValue({}),
        getTypeChecker: vi.fn().mockReturnValue({}),
        getSourceFiles: vi.fn().mockReturnValue([])
      };

      vi.mocked(ts.createProgram).mockReturnValue(mockProgram as any);
      vi.mocked(ts.flattenDiagnosticMessageText).mockReturnValue('Test error');

      const errors = await analyzer.analyzeTypeScript();

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        file: 'test.ts',
        line: 1,
        column: 1,
        message: 'Test error',
        severity: 'error'
      });
    });
  });

  describe('checkStrictCompliance', () => {
    it('should check TypeScript strict mode compliance', async () => {
      const ts = await import('typescript');
      
      // Mock successful configuration
      vi.mocked(ts.findConfigFile).mockReturnValue('./tsconfig.json');
      vi.mocked(ts.readConfigFile).mockReturnValue({
        config: {},
        error: undefined
      });
      vi.mocked(ts.parseJsonConfigFileContent).mockReturnValue({
        options: {},
        fileNames: ['test.ts'],
        errors: []
      });

      const mockProgram = {
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getDeclarationDiagnostics: vi.fn().mockReturnValue([]),
        getCompilerOptions: vi.fn().mockReturnValue({
          strict: true,
          noImplicitAny: true,
          strictNullChecks: false
        }),
        getTypeChecker: vi.fn().mockReturnValue({}),
        getSourceFiles: vi.fn().mockReturnValue([])
      };

      vi.mocked(ts.createProgram).mockReturnValue(mockProgram as any);

      const compliance = await analyzer.checkStrictCompliance();

      expect(compliance.hasStrictMode).toBe(true);
      expect(compliance.strictChecks.strict).toBe(true);
      expect(compliance.strictChecks.noImplicitAny).toBe(true);
      expect(compliance.strictChecks.strictNullChecks).toBe(false);
      expect(compliance.recommendations).toContain('Enable strictNullChecks to prevent null/undefined errors');
    });
  });

  describe('analyzeTypeCoverage', () => {
    it('should analyze type coverage', async () => {
      const ts = await import('typescript');
      
      // Mock successful configuration
      vi.mocked(ts.findConfigFile).mockReturnValue('./tsconfig.json');
      vi.mocked(ts.readConfigFile).mockReturnValue({
        config: {},
        error: undefined
      });
      vi.mocked(ts.parseJsonConfigFileContent).mockReturnValue({
        options: {},
        fileNames: ['test.ts'],
        errors: []
      });

      const mockSourceFile = {
        fileName: 'test.ts',
        isDeclarationFile: false,
        getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 0, character: 0 })
      };

      const mockTypeChecker = {
        getTypeAtLocation: vi.fn().mockReturnValue({}),
        typeToString: vi.fn().mockReturnValue('string')
      };

      const mockProgram = {
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getDeclarationDiagnostics: vi.fn().mockReturnValue([]),
        getCompilerOptions: vi.fn().mockReturnValue({}),
        getTypeChecker: vi.fn().mockReturnValue(mockTypeChecker),
        getSourceFiles: vi.fn().mockReturnValue([mockSourceFile])
      };

      vi.mocked(ts.createProgram).mockReturnValue(mockProgram as any);
      vi.mocked(ts.isVariableDeclaration).mockReturnValue(true);
      vi.mocked(ts.forEachChild).mockImplementation((node, callback) => {
        // Simulate visiting one variable declaration
        callback(node);
      });

      const coverage = await analyzer.analyzeTypeCoverage();

      expect(coverage).toHaveProperty('totalSymbols');
      expect(coverage).toHaveProperty('typedSymbols');
      expect(coverage).toHaveProperty('coverage');
      expect(coverage).toHaveProperty('untypedFiles');
    });
  });

  describe('generateTypeScriptReport', () => {
    it('should generate comprehensive TypeScript report', async () => {
      const ts = await import('typescript');
      
      // Mock successful configuration
      vi.mocked(ts.findConfigFile).mockReturnValue('./tsconfig.json');
      vi.mocked(ts.readConfigFile).mockReturnValue({
        config: {},
        error: undefined
      });
      vi.mocked(ts.parseJsonConfigFileContent).mockReturnValue({
        options: {},
        fileNames: ['test.ts'],
        errors: []
      });

      const mockProgram = {
        getSemanticDiagnostics: vi.fn().mockReturnValue([]),
        getSyntacticDiagnostics: vi.fn().mockReturnValue([]),
        getDeclarationDiagnostics: vi.fn().mockReturnValue([]),
        getCompilerOptions: vi.fn().mockReturnValue({
          strict: true,
          noImplicitAny: true
        }),
        getTypeChecker: vi.fn().mockReturnValue({
          getTypeAtLocation: vi.fn().mockReturnValue({}),
          typeToString: vi.fn().mockReturnValue('string')
        }),
        getSourceFiles: vi.fn().mockReturnValue([{
          fileName: 'test.ts',
          isDeclarationFile: false,
          getLineAndCharacterOfPosition: vi.fn().mockReturnValue({ line: 0, character: 0 })
        }])
      };

      vi.mocked(ts.createProgram).mockReturnValue(mockProgram as any);

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
    });
  });
});