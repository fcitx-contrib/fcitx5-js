declare global {
  type WASM_TYPE = 'void' | 'bool' | 'number' | 'string'
  interface EM_MODULE {
    ccall: (name: string, retType: WASM_TYPE, argsType: WASM_TYPE[], args: any[]) => any
    onRuntimeInitialized: () => void
  }
  interface Window {
    fcitx: { [key: string]: (...args: any[]) => void }
  }
}

export {}
