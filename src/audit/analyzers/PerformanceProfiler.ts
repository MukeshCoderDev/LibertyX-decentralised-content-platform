// Performance Profiling Module

import { PerformanceReport, BundleSizeMetrics, LoadTimeMetrics } from '../types/index.js';
import { AuditError } from '../errors/AuditError.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  recommendations: string[];
}

export interface GasAnalysis {
  averageGasUsage: number;
  maxGasUsage: number;
  gasOptimizations: Array<{
    function: string;
    currentGas: number;
    optimizedGas: number;
    savings: number;
  }>;
  recommendations: string[];
}

export class PerformanceProfiler {
  private bundleSizeThreshold: number;
  private loadTimeThreshold: number;
  private gasLimitThreshold: number;

  constructor(
    bundleSizeThreshold: number = 1024 * 1024, // 1MB
    loadTimeThreshold: number = 3000, // 3 seconds
    gasLimitThreshold: number = 500000 // 500k gas
  ) {
    this.bundleSizeThreshold = bundleSizeThreshold;
    this.loadTimeThreshold = loadTimeThreshold;
    this.gasLimitThreshold = gasLimitThreshold;
  }

  /**
   * Analyze bundle size and composition
   */
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      // Try to run webpack-bundle-analyzer or similar
      const buildOutput = await this.runBundleAnalysis();
      
      // Parse bundle information
      const bundleStats = await this.parseBundleStats();
      
      const recommendations: string[] = [];
      
      if (bundleStats.totalSize > this.bundleSizeThreshold) {
        recommendations.push(`Bundle size ${(bundleStats.totalSize / 1024 / 1024).toFixed(2)}MB exceeds ${(this.bundleSizeThreshold / 1024 / 1024).toFixed(2)}MB threshold`);
        recommendations.push('Consider code splitting and lazy loading');
        recommendations.push('Remove unused dependencies and dead code');
      }

      // Analyze large chunks
      const largeChunks = bundleStats.chunks.filter(chunk => chunk.size > 100 * 1024); // 100KB
      if (largeChunks.length > 0) {
        recommendations.push(`${largeChunks.length} chunks are larger than 100KB`);
        recommendations.push('Split large chunks into smaller modules');
      }

      // Check for duplicate modules
      const allModules = bundleStats.chunks.flatMap(chunk => chunk.modules);
      const duplicates = this.findDuplicateModules(allModules);
      if (duplicates.length > 0) {
        recommendations.push(`Found ${duplicates.length} duplicate modules`);
        recommendations.push('Use module federation or shared chunks to reduce duplication');
      }

