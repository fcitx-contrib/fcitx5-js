import getCaretCoordinates from 'textarea-caret'
import { getFontSize, UNDERLINE_OFFSET_RATIO } from './caret'
import { getInputElement, setSpellCheck } from './focus'
import { onTextChange } from './undoRedo'
import { utf8Index2JS } from './unicode'

let x = 0
let y = 0

let preedit = ''
let preeditIndex = 0

// compared with macOS pinyin
const CANDIDATE_WINDOW_OFFSET = 6

export function placePanel(dx: number, dy: number, anchorTop: number, anchorLeft: number, dragging: boolean) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const rect = input.getBoundingClientRect()
  const { top, left, height } = getCaretCoordinates(input, input.selectionStart! - (window.fcitx.followCaret ? 0 : preeditIndex))
  const h = height /* NaN if no line-height is set */ || getFontSize(input) + CANDIDATE_WINDOW_OFFSET
  const panel = <HTMLElement>document.querySelector('#fcitx-theme')
  const frame = panel.getBoundingClientRect()
  panel.style.opacity = '1'
  panel.style.position = 'absolute'
  panel.style.height = '0' // let mouse event pass through
  panel.style.zIndex = '2147483647' // absolutely above preedit underline
  if (dragging) {
    x += dx
    y += dy
  }
  else {
    x = rect.left + left - (anchorLeft - frame.left)
    y = rect.top + top - (anchorTop - frame.top) + h
  }
  panel.style.top = `${y}px`
  panel.style.left = `${x}px`
}

export function hidePanel() {
  x = y = 0
  const panel = <HTMLElement>document.querySelector('#fcitx-theme')
  panel.style.opacity = '0'
}

function clearPreeditUnderline() {
  document.querySelectorAll('.fcitx-preedit-underline').forEach(div => div.remove())
}

function drawUnderline(box: DOMRect, top: number, left: number, width: number, color: string) {
  if (top < 0 || top > box.height) {
    return
  }
  const l = Math.max(left, 0)
  const r = Math.min(left + width, box.width)
  if (r - l < 1) {
    return
  }
  const div = document.createElement('div')
  div.className = 'fcitx-preedit-underline'
  div.style.position = 'fixed'
  div.style.top = `${box.top + top}px`
  div.style.left = `${box.left + l}px`
  div.style.height = '1px'
  div.style.width = `${r - l}px`
  div.style.backgroundColor = color
  document.body.appendChild(div)
}

function getTextWidth(input: HTMLElement, text: string) {
  const div = document.createElement('div')
  const style = getComputedStyle(input)
  div.style.position = 'absolute'
  div.style.opacity = '0'
  div.style.font = style.font
  div.textContent = text
  document.body.append(div)
  const { width } = div.getBoundingClientRect()
  div.remove()
  return width
}

function drawPreeditUnderline(input: HTMLElement, start: number) {
  const box = input.getBoundingClientRect()
  const color = getComputedStyle(input).color
  const fontSize = getFontSize(input)
  const { top: startTop, left: startLeft } = getCaretCoordinates(input, start)
  const { top: endTop, left: endLeft } = getCaretCoordinates(input, start + preedit.length)
  let lastLeft = startLeft
  for (let i = 1, rowLeft = startLeft, rowTop = startTop; i <= preedit.length && rowTop < endTop; ++i) {
    const { top, left } = getCaretCoordinates(input, start + i)
    if (top !== rowTop) {
      // getCaretCoordinates can't tell the position of the end of previous line,
      // because it's equivalent to the start of next line, which is the actual place
      // that new character is written. So we need to calculate width of the last character.
      drawUnderline(box, rowTop - input.scrollTop + fontSize * (1 + UNDERLINE_OFFSET_RATIO), rowLeft - input.scrollLeft, lastLeft - rowLeft + getTextWidth(input, preedit[i - 1]), color)
      rowTop = top
      rowLeft = left
    }
    lastLeft = left
  }
  if (lastLeft !== endLeft) {
    drawUnderline(box, endTop - input.scrollTop + fontSize * (1 + UNDERLINE_OFFSET_RATIO), lastLeft - input.scrollLeft, endLeft - lastLeft, color)
  }
}

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

  const i = utf8Index2JS(preeditText, index)
  const start = input.selectionStart! - preeditIndex
  const end = preedit ? start + preedit.length : input.selectionEnd!
  const newStart = start + commitText.length
  input.value = input.value.slice(0, start) + commitText + preeditText + input.value.slice(end)
  input.selectionStart = input.selectionEnd = newStart + i
  // For vue-based input, this is needed to synchronize state.
  input.dispatchEvent(new Event('change'))
  preedit = preeditText
  preeditIndex = i
  setSpellCheck(!preedit)
  clearPreeditUnderline()
  if (preedit) {
    drawPreeditUnderline(input, newStart)
  }
  else {
    onTextChange(input.value)
  }
}

export function setPreedit(text: string, index: number) {
  if (!preedit && !text) {
    // Don't execute changeInput for a common scene: commit (which already clears preedit) and clear preedit.
    return
  }
  changeInput('', text, index)
}

export function commit(text: string) {
  changeInput(text, '', 0)
}

export function resetPreedit() {
  preedit = ''
  preeditIndex = 0
  clearPreeditUnderline()
}

export function redrawPreeditUnderline() {
  if (!preedit) {
    return
  }
  const input = getInputElement()
  if (!input) {
    return
  }
  clearPreeditUnderline()
  drawPreeditUnderline(input, input.selectionStart! - preeditIndex)
}

export function hasPreedit() {
  return !!preedit
}
