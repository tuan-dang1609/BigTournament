import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),mkcert()],
  server:{
    proxy:{
      '/api': 
      {
        target: 'http://localhost:3000',
        changeOrigin: true,

      }
    },
    https: true 
  }
})
