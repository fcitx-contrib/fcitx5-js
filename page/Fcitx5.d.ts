type Child = ({
  Description: string
  Option: string
  Type: string
  Value: string
} & ({
  Children: null
  DefaultValue: any
} | {
  Children: Child[]
}) & { [key: string]: any })

export type Config = {
  Children: Child[]
} | {
  ERROR: string
}

export interface MenuAction {
  id: number
  desc: string
  checked?: boolean
  separator?: boolean
  children?: MenuAction[]
}

export interface FCITX {
  enable: () => void
  disable: () => void
  currentInputMethod: () => string
  setCurrentInputMethod: (im: string) => void
  getInputMethods: () => { name: string, displayName: string }[]
  setInputMethods: (ims: string[]) => void
  getAllInputMethods: () => { name: string, displayName: string, languageCode: string }[]
  setStatusAreaCallback: (callback: () => void) => void
  updateStatusArea: () => void
  getConfig: (uri: string) => Config
  setConfig: (uri: string, json: object) => void
  jsKeyToFcitxString: (event: KeyboardEvent) => string
  getMenuActions: () => MenuAction[]
  activateMenuAction: (id: number) => void
}

export const fcitxReady: Promise<null>
