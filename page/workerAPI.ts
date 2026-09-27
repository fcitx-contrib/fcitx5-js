import UZIP from 'uzip'
import { traverseAsync } from './fs'
import { reload } from './plugin'

let worker: Worker
let deployed = false
let deploying = false
let nextRequestId = 0
const pendingRequests = new Map<number, {
  resolve: (data: ArrayBuffer | undefined) => void
  zipBuffer?: ArrayBuffer
}>()

let notifyData: WorkerNotification | null = null

function notify() {
  if (!notifyData) {
    return
  }
  // @ts-expect-error hacky way to get HiddenNotifications
  const { Value } = globalThis.fcitx.getConfig('fcitx://config/addon/notifications').Children[0]
  const disabledTips = Object.values(Value)
  const { name, icon, body, timeout, tipId } = notifyData.data
  notifyData = null
  if (!disabledTips.includes(tipId)) {
    globalThis.fcitx.notify(name, icon, body, timeout, tipId)
  }
}

function ensureWorker() {
  if (worker) {
    return
  }
  worker = new Worker(globalThis.fcitx.Module.locateFile('worker.js', ''), { type: 'module' })
  worker.onmessage = ({ data }: MessageEvent<WorkerResponse | WorkerNotification>) => {
    if (data.type === 'NOTIFY') {
      notifyData = data
      // Delay success and error notification to after reload finishes.
      if (!['success', 'error'].includes(data.data.icon)) {
        notify()
      }
      return
    }
    const pending = pendingRequests.get(data.requestId)
    if (!pending) {
      return
    }
    switch (data.type) {
      case 'MKDIR':
        globalThis.fcitx.Module.FS.mkdirTree(data.data)
        break
      case 'WRITE_FILE':
        globalThis.fcitx.Module.FS.writeFile(data.data.path, new Uint8Array(data.data.buffer))
        break
      case 'ZIP_BUFFER':
        pending.zipBuffer = data.data
        break
      case 'DONE':
        pendingRequests.delete(data.requestId)
        pending.resolve(pending.zipBuffer)
        break
    }
  }
}

function execute(msg: WorkerRequestData, transfer?: Transferable[]) {
  const requestId = nextRequestId++
  const { resolve, promise } = Promise.withResolvers<ArrayBuffer | undefined>()
  pendingRequests.set(requestId, { resolve })
  worker.postMessage({ ...msg, requestId } satisfies WorkerRequest, transfer || [])
  return promise
}

async function copyFile(path: string) {
  const { buffer } = globalThis.fcitx.Module.FS.readFile(path)
  await execute({ type: 'WRITE_FILE', data: {
    path,
    buffer: buffer as ArrayBuffer,
  } }, [buffer])
}

const copyDir = traverseAsync(async (path: string) => {
  await execute({ type: 'MKDIR', data: path })
}, copyFile, undefined)

async function deploy() {
  try {
    if (!deployed) {
      for (const path of [
        '/usr/lib/fcitx5/librime.so',
        '/usr/share/fcitx5/inputmethod/rime.conf',
        '/usr/share/fcitx5/addon/rime.conf',
      ]) {
        await copyFile(path)
      }
      deployed = true
    }
    await copyDir('/usr/share/rime-data')
    await copyDir('/usr/share/locale')
    await copyDir('/home/web_user/.local/share/fcitx5/rime').catch()
    await execute({ type: 'DEPLOY' })
    reload()
    notify()
  }
  catch {}
  deploying = false
}

export function deployRimeInWorker(): 0 | 1 {
  if (!globalThis.fcitx.useWorker) { // Worker is disabled or already in worker.
    return 0 // read by EM_ASM_INT
  }
  if (!deploying) {
    deploying = true
    ensureWorker()
    deploy()
  }
  return 1
}

export async function zip(manifest: UZIP.UZIPFiles): Promise<ArrayBuffer> {
  if (!globalThis.fcitx.useWorker) {
    return UZIP.encode(manifest, true) // Disable compression for higher speed.
  }
  ensureWorker()
  const buffer = await execute({ type: 'ZIP', data: manifest }, Object.values(manifest).map(array => array.buffer))
  if (buffer === undefined) {
    throw new Error('Worker did not return a zip buffer')
  }
  return buffer
}
