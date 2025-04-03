import type { FCITX, EM_MODULE as MODULE } from './Fcitx5.d.ts'

declare global {
  type EM_MODULE = MODULE
  var fcitx: { [key: string]: any } & FCITX // eslint-disable-line vars-on-top,no-var
  type MessageData = {
    type: 'MKDIR'
    data: string
  } | {
    type: 'WRITE_FILE'
    data: {
      path: string
      buffer: ArrayBuffer
    }
  } | {
    type: 'NOTIFY'
    data: {
      name: string
      icon: string
      body: string
      timeout: number
    }
  } | {
    type: 'DEPLOY'
  } | {
    type: 'DONE'
  }
}

export {}
