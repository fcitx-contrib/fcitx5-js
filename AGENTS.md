# AI Agent Instructions

## Project Overview

fcitx5-js is the [Fcitx5](https://github.com/fcitx/fcitx5) input method framework ported to JavaScript with WebAssembly. The core is C++ (built with CMake + Ninja via Emscripten), wrapped by TypeScript/ES modules that expose a `fcitx5-js.tgz` npm package for derivative apps.

## Setup

First-time setup (also matches CI):

```sh
pnpm i
pnpm --prefix=fcitx5-keyboard-web i && pnpm --prefix=fcitx5-keyboard-web run build
pnpm --prefix=fcitx5-webview i && pnpm --prefix=fcitx5-webview run build
./scripts/install-deps.sh
```

Emscripten is required; see `.emscripten-version` for the pinned version. Do NOT install emsdk yourself — if `emcc` is not in your environment, ask the developer for the location of their emsdk.

## Build

After changing code, always build to verify the change compiles:

```sh
emcmake cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
EMCC_FORCE_STDLIBS=libc++ cmake --build build
```

## Preview

Run a local server and check `interface FCITX` in [Fcitx5.d.ts](./page/Fcitx5.d.ts) for the JS API:

```sh
npx serve -l 9000 -S preview
```

## Lint

Run the same checks as CI after changing code:

```sh
./scripts/lint.sh
./scripts/format.sh
```

## Test

Run Playwright end-to-end tests (install browsers first):

```sh
npx playwright install
pnpm run test
```
