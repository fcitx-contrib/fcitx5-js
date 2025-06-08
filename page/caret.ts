import getCaretCoordinates from 'textarea-caret'

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
  }
  document.querySelectorAll('.fcitx-mobile-caret').forEach(div => div.remove())
}

export function redrawCaret(event: { target: EventTarget | null }) {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement
  const color = getComputedStyle(input).caretColor
  const box = input.getBoundingClientRect()
  const { top, left } = getCaretCoordinates(input, input.selectionStart!)
  const caretHeight = getFontSize(input) * (1 + UNDERLINE_OFFSET_RATIO)
  removeCaret()
  const div = document.createElement('div')
  div.classList.add('fcitx-mobile-caret')
  div.style.position = 'absolute'
  div.style.top = `${box.top + top}px`
  div.style.left = `${box.left + left}px`
  div.style.height = `${caretHeight}px`
  div.style.width = '1px'
  div.style.backgroundColor = color
  document.body.appendChild(div)
  show = true
  timer = window.setInterval(() => {
    show = !show
    div.style.opacity = show ? '1' : '0'
  }, 500)
}
