import type { AsyncCallback, SyncCallback } from './Fcitx5'
import Module from './module'

export function lsDir(path: string) {
  const names = Module.FS.readdir(path)
  return names.filter(name => name !== '.' && name !== '..')
}

export function mkdirP(path: string) {
  const parts = path.split('/')
  let current = ''
  for (const part of parts) {
    current += `${part}/`
    try {
      Module.FS.mkdir(current)
    }
    catch {
      // Directory already exists.
    }
  }
}

function traverseSync(preDirCallback: SyncCallback | undefined, fileCallback: SyncCallback, postDirCallback: SyncCallback | undefined) {
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
