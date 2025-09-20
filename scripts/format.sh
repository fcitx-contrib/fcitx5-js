find src wasmfrontend wasmnotifications webkeyboard webpanel chromepanel -name '*.h' -o -name '*.cpp' | xargs clang-format -i
pnpm run lint:fix
