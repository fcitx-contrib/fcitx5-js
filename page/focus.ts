type Input = HTMLInputElement | HTMLTextAreaElement

let input: Input | null = null
let userClick = false

export function clickPanel() {
  userClick = true
}

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
  // Don't call focus_out if user clicks panel.
  if (userClick) {
    userClick = false
    return
  }
  input = null
  window.Module.ccall('focus_out', 'void', [], [])
}

export function getInputElement(): Input | null {
  return input
}
