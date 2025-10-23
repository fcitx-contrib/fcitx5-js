import type { AsyncCallback, SyncCallback } from './Fcitx5'
import Module from './module'

export const USR_MOUNT_POINT = '/backup/usr'
export const HOME_MOUNT_POINT = '/home/web_user'

export function lsDir(path: string) {
  const names = Module.FS.readdir(path)
  return names.filter(name => name !== '.' && name !== '..')
}

export function traverseSync(preDirCallback: SyncCallback | undefined, fileCallback: SyncCallback, postDirCallback: SyncCallback | undefined) {
  async function closure(path: string) {
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

export const rmR = traverseSync(
  undefined,
  path => globalThis.fcitx.Module.FS.unlink(path),
  path => globalThis.fcitx.Module.FS.rmdir(path),
)

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

export function reset() {
  const { promise, resolve } = Promise.withResolvers<void>()
  rmR(USR_MOUNT_POINT)
  rmR(HOME_MOUNT_POINT)
  // Manually trigger syncfs to ensure data is cleared.
  Module.FS.syncfs(false, () => resolve())
  return promise
}
