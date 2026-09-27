import type { FCITX, EM_MODULE as MODULE } from './Fcitx5.d.ts'

declare global {
  type EM_MODULE = MODULE
  var fcitx: { [key: string]: any } & FCITX // eslint-disable-line vars-on-top
  type WorkerRequestData = {
    type: 'MKDIR'
    data: string
  } | {
    type: 'WRITE_FILE'
    data: {
      path: string
      buffer: ArrayBuffer
    }
  } | {
    type: 'ZIP'
    data: Record<string, Uint8Array>
  } | {
    type: 'DEPLOY'
  }
  type WorkerResponseData = {
    type: 'MKDIR'
    data: string
  } | {
    type: 'WRITE_FILE'
    data: {
      path: string
      buffer: ArrayBuffer
    }
  } | {
    type: 'ZIP_BUFFER'
    data: ArrayBuffer
  } | {
    type: 'DONE'
  }
  interface WorkerNotification {
    type: 'NOTIFY'
    data: {
      name: string
      icon: string
      body: string
      timeout: number
      tipId: string
    }
  }
  type WorkerRequest = WorkerRequestData & { requestId: number }
  type WorkerResponse = WorkerResponseData & { requestId: number }
}

export {}
