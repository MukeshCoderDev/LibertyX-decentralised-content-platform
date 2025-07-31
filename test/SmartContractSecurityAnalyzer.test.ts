// Smart Contract Security Analyzer Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartContractSecurityAnalyzer } from '../src/audit/analyzers/SmartContractSecurityAnalyzer.js';
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
    isCallExpression: vi.fn(),
    isPropertyAccessExpression: vi.fn(),
    isTryStatement: vi.fn(),
    isAwaitExpression: vi.fn(),
    isVariableDeclaration: vi.fn(),
    isObjectLiteralExpression: vi.fn(),
    isPropertyAssignment: vi.fn(),
    isIdentifier: vi.fn(),
    isStringLiteral: vi.fn(),
    forEachChild: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn()
    }
  };
});

describe('SmartContractSecurityAnalyzer', () => {
  let analyzer: SmartContractSecurityAnalyzer;
  let mockProgram: any;

  beforeEach(() => {
    analyzer = new SmartContractSecurityAnalyzer();
    
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
      fileNames: ['contract.ts'],
      errors: []
    });
    (ts.createProgram as any).mockReturnValue(mockProgram);
  });

  describe('scanSmartContracts', () => {
    it('should scan contracts with no vulnerabilities', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'safe-contract.ts',
        getFullText: () => 'const safeCode = "hello world";',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.scanSmartContracts();

      expect(result.vulnerabilities).toHaveLength(0);
      expect(result.riskLevel).toBe('LOW');
      expect(result.totalVulnerabilities).toBe(0);
      expect(result.criticalCount).toBe(0);
      expect(result.highCount).toBe(0);
      expect(result.scannedFiles).toBe(1);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should detect security vulnerabilities in contract code', async () => {
      const vulnerableCode = `
        contract.call();
        msg.sender.call();
        balance++;
        withdraw(amount);
        gas: 21000;
        block.timestamp;
        storage pointer;
        delegatecall();
        private password;
        onlyOwner;
      `;

      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'vulnerable-contract.ts',
        getFullText: () => vulnerableCode,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.scanSmartContracts();

      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.riskLevel).not.toBe('LOW');
      expect(result.totalVulnerabilities).toBeGreaterThan(0);
      
      // Check for specific vulnerability types
      const vulnerabilityTypes = result.vulnerabilities.map(v => v.type);
      expect(vulnerabilityTypes).toContain('Unchecked External Call');
      expect(vulnerabilityTypes).toContain('Reentrancy Vulnerability');
      expect(vulnerabilityTypes).toContain('Private Data Exposure');
    });

    it('should analyze contract calls for error handling', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'contract-calls.ts',
        getFullText: () => 'contract.transfer(amount);',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockCallExpression = {
        expression: {
          name: { text: 'transfer' },
          expression: { 
            text: 'contract'
          }
        },
        arguments: [],
        parent: null,
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      
      (ts.isCallExpression as any).mockImplementation((node: any) => node === mockCallExpression);
      (ts.isPropertyAccessExpression as any).mockImplementation((node: any) => 
        node === mockCallExpression.expression || node === mockCallExpression.expression.expression
      );
      (ts.isIdentifier as any).mockImplementation((node: any) => 
        node === mockCallExpression.expression.expression
      );
      (ts.isTryStatement as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockCallExpression);
        }
      });

      const result = await analyzer.scanSmartContracts();

      expect(result.contractCalls).toHaveLength(1);
      expect(result.contractCalls[0].method).toBe('transfer');
      expect(result.contractCalls[0].contract).toBe('contract');
      expect(result.contractCalls[0].hasErrorHandling).toBe(false);
      
      // Should add vulnerability for missing error handling
      const errorHandlingVulns = result.vulnerabilities.filter(v => 
        v.type === 'Missing Error Handling'
      );
      expect(errorHandlingVulns.length).toBeGreaterThan(0);
    });

    it('should handle TypeScript program initialization failure', async () => {
      (ts.findConfigFile as any).mockReturnValue(null);

      await expect(analyzer.scanSmartContracts()).rejects.toThrow(AuditError);
    });

    it('should handle TypeScript configuration errors', async () => {
      (ts.parseJsonConfigFileContent as any).mockReturnValue({
        options: {},
        fileNames: [],
        errors: [{ messageText: 'Config error' }]
      });

      await expect(analyzer.scanSmartContracts()).rejects.toThrow(AuditError);
    });

    it('should filter contract-related files', async () => {
      const contractFile = {
        isDeclarationFile: false,
        fileName: 'blockchain/MyContract.ts',
        getFullText: () => '',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const regularFile = {
        isDeclarationFile: false,
        fileName: 'utils.ts',
        getFullText: () => '',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([contractFile, regularFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.scanSmartContracts();

      // Should only scan contract-related files
      expect(result.scannedFiles).toBe(1);
    });

    it('should calculate risk levels correctly', async () => {
      const criticalVulnCode = 'msg.sender.call(); delegatecall(); private secret;';
      
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'critical-contract.ts',
        getFullText: () => criticalVulnCode,
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.scanSmartContracts();

      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.criticalCount).toBeGreaterThan(0);
      expect(result.averageRiskScore).toBeGreaterThan(0);
    });
  });

  describe('validateContractInteractions', () => {
    it('should validate contract interactions', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'interactions.ts',
        getFullText: () => '',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.validateContractInteractions();

      expect(result).toHaveProperty('secureInteractions');
      expect(result).toHaveProperty('insecureInteractions');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.secureInteractions).toBe('number');
      expect(typeof result.insecureInteractions).toBe('number');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should validate specific files when provided', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'specific-contract.ts',
        getFullText: () => '',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      (ts.forEachChild as any).mockImplementation(() => {});

      const result = await analyzer.validateContractInteractions(['specific-contract.ts']);

      expect(result).toBeDefined();
      expect(typeof result.secureInteractions).toBe('number');
    });

    it('should provide recommendations for insecure interactions', async () => {
      const mockSourceFile = {
        isDeclarationFile: false,
        fileName: 'insecure.ts',
        getFullText: () => '',
        getLineAndCharacterOfPosition: vi.fn(() => ({ line: 0, character: 0 }))
      };

      const mockInsecureCall = {
        expression: {
          name: { text: 'call' },
          expression: { 
            text: 'contract'
          }
        },
        arguments: [],
        parent: null,
        getStart: () => 0
      };

      mockProgram.getSourceFiles.mockReturnValue([mockSourceFile]);
      
      (ts.isCallExpression as any).mockImplementation((node: any) => node === mockInsecureCall);
      (ts.isPropertyAccessExpression as any).mockImplementation((node: any) => 
        node === mockInsecureCall.expression || node === mockInsecureCall.expression.expression
      );
      (ts.isIdentifier as any).mockImplementation((node: any) => 
        node === mockInsecureCall.expression.expression
      );
      (ts.isTryStatement as any).mockReturnValue(false);

      (ts.forEachChild as any).mockImplementation((node: any, callback: any) => {
        if (node === mockSourceFile) {
          callback(mockInsecureCall);
        }
      });

      const result = await analyzer.validateContractInteractions();

      expect(result.insecureInteractions).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('error handling'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle program creation errors', async () => {
      (ts.createProgram as any).mockImplementation(() => {
        throw new Error('Program creation failed');
      });

      await expect(analyzer.scanSmartContracts()).rejects.toThrow(AuditError);
    });

    it('should handle missing program gracefully', async () => {
      // Force program to be null
      analyzer['program'] = null;
      (ts.createProgram as any).mockReturnValue(null);

      await expect(analyzer.scanSmartContracts()).rejects.toThrow(AuditError);
    });
  });

  describe('security patterns', () => {
    it('should initialize with security patterns', () => {
      const patterns = analyzer['securityPatterns'];
      
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      
      // Check for some key patterns
      const patternNames = patterns.map(p => p.name);
      expect(patternNames).toContain('Reentrancy Vulnerability');
      expect(patternNames).toContain('Unchecked External Call');
      expect(patternNames).toContain('Private Data Exposure');
    });

    it('should have proper severity levels for patterns', () => {
      const patterns = analyzer['securityPatterns'];
      
      for (const pattern of patterns) {
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(pattern.severity);
        expect(typeof pattern.description).toBe('string');
        expect(typeof pattern.recommendation).toBe('string');
        expect(pattern.pattern).toBeInstanceOf(RegExp);
      }
    });
  });
});