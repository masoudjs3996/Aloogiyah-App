import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command, mode }) => {
 const env = loadEnv(mode, process.cwd(), 'VITE_');
 if (command === 'build' && !/^https:\/\//i.test(env.VITE_API_BASE_URL || ''))
  throw new Error('VITE_API_BASE_URL must be configured with HTTPS for production.');
 return {plugins:[react()],server:{port:5174},build:{sourcemap:false}};
});
