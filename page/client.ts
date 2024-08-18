import getCaretCoordinates from 'textarea-caret'
import { getInputElement } from './focus'

export function placePanel(dx: number, dy: number, anchorTop: number, anchorLeft: number) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const rect = input.getBoundingClientRect()
  const { top, left, height } = getCaretCoordinates(input, input?.selectionStart || 0)
  const h = height /* NaN if no line-height is set */ || Number(getComputedStyle(input).fontSize.slice(0, -'px'.length))
  const panel = <HTMLElement>document.querySelector('#fcitx-theme')
  const frame = panel.getBoundingClientRect()
  panel.style.position = 'absolute'
  panel.style.height = '0' // let mouse event pass through
  panel.style.top = `${rect.top + top - (anchorTop - frame.top) + h}px`
  panel.style.left = `${rect.left + left - (anchorLeft - frame.left)}px`
}

let preedit = ''
let preeditIndex = 0

export function setPreedit(text: string, index: number) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const { length } = preedit
  const start = input.selectionStart! - preeditIndex
  const end = preedit ? start + length : input.selectionEnd!
  input.value = input.value.slice(0, start) + text + input.value.slice(end)
  input.selectionEnd = start + index
  preedit = text
  preeditIndex = index
}

export function commit(text: string) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const { selectionStart, selectionEnd } = input
  input.value = input.value.slice(0, selectionStart!) + text + input.value.slice(selectionEnd!)
  input.selectionEnd = selectionStart! + text.length
}
