export interface FCITX {
  enable: () => void
  disable: () => void
  currentInputMethod: () => string
  setCurrentInputMethod: (im: string) => void
  getInputMethods: () => { name: string, displayName: string }[]
  setInputMethods: (ims: string[]) => void
  setStatusAreaCallback: (callback: () => void) => void
  updateStatusArea: () => void
}

export const fcitxReady: Promise<null>
