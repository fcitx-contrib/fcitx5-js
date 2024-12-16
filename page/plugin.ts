import UZIP from 'uzip'
import { lsDir, mkdirP } from './fs'
import Module from './module'

function reload() {
  Module.ccall('reload', 'void', [], [])
}

export function installPlugin(name: string, buffer: ArrayBuffer) {
  // UZIP hangs on empty zip.
  if (buffer.byteLength < 1024) {
    throw new Error('Invalid plugin')
  }
  const manifest = UZIP.parse(buffer)
  if (!(`plugin/${name}.json` in manifest)) {
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
