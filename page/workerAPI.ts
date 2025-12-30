import { traverseAsync } from './fs'
import { reload } from './plugin'

let worker: Worker
let deployed = false
let deploying = false
let res: (data: MessageData) => void

function ensureWorker() {
  if (worker) {
    return
  }
  worker = new Worker(globalThis.fcitx.Module.locateFile('worker.js'), { type: 'module' })
  worker.onmessage = ({ data }: MessageEvent<MessageData>) => {
    switch (data.type) {
      case 'MKDIR':
        globalThis.fcitx.Module.FS.mkdirTree(data.data)
        break
      case 'WRITE_FILE':
        globalThis.fcitx.Module.FS.writeFile(data.data.path, new Uint8Array(data.data.buffer))
        break
      case 'NOTIFY': {
        const { name, icon, body, timeout } = data.data
        globalThis.fcitx.notify(name, icon, body, timeout)
        break
      }
      case 'DONE':
        res(data)
        break
    }
  }
}

function execute(msg: MessageData, transfer?: Transferable[]) {
  worker.postMessage(msg, transfer || [])
  const { resolve, promise } = Promise.withResolvers<any>()
  res = resolve
  return promise
}

function copyFile(path: string) {
  const { buffer } = globalThis.fcitx.Module.FS.readFile(path)
  return execute({ type: 'WRITE_FILE', data: {
    path,
    buffer: buffer as ArrayBuffer,
  } }, [buffer])
}

const copyDir = traverseAsync((path: string) => execute({ type: 'MKDIR', data: path }), copyFile, undefined)

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
