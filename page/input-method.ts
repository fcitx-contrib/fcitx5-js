import Module from './module'

export function setCurrentInputMethod(im: string) {
  return Module.ccall('set_current_input_method', 'void', ['string'], [im])
}

export function currentInputMethod() {
  return Module.ccall('current_input_method', 'string', [], [])
}

export function getInputMethods() {
  return JSON.parse(Module.ccall('get_input_methods', 'string', [], []))
}

export function setInputMethods(ims: string[]) {
  return Module.ccall('set_input_methods', 'void', ['string'], [JSON.stringify(ims)])
}
