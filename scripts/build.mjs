import { build } from 'esbuild'

const common = {
  bundle: true,
  target: 'es2020',
  format: 'esm',
  platform: 'browser',
  minify: false, // avoid name conflict since pre.js and index.js are simply concatenated
  sourcemap: false, // meaningless as index.js is appended to Fcitx5.js
}

await build({
  ...common,
  entryPoints: ['page/index.ts'],
  outfile: 'build/index.js',
})

await build({
  ...common,
  entryPoints: ['page/pre.ts'],
  outfile: 'build/pre.js',
})

await build({
  ...common,
  bundle: false, // This ensures worker and main shares the same Fcitx5.js which minimizes bandwidth.
  entryPoints: ['page/worker.ts'],
  outfile: 'build/worker.js'
})
