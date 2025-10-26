import UZIP from 'uzip'
import { hasTouch } from './context'
import { lsDir, traverseSync, USR_MOUNT_POINT } from './fs'
import { getLocale } from './locale'
import Module from './module'

export function reload() {
  Module.ccall('reload', 'void', ['string', 'number', 'bool'], [getLocale(), globalThis.fcitx.runtime, hasTouch])
}

const textDecoder = new TextDecoder()

function addDefaultIMs(byteArray: Uint8Array) {
  const inputMethods = (JSON.parse(textDecoder.decode(byteArray)).input_methods ?? []) as string[]
  const currentInputMethods = globalThis.fcitx.getInputMethods().map(im => im.name)
  globalThis.fcitx.setInputMethods([...currentInputMethods, ...inputMethods.filter(im => !currentInputMethods.includes(im))])
}

function distributeFiles(manifest: UZIP.UZIPFiles, dir: string) {
  Object.entries(manifest).forEach(([path, data]) => {
    const absolutePath = `${dir}/${path}`
    if (path.endsWith('/')) {
      Module.FS.mkdirTree(absolutePath)
    }
    else {
      Module.FS.writeFile(absolutePath, data)
    }
  })
}

function symlink(manifest: UZIP.UZIPFiles) {
  Object.entries(manifest).forEach(([path]) => {
    const absolutePath = `/usr/${path}`
    if (path.endsWith('/')) {
      Module.FS.mkdirTree(absolutePath)
    }
    else {
      try {
        Module.FS.symlink(`${USR_MOUNT_POINT}/${path}`, absolutePath)
      }
      catch {}
    }
  })
}

export function unzip(buffer: ArrayBuffer, dir: string) {
  // UZIP hangs on empty zip.
  if (!buffer.byteLength) {
    return
  }
  const manifest = UZIP.parse(buffer)
  distributeFiles(manifest, dir)
}

// Like unzip, but do some sanity checks for plugins.
export function installPlugin(buffer: ArrayBuffer) {
  if (buffer.byteLength < 1024) {
    throw new Error('Invalid plugin')
  }
  const manifest = UZIP.parse(buffer)
  const names = Object.keys(manifest).flatMap(path => (path.match(/^plugin\/(\S+)\.json$/) ?? { 1: [] })[1])
  if (names.length !== 1) {
    throw new Error('Invalid plugin')
  }
  const name = names[0] as string
  const byteArray = manifest[`plugin/${name}.json`]
  if (!byteArray) {
    throw new Error('Invalid plugin')
  }
  // Extract plugin to /backup/usr so that they are stored in IDBFS.
  distributeFiles(manifest, USR_MOUNT_POINT)
  // Symlink one plugin's files to /usr.
  symlink(manifest)
  reload()
  addDefaultIMs(byteArray)
  return name
}

// Symlink all plugins' files from /backup/usr to /usr.
export function restorePlugins() {
  traverseSync((backupPath) => {
    const path = `/usr${backupPath.slice(USR_MOUNT_POINT.length)}`
    Module.FS.mkdirTree(path)
  }, (backupPath) => {
    const path = `/usr${backupPath.slice(USR_MOUNT_POINT.length)}`
    try {
      Module.FS.symlink(backupPath, path)
    }
    catch {}
  }, undefined)(USR_MOUNT_POINT)
}

export function getInstalledPlugins() {
  try {
    const files = lsDir('/usr/plugin')
    return files.filter(file => file.endsWith('.json')).map(file => file.slice(0, -5))
  }
  catch {
    return []
  }
}
