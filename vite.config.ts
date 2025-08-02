import path from 'path';
import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
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
      assert: 'assert',
      url: 'url',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['ethers'],
          polyfills: ['buffer', 'process', 'stream-browserify', 'crypto-browserify', 'util'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
  },
  optimizeDeps: {
    include: [
      'buffer', 
      'process', 
      'react', 
      'react-dom', 
      'ethers',
      'stream-browserify',
      'crypto-browserify',
      'util',
      'assert',
      'url',
      'os-browserify/browser',
      'path-browserify'
    ],
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
