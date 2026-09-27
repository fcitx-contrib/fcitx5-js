import { fcitxReady } from './Fcitx5.js'

const readyPromise = fcitxReady
let rimeLoaded = false

function respond(data: WorkerResponseData, requestId: number, transfer?: Transferable[]) {
  globalThis.postMessage({ ...data, requestId } satisfies WorkerResponse, transfer || [])
}

function notify(data: WorkerNotification) {
  // Notifications may be emitted after the request which initialized Rime has completed.
  // They are lifetime events, not RPC responses, so they intentionally have no requestId.
  globalThis.postMessage(data)
}

function copyDir(path: string, requestId: number) {
  return globalThis.fcitx.traverseAsync(
    (path: string) => respond({ type: 'MKDIR', data: path }, requestId),
    (path: string) => {
      const { buffer } = globalThis.fcitx.Module.FS.readFile(path)
      respond({ type: 'WRITE_FILE', data: {
        path,
        buffer: buffer as ArrayBuffer,
      } }, requestId, [buffer])
    },
    undefined,
  )(path)
}

globalThis.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  await readyPromise
  const { requestId } = data
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
        globalThis.fcitx.setNotificationCallback((name, icon, body, timeout, tipId) => {
          notify({ type: 'NOTIFY', data: { name, icon, body, timeout, tipId } })
        })
        globalThis.fcitx.enable()
        rimeLoaded = true
      }
      globalThis.fcitx.setConfig('fcitx://config/addon/rime/deploy', {})
      await copyDir('/home/web_user/.local/share/fcitx5/rime/build', requestId)
      // Release some memory.
      globalThis.fcitx.rmR('/usr/share/rime-data')
      globalThis.fcitx.rmR('/home/web_user/.local')
      break
    case 'ZIP': {
      const buffer = await globalThis.fcitx.zip(data.data)
      respond({ type: 'ZIP_BUFFER', data: buffer }, requestId, [buffer])
      break
    }
  }
  respond({ type: 'DONE' }, requestId)
}
