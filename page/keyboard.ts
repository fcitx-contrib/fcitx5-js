import { setBuiltInLayout, setClient } from 'fcitx5-keyboard-web'
import { clickPanelOrKeyboard, getInputElement } from './focus'
import { processKey } from './keycode'

let keyboardShown = false
const keyboardId = 'fcitx-virtual-keyboard'
const hiddenBottom = 'max(calc(-200vw / 3), -50vh)'

export const hasTouch = /iPad|iPhone|iPod|Android/.test(navigator.userAgent)

function updateInput(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('change'))
}

function simulate(key: string, code: string) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const cursor = input.selectionStart!
  const preText = input.value.slice(0, cursor)
  const postText = input.value.slice(cursor)
  if (key) {
    updateInput(input, preText + key + postText)
    return
  }
  switch (code) {
    case 'Backspace':
      updateInput(input, preText.slice(0, cursor - 1) + postText)
      break
  }
}

export function createKeyboard() {
  if (document.getElementById(keyboardId)) {
    return
  }
  const keyboard = document.createElement('div')
  keyboard.id = keyboardId
  keyboard.style.zIndex = '2147483647'
  keyboard.style.backgroundColor = '#e3e4e6'
  keyboard.style.width = '100vw'
  keyboard.style.height = 'min(calc(200vw / 3), 50vh)'
  keyboard.style.bottom = hiddenBottom
  keyboard.style.position = 'fixed'
  keyboard.style.transition = 'bottom 0.5s'
  keyboard.addEventListener('touchstart', clickPanelOrKeyboard)
  document.body.appendChild(keyboard)
  setClient({
    sendEvent(event) {
      switch (event.type) {
        case 'COMMIT':
          simulate(event.data, '')
          break
        case 'KEY_DOWN':
        case 'KEY_UP':
          if (!processKey(event.data.key, event.data.code, 0, event.type === 'KEY_UP')) {
            simulate(event.data.key, event.data.code)
          }
          break
      }
    },
  })
}

export function showKeyboard() {
  if (keyboardShown) {
    return
  }
  keyboardShown = true
  const keyboard = document.getElementById(keyboardId)!
  setBuiltInLayout(keyboardId, 'qwerty')
  keyboard.style.bottom = '0'
}

export function hideKeyboard() {
  if (!keyboardShown) {
    return
  }
  keyboardShown = false
  const keyboard = document.getElementById(keyboardId)!
  keyboard.style.bottom = hiddenBottom
}
