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

function changeInput(commitText: string, preeditText: string, index: number) {
/*
____ pre|edit ____
    ^        ^
  start     end

____ commit pre|edit ____
*/
  const input = getInputElement()
  if (!input) {
    return
  }
  const start = input.selectionStart! - preeditIndex
  const end = preedit ? start + preedit.length : input.selectionEnd!
  input.value = input.value.slice(0, start) + commitText + preeditText + input.value.slice(end)
  // This may be triggered by user clicking panel. Focus to ensure setting selectionEnd works.
  input.focus()
  input.selectionEnd = start + commitText.length + index
  // For vue-based input, this is needed to synchronize state.
  input.dispatchEvent(new Event('change'))
  preedit = preeditText
  preeditIndex = index
}

export function setPreedit(text: string, index: number) {
  changeInput('', text, index)
}

export function commit(text: string) {
  changeInput(text, '', 0)
}
