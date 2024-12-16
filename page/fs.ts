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
