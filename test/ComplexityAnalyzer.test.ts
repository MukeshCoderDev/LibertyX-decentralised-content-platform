// Complexity Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComplexityAnalyzer } from '../src/audit/analyzers/ComplexityAnalyzer.js';
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
    isFunctionDeclaration: vi.fn(),
    isMethodDeclaration: vi.fn(),
    isArrowFunction: vi.fn(),
    isFunctionExpression: vi.fn(),
    isIfStatement: vi.fn(),
    isWhileStatement: vi.fn(),
    isDoStatement: vi.fn(),
    isForStatement: vi.fn(),
    isForInStatement: vi.fn(),
    isForOfStatement: vi.fn(),
    isSwitchStatement: vi.fn(),
    isTryStatement: vi.fn(),
    isBlock: vi.fn(),
    isIdentifier: vi.fn(),
    isVariableDeclaration: vi.fn(),
    isPropertyAssignment: vi.fn(),
    forEachChild: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn()
    },
    SyntaxKind: {
      IfStatement: 243,
      WhileStatement: 244,
      DoStatement: 245,
      ForStatement: 246,
      ForInStatement: 247,
      ForOfStatement: 248,
      SwitchStatement: 249,
      CatchClause: 296,
      ConditionalExpression: 223,
      CaseClause: 295,
      BinaryExpression: 221,
      AmpersandAmpersandToken: 56,
      BarBarToken: 57,
      FunctionDeclaration: 260,
      MethodDeclaration: 173,
      ArrowFunction: 218,
      FunctionExpression: 217
    }
  };
});

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;
  let mockProgram: any;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock program
    mockProgram = {
      getSourceFiles: vi.fn(() => []),
      getCompilerOptions: vi.fn(() => ({}))
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

  describe('constructor', () => {
    it('should initialize with default thresholds', () => {
      const defaultAnalyzer = new ComplexityAnalyzer();
      expect(defaultAnalyzer).toBeDefined();
    });

    it('should initialize with custom thresholds', () => {
      const customAnalyzer = new ComplexityAnalyzer(15, 100, 5, 8);
      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('analyzeComplexity', () => {
    it('should analyze complexity for empty codebase', async () => {
      mockProgram.getSourceFiles.mockReturnValue([]);

      const result = await analyzer.analyzeComplexity();

      expect(result.functions).toHaveLength(0);
      expect(result.violations).toHaveLength(0);
      expect(result.totalFunctions).toBe(0);
      expect(result.violatingFunctions).toBe(0);
      expect(result.averageComplexity).toBe(0);
      expect(result.maxComplexity).toBe(0);
      expect(result.score).toBe(100);
    });

    it('should analyze functions and detect violations', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockFunctionNode = {
        kind: ts.SyntaxKind.FunctionDeclaration,
        name: { text: 'testFunction' },
        parameters: [{ name: 'param1' }, { name: 'param2' }],
        body: { getStart: () => 0, getEnd: () => 100 },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      // Mock TypeScript AST traversal
      (ts.isFunctionDeclaration as any).mockImplementation((node: any) => node === mockFunctionNode);
      (ts.isMethodDeclaration as any).mockReturnValue(false);
      (ts.isArrowFunction as any).mockReturnValue(false);
      (ts.isFunctionExpression as any).mockReturnValue(false);
      (ts.isIdentifier as any).mockReturnValue(true);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockFunctionNode);
        }
      });

      const result = await analyzer.analyzeComplexity();

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('testFunction');
      expect(result.functions[0].file).toBe('test.ts');
      expect(result.totalFunctions).toBe(1);
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle TypeScript program initialization failure', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.analyzeComplexity()).rejects.toThrow(AuditError);
    });

    it('should handle TypeScript configuration errors', async () => {
      (ts.parseJsonConfigFileContent as any).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ messageText: 'Config error' }]
      });

      await expect(analyzer.analyzeComplexity()).rejects.toThrow(AuditError);
    });
  });

  describe('analyzeFiles', () => {
    it('should analyze specific files', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'specific.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      // Mock program creation for specific files
      const specificMockProgram = {
        getSourceFiles: vi.fn(() => [mockSourceFile])
      };

      (ts.createProgram as any).mockReturnValue(specificMockProgram);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.analyzeFiles(['specific.ts']);

      expect(result).toBeDefined();
      expect(typeof result.score).toBe('number');
    });

    it('should handle missing config file for specific files', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.analyzeFiles(['test.ts'])).rejects.toThrow(AuditError);
    });
  });

  describe('complexity calculations', () => {
    it('should calculate basic metrics for simple functions', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'simple.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockSimpleFunction = {
        kind: ts.SyntaxKind.FunctionDeclaration,
        name: { text: 'simpleFunction' },
        parameters: [],
        body: { getStart: () => 0, getEnd: () => 50 },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isFunctionDeclaration as any).mockImplementation((node: any) => node === mockSimpleFunction);
      (ts.isMethodDeclaration as any).mockReturnValue(false);
      (ts.isArrowFunction as any).mockReturnValue(false);
      (ts.isFunctionExpression as any).mockReturnValue(false);
      (ts.isIdentifier as any).mockReturnValue(true);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockSimpleFunction);
        }
        // Don't traverse into function body to keep complexity low
      });

      const result = await analyzer.analyzeComplexity();

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].metrics.cyclomaticComplexity).toBeGreaterThanOrEqual(1);
      expect(result.functions[0].metrics.parameterCount).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle program creation errors', async () => {
      (ts.createProgram as any).mockImplementation(() => {
        throw new Error('Program creation failed');
      });

      await expect(analyzer.analyzeComplexity()).rejects.toThrow(AuditError);
    });

    it('should handle missing program gracefully', async () => {
      // Force program to be null
      analyzer['program'] = null;
      (ts.createProgram as any).mockReturnValue(null);

      await expect(analyzer.analyzeComplexity()).rejects.toThrow(AuditError);
    });
  });

  describe('recommendations', () => {
    it('should provide recommendations for high complexity', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'complex.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      // Create a mock function that will have high complexity
      const mockComplexFunction = {
        kind: ts.SyntaxKind.FunctionDeclaration,
        name: { text: 'complexFunction' },
        parameters: Array(10).fill({ name: 'param' }), // Many parameters
        body: { getStart: () => 0, getEnd: () => 1000 }, // Long function
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isFunctionDeclaration as any).mockImplementation((node: any) => node === mockComplexFunction);
      (ts.isMethodDeclaration as any).mockReturnValue(false);
      (ts.isArrowFunction as any).mockReturnValue(false);
      (ts.isFunctionExpression as any).mockReturnValue(false);
      (ts.isIdentifier as any).mockReturnValue(true);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockComplexFunction);
        }
      });

      const result = await analyzer.analyzeComplexity();

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });
});