import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy để phát triển cục bộ, chuyển tiếp các request từ /api (ví dụ: localhost:3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy để gọi API của Riot Games cho account theo puuid
      '/api/account': {
        target: 'https://asia.api.riotgames.com/riot/account/v1/accounts/by-puuid',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/account/, ''),
        secure: false,
      },
    },
  },
});
