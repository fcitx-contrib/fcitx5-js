import type { AsyncCallback, SyncCallback } from './Fcitx5'
import Module from './module'

export const USR_MOUNT_POINT = '/backup/usr'
export const HOME_MOUNT_POINT = '/home/web_user'

export function lsDir(path: string) {
  const names = Module.FS.readdir(path)
  return names.filter(name => name !== '.' && name !== '..')
}

export function traverseSync(preDirCallback: SyncCallback | undefined, fileCallback: SyncCallback, postDirCallback: SyncCallback | undefined) {
  function closure(path: string) {
    const { mode } = Module.FS.lstat(path)
    if (Module.FS.isDir(mode)) {
      if (!path.endsWith('/')) {
        path += '/'
      }
      preDirCallback && preDirCallback(path)
      const names = lsDir(path)
      for (const name of names) {
        closure(path + name)
      }
      return postDirCallback && postDirCallback(path)
    }
    return fileCallback(path)
  }
  return closure
}

function trimSlash(path: string) {
  return path.replace(/\/$/, '')
}

export function rmR(path: string, star: boolean = false) {
  return traverseSync(
    undefined,
    path => globalThis.fcitx.Module.FS.unlink(path),
    (_path) => {
      if (!(star && trimSlash(path) === trimSlash(_path))) {
        globalThis.fcitx.Module.FS.rmdir(_path)
      }
    },
  )(path)
}

export function traverseAsync(preDirCallback: AsyncCallback | undefined, fileCallback: AsyncCallback, postDirCallback: AsyncCallback | undefined) {
  async function closure(path: string) {
    const { mode } = Module.FS.lstat(path)
    if (Module.FS.isDir(mode)) {
      if (!path.endsWith('/')) {
        path += '/'
      }
      preDirCallback && await preDirCallback(path)
      const names = lsDir(path)
      for (const name of names) {
        await closure(path + name)
      }
      return postDirCallback && await postDirCallback(path)
    }
    return fileCallback(path)
  }
  return closure
}

export function mount() {
  // Don't mount /usr directly as it stores unnecessary files and is too slow.
  Module.FS.mkdirTree(USR_MOUNT_POINT)
  Module.FS.mount(Module.IDBFS, { autoPersist: true }, USR_MOUNT_POINT)
  Module.FS.mount(Module.IDBFS, { autoPersist: true }, HOME_MOUNT_POINT)
}

export function sync(direction: 'load' | 'save') {
  const { promise, resolve } = Promise.withResolvers<void>()
  Module.FS.syncfs(direction === 'load', (err) => {
    if (err) {
      console.error(err)
    }
    // Before better understanding possible errors, don't break core functionalities, which don't rely on IDBFS.
    resolve()
  })
  return promise
}

export function reset() {
  rmR(USR_MOUNT_POINT, true /* Removing mounted dir gives ErrnoError 10. */)
  rmR(HOME_MOUNT_POINT, true)
  // Manually trigger syncfs to ensure data is cleared.
  return sync('save')
}
