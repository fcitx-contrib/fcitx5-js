# Fcitx5 JS

[Fcitx5](https://github.com/fcitx/fcitx5) input method framework ported to JavaScript with WebAssembly.

The project provides an npm package `fcitx5-js.tgz`, which powers derivative apps for end user.

Derivative | Note
-|-
[Fcitx5 Online](https://github.com/fcitx/fcitx5-online) | [Preview](https://fcitx-contrib.github.io/online/)
[Fcitx5 Chrome](https://github.com/fcitx-contrib/fcitx5-chrome) |

## Build

Fcitx5 JS can be built on Linux, macOS and WSL.

### Install node
You may use [nvm](https://github.com/nvm-sh/nvm)
to install node.

### Install pnpm and dev dependencies
```sh
npm i -g pnpm
pnpm i
pnpm --prefix=fcitx5-keyboard-web i
pnpm --prefix=fcitx5-keyboard-web run build
pnpm --prefix=fcitx5-webview i
./scripts/install-deps.sh
```

### Install emsdk
https://emscripten.org/docs/getting_started/downloads.html

### Build with CMake
```sh
emcmake cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
EMCC_FORCE_STDLIBS=libc++ FCITX_DISTRIBUTION=fcitx5-js cmake --build build
```
You can also use `Ctrl+Shift+B` (or `Cmd+Shift+B` on macOS) in VSCode to execute a task.

### Preview
```sh
npx serve -l 9000 -S preview
```
See `interface FCITX` in [Fcitx5.d.ts](./page/Fcitx5.d.ts) for a list of JS APIs.
They are methods of `globalThis.fcitx` object.

### Pack
```sh
npm pack
```
