import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the build working under a sub-path: username.github.io/rolling-amount/
export default defineConfig({
  base: './',
  plugins: [react()],
})
