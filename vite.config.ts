import path from 'path';
import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'require': '(() => { throw new Error("require is not supported in browser environment") })',
    'module': '{}',
    'exports': '{}',
  },
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@artifacts': path.resolve(__dirname, './artifacts'),
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['ethers'],
        }
      },
      external: (id) => {
        // Don't bundle Node.js built-ins that can't be polyfilled
        return ['fs', 'path', 'crypto', 'stream', 'os', 'events', 'child_process'].includes(id);
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      exclude: [/node_modules\/(?!(@walletconnect|@coinbase|arweave|ethers))/],
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'react', 'react-dom', 'ethers'],
    exclude: ['@nomicfoundation/hardhat-toolbox'],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
});
