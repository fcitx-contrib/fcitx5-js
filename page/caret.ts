import getCaretCoordinates from 'textarea-caret'
import { isFirefox } from './context'

// Compared with macOS pinyin on font-size: 14px.
export const UNDERLINE_OFFSET_RATIO = 1 / 6

export function getFontSize(element: HTMLElement) {
  return Number.parseFloat(getComputedStyle(element).fontSize)
}

let timer: number | null = null
let show = false

export function removeCaret() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
  document.querySelectorAll('.fcitx-mobile-caret').forEach(div => div.remove())
}

export function redrawCaret(event: { target: EventTarget | null }) {
  if (isFirefox) {
    return // Firefox draws caret even when readonly true.
  }
  removeCaret()
  const input = event.target as HTMLInputElement | HTMLTextAreaElement | null
  if (!input) {
    return
  }
  const box = input.getBoundingClientRect()
  const caret = input.selectionDirection === 'backward' ? input.selectionStart! : input.selectionEnd!
  const { top, left } = getCaretCoordinates(input, caret)
  const offsetX = left - input.scrollLeft
  const offsetY = top - input.scrollTop
  if (offsetX < 0 || offsetX > box.width) {
    return
  }
  const caretHeight = getFontSize(input) * (1 + UNDERLINE_OFFSET_RATIO)
  const t = Math.max(offsetY, 0)
  const b = Math.min(offsetY + caretHeight, box.height)
  if (b - t < 1) {
    return
  }
  const { caretColor } = getComputedStyle(input)
  const div = document.createElement('div')
  div.classList.add('fcitx-mobile-caret')
  div.style.position = 'fixed'
  div.style.top = `${box.top + t}px`
  div.style.left = `${box.left + offsetX}px`
  div.style.height = `${b - t}px`
  div.style.width = '1px'
  div.style.backgroundColor = caretColor
  document.body.appendChild(div)
  show = true
  timer = window.setInterval(() => {
    show = !show
    div.style.opacity = show ? '1' : '0'
  }, 500)
}
