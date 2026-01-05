import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm'],
    target: 'node18',
    dts: true,
    sourcemap: true,
    clean: true
})