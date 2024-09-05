import Module from './module'
import { resetPreedit } from './client'

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
  Module.ccall('focus_in', 'void', [], [])
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
  Module.ccall('focus_out', 'void', [], [])
  resetPreedit()
}

export function getInputElement(): Input | null {
  return input
}
