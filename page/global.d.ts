import type { FCITX, EM_MODULE as MODULE } from './Fcitx5.d.ts'

declare global {
  type WASM_TYPE = 'void' | 'bool' | 'number' | 'string'
  type EM_MODULE = MODULE
  interface Window {
    fcitx: { [key: string]: any } & FCITX
  }
}

export {}
