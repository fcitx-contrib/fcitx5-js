import UZIP from 'uzip'
import { lsDir, mkdirP } from './fs'
import Module from './module'

function reload() {
  Module.ccall('reload', 'void', [], [])
}

const textDecoder = new TextDecoder()

function addDefaultIMs(byteArray: Uint8Array) {
  const inputMethods = (JSON.parse(textDecoder.decode(byteArray)).input_methods ?? []) as string[]
  const currentInputMethods = window.fcitx.getInputMethods().map(im => im.name)
  window.fcitx.setInputMethods([...currentInputMethods, ...inputMethods.filter(im => !currentInputMethods.includes(im))])
}

export function installPlugin(buffer: ArrayBuffer) {
  // UZIP hangs on empty zip.
  if (buffer.byteLength < 1024) {
    throw new Error('Invalid plugin')
  }
  const manifest = UZIP.parse(buffer)
  const names = Object.keys(manifest).map(path => (path.match(/^plugin\/(\S+)\.json$/) ?? { 1: undefined })[1]).filter(name => name !== undefined)
  if (names.length !== 1) {
    throw new Error('Invalid plugin')
  }
  const name = names[0]
  const byteArray = manifest[`plugin/${name}.json`]
  if (!byteArray) {
    throw new Error('Invalid plugin')
  }
  Object.entries(manifest).forEach(([path, data]) => {
    const absolutePath = `/usr/${path}`
    if (path.endsWith('/')) {
      mkdirP(absolutePath)
    }
    else {
      Module.FS.writeFile(absolutePath, data)
    }
  })
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
