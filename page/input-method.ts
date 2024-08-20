export function setCurrentInputMethod(im: string) {
  return window.Module.ccall('set_current_input_method', 'void', ['string'], [im])
}

export function currentInputMethod() {
  return window.Module.ccall('current_input_method', 'string', [], [])
}

export function getInputMethods() {
  return JSON.parse(window.Module.ccall('get_input_methods', 'string', [], []))
}

export function setInputMethods(ims: string[]) {
  return window.Module.ccall('set_input_methods', 'void', ['string'], [JSON.stringify(ims)])
}
