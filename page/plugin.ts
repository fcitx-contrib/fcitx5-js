import UZIP from 'uzip'
import { lsDir, mkdirP } from './fs'
import { hasTouch } from './keyboard'
import { getLocale } from './locale'
import Module from './module'

export function reload() {
  Module.ccall('reload', 'void', ['string', 'bool'], [getLocale(), hasTouch])
}

const textDecoder = new TextDecoder()

function addDefaultIMs(byteArray: Uint8Array) {
  const inputMethods = (JSON.parse(textDecoder.decode(byteArray)).input_methods ?? []) as string[]
  const currentInputMethods = window.fcitx.getInputMethods().map(im => im.name)
  window.fcitx.setInputMethods([...currentInputMethods, ...inputMethods.filter(im => !currentInputMethods.includes(im))])
}

function distributeFiles(manifest: UZIP.UZIPFiles, dir: string) {
  Object.entries(manifest).forEach(([path, data]) => {
    const absolutePath = `${dir}/${path}`
    if (path.endsWith('/')) {
      mkdirP(absolutePath)
    }
    else {
      Module.FS.writeFile(absolutePath, data)
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
  const names = Object.keys(manifest).map(path => (path.match(/^plugin\/(\S+)\.json$/) ?? { 1: undefined })[1]).filter(name => name !== undefined)
  if (names.length !== 1) {
    throw new Error('Invalid plugin')
  }
  const name = names[0] as string
  const byteArray = manifest[`plugin/${name}.json`]
  if (!byteArray) {
    throw new Error('Invalid plugin')
  }
  distributeFiles(manifest, '/usr')
  reload()
  addDefaultIMs(byteArray)
  return name
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
