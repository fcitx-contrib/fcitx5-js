find src wasmfrontend wasmnotifications webkeyboard webpanel -name '*.h' -o -name '*.cpp' | xargs clang-format -i
pnpm run lint:fix
