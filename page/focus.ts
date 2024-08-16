type Input = HTMLInputElement | HTMLTextAreaElement

let input: Input | null = null

export function focus(event: FocusEvent) {
  if (!['INPUT', 'TEXTAREA'].includes((<HTMLElement>event.target).tagName)) {
    return
  }
  input = <Input>event.target
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
