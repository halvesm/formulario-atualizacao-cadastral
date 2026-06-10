import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

function fallbackFirebaseConfig() {
  return {
    name: 'fallback-firebase-config',
    resolveId(source: string) {
      if (source.includes('firebase-applet-config.json')) {
        const filePath = path.resolve(__dirname, 'firebase-applet-config.json');
        if (!fs.existsSync(filePath)) {
          return '\0virtual:firebase-config';
        }
      }
      return null;
    },
    load(id: string) {
      if (id === '\0virtual:firebase-config') {
        return `export default {
          "apiKey": "your-api-key-placeholder",
          "authDomain": "your-auth-domain-placeholder",
          "projectId": "your-project-id-placeholder",
          "storageBucket": "your-storage-bucket-placeholder",
          "messagingSenderId": "your-messaging-sender-id-placeholder",
          "appId": "your-app-id-placeholder",
          "measurementId": "your-measurement-id-placeholder",
          "firestoreDatabaseId": "(default)"
        };`;
      }
      return null;
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [fallbackFirebaseConfig(), react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
