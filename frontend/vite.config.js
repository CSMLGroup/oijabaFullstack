import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use base: '/' for both dev and production for correct routing on Vercel
  base: '/',
  build: {
    outDir: '../dist'
  },
  server: { port: 5173 }
}))
