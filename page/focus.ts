type Input = HTMLInputElement | HTMLTextAreaElement

let input: Input | null = null

export function focus() {
  if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
    return
  }
  input = <Input>document.activeElement
  window.Module.ccall('focus_in', 'void', [], [])
}

export function blur() {
  if (!input) {
    return
  }
  input = null
  window.Module.ccall('focus_out', 'void', [], [])
}

export function getInputElement(): Input | null {
  return input
}
