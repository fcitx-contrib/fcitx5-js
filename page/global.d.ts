import type { FCITX } from './Fcitx5.d.ts'

declare global {
  type WASM_TYPE = 'void' | 'bool' | 'number' | 'string'
  interface EM_MODULE {
    ccall: (name: string, retType: WASM_TYPE, argsType: WASM_TYPE[], args: any[]) => any
    onRuntimeInitialized: () => void
  }
  interface Window {
    fcitx: { [key: string]: (...args: any[]) => void } & FCITX
  }
}

export {}
