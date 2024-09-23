import Module from './module'

export function getConfig(uri: string) {
  return JSON.parse(Module.ccall('get_config', 'string', ['string'], [uri]))
}

export function setConfig(uri: string, json: object) {
  return Module.ccall('set_config', 'void', ['string', 'string'], [uri, JSON.stringify(json)])
}

export function getAddons() {
  return JSON.parse(Module.ccall('get_addons', 'string', [], []))
}
