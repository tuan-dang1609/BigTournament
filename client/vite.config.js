import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  if (mode === 'development') {
    const mkcert = require('vite-plugin-mkcert').default;
    plugins.push(mkcert());
  }

  return {
    plugins,
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      },
      https: mode === 'development' // Only enable HTTPS in development
    }
  }
});
