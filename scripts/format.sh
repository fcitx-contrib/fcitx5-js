find src wasmfrontend wasmnotifications webpanel -name '*.h' -o -name '*.cpp' | xargs clang-format -i
pnpm run lint:fix
