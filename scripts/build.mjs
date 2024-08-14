import { build } from 'esbuild'

await build({
  entryPoints: ['page/index.ts'],
  bundle: true,
  outfile: 'preview/index.js',
  target: 'es2020',
  format: 'esm',
  platform: 'browser',
  minify: true,
  sourcemap: true,
})
