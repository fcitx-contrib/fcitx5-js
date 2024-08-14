declare global {
  type WASM_TYPE = 'void' | 'bool' | 'number' | 'string'
  interface Window {
    fcitx: { [key: string]: (...args: any[]) => void }
    Module: {
      ccall: (name: string, retType: WASM_TYPE, argsType: WASM_TYPE[], args: any[]) => void
      onRuntimeInitialized: () => void
    }
  }
}

export {}
