// Import Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportAnalyzer } from '../src/audit/analyzers/ImportAnalyzer.js';
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
    isImportDeclaration: vi.fn(),
    isStringLiteral: vi.fn(),
    isNamedImports: vi.fn(),
    isNamespaceImport: vi.fn(),
    isIdentifier: vi.fn(),
    isPropertyAccessExpression: vi.fn(),
    isJsxOpeningElement: vi.fn(),
    isJsxSelfClosingElement: vi.fn(),
    forEachChild: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn()
    }
  };
});

describe('ImportAnalyzer', () => {
  let analyzer: ImportAnalyzer;
  let mockProgram: any;

  beforeEach(() => {
    analyzer = new ImportAnalyzer();
    
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

  describe('analyzeImports', () => {
    it('should analyze imports for empty codebase', async () => {
      mockProgram.getSourceFiles.mockReturnValue([]);

      const result = await analyzer.analyzeImports();

      expect(result.unusedImports).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.duplicateImports).toHaveLength(0);
      expect(result.importStatistics.totalImports).toBe(0);
      expect(result.importStatistics.unusedImports).toBe(0);
      expect(result.score).toBe(100);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should detect unused imports', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockImportNode = {
        moduleSpecifier: { text: 'lodash' },
        importClause: {
          name: { text: 'lodash' },
          namedBindings: null
        },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      // Mock import detection
      (ts.isImportDeclaration as any).mockImplementation((node: any) => node === mockImportNode);
      (ts.isStringLiteral as any).mockImplementation((node: any) => node === mockImportNode.moduleSpecifier);
      (ts.isIdentifier as any).mockReturnValue(false); // No usage found

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockImportNode);
        }
      });

      const result = await analyzer.analyzeImports();

      expect(result.unusedImports.length).toBeGreaterThan(0);
      expect(result.unusedImports[0].import).toBe('lodash');
      expect(result.unusedImports[0].module).toBe('lodash');
      expect(result.score).toBeLessThan(100);
    });

    it('should handle TypeScript program initialization failure', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.analyzeImports()).rejects.toThrow(AuditError);
    });

    it('should handle TypeScript configuration errors', async () => {
      (ts.parseJsonConfigFileContent as any).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ messageText: 'Config error' }]
      });

      await expect(analyzer.analyzeImports()).rejects.toThrow(AuditError);
    });
  });

  describe('analyzeFiles', () => {
    it('should analyze specific files', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'specific.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.analyzeFiles(['specific.ts']);

      expect(result).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should provide optimization suggestions', () => {
      const mockAnalysisResult = {
        unusedImports: [
          {
            file: 'test.ts',
            line: 1,
            column: 1,
            name: 'unused',
            source: 'lodash',
            type: 'named' as const
          }
        ],
        circularDependencies: [
          {
            files: ['a.ts', 'b.ts'],
            cycle: ['a.ts', 'b.ts', 'a.ts']
          }
        ],
        duplicateImports: [
          {
            name: 'duplicate',
            files: ['file1.ts', 'file2.ts'],
            sources: ['source1', 'source2']
          }
        ],
        importStatistics: {
          totalImports: 10,
          unusedImports: 1,
          externalImports: 5,
          internalImports: 5,
          averageImportsPerFile: 5
        },
        recommendations: [],
        score: 85
      };

      const suggestions = analyzer.getOptimizationSuggestions(mockAnalysisResult);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('unused'))).toBe(true);
      expect(suggestions.some(s => s.includes('circular'))).toBe(true);
      expect(suggestions.some(s => s.includes('duplicate'))).toBe(true);
    });

    it('should handle empty analysis result', () => {
      const emptyResult = {
        unusedImports: [],
        circularDependencies: [],
        duplicateImports: [],
        importStatistics: {
          totalImports: 0,
          unusedImports: 0,
          externalImports: 0,
          internalImports: 0,
          averageImportsPerFile: 0
        },
        recommendations: [],
        score: 100
      };

      const suggestions = analyzer.getOptimizationSuggestions(emptyResult);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBe(0);
    });
  });

  describe('import detection', () => {
    it('should detect named imports', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockNamedImportNode = {
        moduleSpecifier: { text: 'react' },
        importClause: {
          name: null,
          namedBindings: {
            elements: [
              { name: { text: 'useState' } },
              { name: { text: 'useEffect' } }
            ]
          }
        },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isImportDeclaration as any).mockImplementation((node: any) => node === mockNamedImportNode);
      (ts.isStringLiteral as any).mockImplementation((node: any) => node === mockNamedImportNode.moduleSpecifier);
      (ts.isNamedImports as any).mockReturnValue(true);
      (ts.isNamespaceImport as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockNamedImportNode);
        }
      });

      const result = await analyzer.analyzeImports();

      expect(result.importStatistics.totalImports).toBe(2);
      expect(result.unusedImports.length).toBe(2); // Both unused since no usage detected
    });

    it('should detect namespace imports', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockNamespaceImportNode = {
        moduleSpecifier: { text: 'lodash' },
        importClause: {
          name: null,
          namedBindings: {
            name: { text: '_' }
          }
        },
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isImportDeclaration as any).mockImplementation((node: any) => node === mockNamespaceImportNode);
      (ts.isStringLiteral as any).mockImplementation((node: any) => node === mockNamespaceImportNode.moduleSpecifier);
      (ts.isNamedImports as any).mockReturnValue(false);
      (ts.isNamespaceImport as any).mockReturnValue(true);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockNamespaceImportNode);
        }
      });

      const result = await analyzer.analyzeImports();

      expect(result.importStatistics.totalImports).toBe(1);
      expect(result.unusedImports[0].import).toBe('*');
    });
  });

  describe('error handling', () => {
    it('should handle program creation errors', async () => {
      (ts.createProgram as any).mockImplementation(() => {
        throw new Error('Program creation failed');
      });

      await expect(analyzer.analyzeImports()).rejects.toThrow(AuditError);
    });

    it('should handle missing program gracefully', async () => {
      // Force program to be null
      analyzer['program'] = null;
      (ts.createProgram as any).mockReturnValue(null);

      await expect(analyzer.analyzeImports()).rejects.toThrow(AuditError);
    });
  });

  describe('statistics calculation', () => {
    it('should calculate import statistics correctly', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'test.ts',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      // Mock multiple imports - some external, some internal
      const mockExternalImport = {
        moduleSpecifier: { text: 'react' },
        importClause: { name: { text: 'React' }, namedBindings: null },
        getStart: () => 0
      };

      const mockInternalImport = {
        moduleSpecifier: { text: './utils' },
        importClause: { name: { text: 'utils' }, namedBindings: null },
        getStart: () => 10
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);

      (ts.isImportDeclaration as any).mockImplementation((node: any) => 
        node === mockExternalImport || node === mockInternalImport
      );
      (ts.isStringLiteral as any).mockImplementation((node: any) => 
        node === mockExternalImport.moduleSpecifier || node === mockInternalImport.moduleSpecifier
      );

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockExternalImport);
          callback(mockInternalImport);
        }
      });

      const result = await analyzer.analyzeImports();

      expect(result.importStatistics.totalImports).toBe(2);
      expect(result.importStatistics.externalImports).toBe(1);
      expect(result.importStatistics.internalImports).toBe(1);
      expect(result.importStatistics.averageImportsPerFile).toBe(2);
    });
  });
});