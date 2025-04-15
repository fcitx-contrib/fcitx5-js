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

interface AddonCategory {
  addons: {
    comment: string
    id: string
    name: string
  }[]
  id: number
  name: string
}

interface FS {
  isDir: (mode: number) => boolean
  lstat: (path: string) => { mode: number }
  mkdir: (path: string) => void
  readFile: (path: string) => Uint8Array
  readdir: (path: string) => string[]
  rmdir: (path: string) => void
  unlink: (path: string) => void
  writeFile: (path: string, data: Uint8Array) => void
}

type WASM_TYPE = 'void' | 'bool' | 'number' | 'string'

export interface EM_MODULE {
  ccall: (name: string, retType: WASM_TYPE, argsType: WASM_TYPE[], args: any[]) => any
  locateFile: (file: string) => string
  onRuntimeInitialized: () => void
  FS: FS
}

export type SyncCallback = (path: string) => void
export type AsyncCallback = (path: string) => Promise<void> | void
export type NotificationCallback = (name: string, icon: string, body: string, timeout: number) => void

export interface FCITX {
  enable: () => void
  disable: () => void
  currentInputMethod: () => string
  setCurrentInputMethod: (im: string) => void
  getInputMethods: () => { name: string, displayName: string }[]
  setInputMethods: (ims: string[]) => void
  getAllInputMethods: () => { name: string, displayName: string, languageCode: string }[]
  setInputMethodsCallback: (callback: () => void) => void
  updateInputMethods: () => void
  setStatusAreaCallback: (callback: () => void) => void
  updateStatusArea: () => void
  getConfig: (uri: string) => Config
  setConfig: (uri: string, json: object) => void
  getAddons: () => AddonCategory[]
  jsKeyToFcitxString: (event: KeyboardEvent) => string
  getMenuActions: () => MenuAction[]
  activateMenuAction: (id: number) => void
  installPlugin: (buffer: ArrayBuffer) => string
  getInstalledPlugins: () => string[]
  unzip: (buffer: ArrayBuffer, dir: string) => void
  mkdirP: (path: string) => void
  rmR: (path: string) => void
  traverseAsync: (preDirCallback: AsyncCallback | undefined, fileCallback: AsyncCallback, postDirCallback: AsyncCallback | undefined) => (path: string) => Promise<void>
  setNotificationCallback: (callback: NotificationCallback) => void
  notify: NotificationCallback
  Module: EM_MODULE
}

export const fcitxReady: Promise<null>
