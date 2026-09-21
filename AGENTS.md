# AI Agent Instructions

## Project Overview

fcitx5-js is the [Fcitx5](https://github.com/fcitx/fcitx5) input method framework ported to JavaScript with WebAssembly. The core is C++ (built with CMake + Ninja via Emscripten), wrapped by TypeScript/ES modules that expose a `fcitx5-js.tgz` npm package for derivative apps.

## Web Runtime Architecture

- In the web runtime, use `location.pathname` as the fcitx `program` value. Do not include the domain or origin: runtimes on different domains do not share data. Using the pathname lets a single-page application distinguish routes without reloading the page.
- Each live `<input>` or `<textarea>` DOM element owns one `WasmInputContext` while it remains connected to the document. Preserve that input context across blur and refocus of the same element; unlike iOS `documentIdentifier`, the DOM element provides a stable identity that can be remembered.
- A pathname change invalidates the focused element's existing input context. Destroy and recreate it with the new pathname before the next context-specific operation, even if no focus event occurred, and synchronize surrounding text before processing the first key.
- Destroy an input context when its DOM element is detached, and destroy all remaining input contexts when web input handling is disabled. Do not retain mappings after destruction.
- The numeric `WasmInputContextId` is an opaque token that maps a DOM element to one live C++ `WasmInputContext`; it is not a persistent document identifier. Every context-specific operation and every commit, preedit, or delete-surrounding-text callback must carry this token.
- Route callbacks only to the DOM element whose token matches the currently focused input. Do not use `mostRecentInputContext()` for context-specific operations because delayed callbacks could otherwise target a different element.

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
