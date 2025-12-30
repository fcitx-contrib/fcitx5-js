import { fcitxReady } from './Fcitx5.js'

const readyPromise = fcitxReady
let rimeLoaded = false

function respond(data: MessageData, transfer?: Transferable[]) {
  globalThis.postMessage(data, transfer || [])
}

const copyDir = globalThis.fcitx.traverseAsync(
  (path: string) => respond({ type: 'MKDIR', data: path }),
  (path: string) => {
    const { buffer } = globalThis.fcitx.Module.FS.readFile(path)
    respond({ type: 'WRITE_FILE', data: {
      path,
      buffer: buffer as ArrayBuffer,
    } }, [buffer])
  },
  undefined,
)

globalThis.onmessage = async ({ data }: MessageEvent<MessageData>) => {
  await readyPromise
  switch (data.type) {
    case 'MKDIR':
      globalThis.fcitx.Module.FS.mkdirTree(data.data)
      break
    case 'WRITE_FILE':
      globalThis.fcitx.Module.FS.mkdirTree(data.data.path.slice(0, data.data.path.lastIndexOf('/')))
      globalThis.fcitx.Module.FS.writeFile(data.data.path, new Uint8Array(data.data.buffer))
      break
    case 'DEPLOY':
      if (!rimeLoaded) {
        globalThis.fcitx.setNotificationCallback((name, icon, body, timeout) => {
          respond({ type: 'NOTIFY', data: { name, icon, body, timeout } })
        })
        globalThis.fcitx.enable()
        rimeLoaded = true
      }
      globalThis.fcitx.setConfig('fcitx://config/addon/rime/deploy', {})
      await copyDir('/home/web_user/.local/share/fcitx5/rime/build')
      // Release some memory.
      globalThis.fcitx.rmR('/usr/share/rime-data')
      globalThis.fcitx.rmR('/home/web_user/.local')
      break
  }
  respond({ type: 'DONE' })
}
