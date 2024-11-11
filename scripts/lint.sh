set -e

find src wasmfrontend webpanel -name '*.h' -o -name '*.cpp' | xargs clang-format -Werror --dry-run
pnpm run lint
pnpm run check
