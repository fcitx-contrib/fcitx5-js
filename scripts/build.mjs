import { build } from 'esbuild'

await build({
  entryPoints: ['page/index.ts'],
  bundle: true,
  outfile: 'build/index.js',
  target: 'es2020',
  format: 'esm',
  platform: 'browser',
  minify: true,
  sourcemap: false, // meaningless as index.js is appended to Fcitx5.js
})
