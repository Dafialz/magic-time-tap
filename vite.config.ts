import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // ВАЖЛИВО: робить всі абсолютні шляхи типу `/bg-space.jpg`
  // відносними до поточного каталогу білду (./),
  // щоб картинки з public/ підхоплювались у підкаталогах.
  base: './',
})