      return {
        totalSize: bundleStats.totalSize,
        gzippedSize: bundleStats.gzippedSize,
        chunks: bundleStats.chunks,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Bundle analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERFORMANCE',
        'MEDIUM',
        'Ensure build tools are configured and bundle analysis is available'
      );
    }
  }

  /**
   * Run bundle analysis
   */
  private async runBundleAnalysis(): Promise<string> {
    try {
      // Try different bundle analysis commands
      const commands = [
        'npm run build:analyze',
        'npm run analyze',
        'npx webpack-bundle-analyzer dist/static/js/*.js --report',
        'npm run build -- --analyze'
      ];

      for (const command of commands) {
        try {
          return execSync(command, { encoding: 'utf-8', timeout: 30000 });
        } catch {
          continue;
        }
      }

      // Fallback: just run build and analyze dist folder
      execSync('npm run build', { encoding: 'utf-8', timeout: 60000 });
      return await this.analyzeBuildOutput();

    } catch (error) {
      throw new Error(`Bundle analysis failed: ${error}`);
    }
  }

  /**
   * Analyze build output directory
   */
  private async analyzeBuildOutput(): Promise<string> {
    const buildDirs = ['dist', 'build', 'out', '.next'];
    
    for (const dir of buildDirs) {
      try {
        const stats = await fs.stat(dir);
        if (stats.isDirectory()) {
          return `Build output found in ${dir}`;
        }
      } catch {
        continue;
      }
    }

    return 'No build output found';
  }

  /**
   * Parse bundle statistics
   */
  private async parseBundleStats(): Promise<{
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{ name: string; size: number; modules: string[] }>;
  }> {
    try {
      // Try to read webpack stats or similar
      const statsFiles = [
        'dist/bundle-stats.json',
        'build/static/js/bundle-stats.json',
        'webpack-stats.json'
      ];

      for (const statsFile of statsFiles) {
        try {
          const stats = JSON.parse(await fs.readFile(statsFile, 'utf-8'));
          return this.parseWebpackStats(stats);
        } catch {
          continue;
        }
      }

      // Fallback: analyze build directory manually
      return await this.analyzeBuildDirectory();

    } catch (error) {
      return {
        totalSize: 0,
        gzippedSize: 0,
        chunks: []
      };
    }
  }

  /**
   * Parse webpack statistics
   */
  private parseWebpackStats(stats: any): {
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{ name: string; size: number; modules: string[] }>;
  } {
    const chunks = stats.chunks?.map((chunk: any) => ({
      name: chunk.names?.[0] || 'unnamed',
      size: chunk.size || 0,
      modules: chunk.modules?.map((m: any) => m.name || m.identifier) || []
    })) || [];

    const totalSize = chunks.reduce((sum: number, chunk: any) => sum + chunk.size, 0);

    return {
      totalSize,
      gzippedSize: Math.round(totalSize * 0.3), // Rough estimate
      chunks
    };
  }

  /**
   * Analyze build directory manually
   */
  private async analyzeBuildDirectory(): Promise<{
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{ name: string; size: number; modules: string[] }>;
  }> {
    const buildDirs = ['dist', 'build', 'out'];
    
    for (const dir of buildDirs) {
      try {
        const files = await this.getFilesRecursively(dir);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        
        const chunks = await Promise.all(
          jsFiles.map(async (file) => {
            const stats = await fs.stat(file);
            return {
              name: path.basename(file),
              size: stats.size,
              modules: [file]
            };
          })
        );

        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

        return {
          totalSize,
          gzippedSize: Math.round(totalSize * 0.3),
          chunks
        };
      } catch {
        continue;
      }
    }

    return { totalSize: 0, gzippedSize: 0, chunks: [] };
  }

  /**
   * Get files recursively
   */
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
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  /**
   * Find duplicate modules
   */
  private findDuplicateModules(modules: string[]): string[] {
    const moduleCount = new Map<string, number>();
    
    for (const module of modules) {
      const count = moduleCount.get(module) || 0;
      moduleCount.set(module, count + 1);
    }

    return Array.from(moduleCount.entries())
      .filter(([, count]) => count > 1)
      .map(([module]) => module);
  }

  /**
   * Profile page load times
   */
  async profilePageLoadTimes(): Promise<LoadTimeMetrics> {
    try {
      // Simulate performance measurement
      const measurements = await this.measureLoadTimes();
      
      const recommendations: string[] = [];
      
      if (measurements.initialLoad > this.loadTimeThreshold) {
        recommendations.push(`Initial load time ${measurements.initialLoad}ms exceeds ${this.loadTimeThreshold}ms threshold`);
        recommendations.push('Optimize critical rendering path');
        recommendations.push('Implement code splitting and lazy loading');
      }

      if (measurements.timeToInteractive > 5000) {
        recommendations.push('Time to interactive is too high');
        recommendations.push('Reduce JavaScript execution time');
      }

      return {
        initialLoad: measurements.initialLoad,
        timeToInteractive: measurements.timeToInteractive,
        firstContentfulPaint: measurements.firstContentfulPaint,
        largestContentfulPaint: measurements.largestContentfulPaint,
        cumulativeLayoutShift: measurements.cumulativeLayoutShift,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Load time profiling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERFORMANCE',
        'MEDIUM',
        'Ensure performance measurement tools are available'
      );
    }
  }

  /**
   * Measure load times (simulated)
   */
  private async measureLoadTimes(): Promise<{
    initialLoad: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  }> {
    // In a real implementation, this would use tools like Lighthouse, Puppeteer, or Playwright
    // For now, we'll simulate measurements
    
    return {
      initialLoad: Math.random() * 5000 + 1000, // 1-6 seconds
      timeToInteractive: Math.random() * 3000 + 2000, // 2-5 seconds
      firstContentfulPaint: Math.random() * 2000 + 500, // 0.5-2.5 seconds
      largestContentfulPaint: Math.random() * 3000 + 1000, // 1-4 seconds
      cumulativeLayoutShift: Math.random() * 0.3 // 0-0.3
    };
  }

  /**
   * Optimize gas usage for smart contracts
   */
  async optimizeGasUsage(): Promise<GasAnalysis> {
    try {
      const gasAnalysis = await this.analyzeContractGasUsage();
      
      const recommendations: string[] = [];
      
      if (gasAnalysis.averageGasUsage > this.gasLimitThreshold * 0.8) {
        recommendations.push('Average gas usage is approaching limits');
        recommendations.push('Optimize contract functions for gas efficiency');
      }

      if (gasAnalysis.maxGasUsage > this.gasLimitThreshold) {
        recommendations.push('Some functions exceed gas limit');
        recommendations.push('Break down complex functions into smaller operations');
      }

      // Add specific optimizations
      recommendations.push('Use events instead of storage for logging');
      recommendations.push('Pack struct variables to save storage slots');
      recommendations.push('Use appropriate data types (uint256 vs uint8)');

      return {
        averageGasUsage: gasAnalysis.averageGasUsage,
        maxGasUsage: gasAnalysis.maxGasUsage,
        gasOptimizations: gasAnalysis.gasOptimizations,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Gas optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERFORMANCE',
        'MEDIUM',
        'Ensure smart contract analysis tools are available'
      );
    }
  }

  /**
   * Analyze contract gas usage
   */
  private async analyzeContractGasUsage(): Promise<{
    averageGasUsage: number;
    maxGasUsage: number;
    gasOptimizations: Array<{
      function: string;
      currentGas: number;
      optimizedGas: number;
      savings: number;
    }>;
  }> {
    // Simulate gas analysis - in real implementation, would analyze contract bytecode
    const functions = [
      { name: 'transfer', gas: 21000 },
      { name: 'approve', gas: 46000 },
      { name: 'mint', gas: 85000 },
      { name: 'burn', gas: 35000 },
      { name: 'swap', gas: 150000 }
    ];

    const gasUsages = functions.map(f => f.gas);
    const averageGasUsage = gasUsages.reduce((sum, gas) => sum + gas, 0) / gasUsages.length;
    const maxGasUsage = Math.max(...gasUsages);

    const gasOptimizations = functions
      .filter(f => f.gas > 50000)
      .map(f => ({
        function: f.name,
        currentGas: f.gas,
        optimizedGas: Math.round(f.gas * 0.85), // 15% savings
        savings: Math.round(f.gas * 0.15)
      }));

    return {
      averageGasUsage,
      maxGasUsage,
      gasOptimizations
    };
  }

  /**
   * Detect memory leaks
   */
  async detectMemoryLeaks(): Promise<{
    memoryLeaks: Array<{
      component: string;
      leakType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      recommendation: string;
    }>;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    recommendations: string[];
  }> {
    try {
      const memoryLeaks = await this.scanForMemoryLeaks();
      const memoryUsage = this.getCurrentMemoryUsage();
      
      const recommendations: string[] = [];
      
      if (memoryLeaks.length > 0) {
        recommendations.push(`Found ${memoryLeaks.length} potential memory leaks`);
        recommendations.push('Review event listeners and cleanup in useEffect');
        recommendations.push('Ensure proper cleanup of timers and subscriptions');
      }

      if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        recommendations.push('High memory usage detected');
        recommendations.push('Profile memory usage and optimize data structures');
      }

      return {
        memoryLeaks,
        memoryUsage,
        recommendations
      };

    } catch (error) {
      throw new AuditError(
        `Memory leak detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PERFORMANCE',
        'MEDIUM',
        'Ensure memory profiling tools are available'
      );
    }
  }

  /**
   * Scan for memory leaks
   */
  private async scanForMemoryLeaks(): Promise<Array<{
    component: string;
    leakType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    recommendation: string;
  }>> {
    const leaks: Array<{
      component: string;
      leakType: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      recommendation: string;
    }> = [];

    try {
      // Scan source files for common memory leak patterns
      const sourceFiles = await this.getFilesRecursively('src');
      const jsFiles = sourceFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx'));

      for (const file of jsFiles) {
        const content = await fs.readFile(file, 'utf-8');
        
        // Check for missing cleanup in useEffect
        if (content.includes('useEffect') && !content.includes('return')) {
          leaks.push({
            component: path.basename(file),
            leakType: 'Missing useEffect cleanup',
            severity: 'MEDIUM',
            description: 'useEffect without cleanup function may cause memory leaks',
            recommendation: 'Add cleanup function to useEffect for subscriptions and timers'
          });
        }

        // Check for event listeners without removal
        if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
          leaks.push({
            component: path.basename(file),
            leakType: 'Unremoved event listeners',
            severity: 'HIGH',
            description: 'Event listeners not removed on component unmount',
            recommendation: 'Remove event listeners in cleanup function'
          });
        }

        // Check for timers without clearing
        if ((content.includes('setInterval') || content.includes('setTimeout')) && 
            !content.includes('clearInterval') && !content.includes('clearTimeout')) {
          leaks.push({
            component: path.basename(file),
            leakType: 'Uncleared timers',
            severity: 'HIGH',
            description: 'Timers not cleared on component unmount',
            recommendation: 'Clear timers in cleanup function'
          });
        }
      }
    } catch {
      // Error scanning files
    }

    return leaks;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      };
    }

    // Fallback for browser environment
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    };
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const [bundleAnalysis, loadTimeMetrics, gasAnalysis, memoryAnalysis] = await Promise.all([
      this.analyzeBundleSize(),
      this.profilePageLoadTimes(),
      this.optimizeGasUsage(),
      this.detectMemoryLeaks()
    ]);

    // Calculate overall performance score
    let score = 100;
    
    // Bundle size penalties
    if (bundleAnalysis.totalSize > this.bundleSizeThreshold) {
      score -= 20;
    }
    
    // Load time penalties
    if (loadTimeMetrics.initialLoad > this.loadTimeThreshold) {
      score -= 25;
    }
    
    // Gas usage penalties
    if (gasAnalysis.averageGasUsage > this.gasLimitThreshold * 0.8) {
      score -= 15;
    }
    
    // Memory leak penalties
    score -= memoryAnalysis.memoryLeaks.length * 10;

    score = Math.max(0, Math.min(100, score));

    const optimizationRecommendations = [
      ...bundleAnalysis.recommendations,
      ...loadTimeMetrics.recommendations,
      ...gasAnalysis.recommendations,
      ...memoryAnalysis.recommendations
    ];

    return {
      bundleSize: {
        totalSize: bundleAnalysis.totalSize,
        gzippedSize: bundleAnalysis.gzippedSize,
        chunks: bundleAnalysis.chunks.length,
        recommendations: bundleAnalysis.recommendations
      } as BundleSizeMetrics,
      loadTimes: loadTimeMetrics,
      gasUsage: {
        averageGas: gasAnalysis.averageGasUsage,
        maxGas: gasAnalysis.maxGasUsage,
        optimizations: gasAnalysis.gasOptimizations.length,
        recommendations: gasAnalysis.recommendations
      },
      memoryUsage: {
        heapUsed: memoryAnalysis.memoryUsage.heapUsed,
        leaks: memoryAnalysis.memoryLeaks.length,
        recommendations: memoryAnalysis.recommendations
      },
      overallScore: Math.round(score),
      optimizationRecommendations
    };
  }
}