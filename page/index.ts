import { blur, clickPanel, focus } from './focus'
import { keyEvent } from './keycode'
import { commit, placePanel, setPreedit } from './client'
import { currentInputMethod, getInputMethods, setCurrentInputMethod, setInputMethods } from './input-method'

let res: (value: any) => void

const fcitxReady = new Promise((resolve) => {
  res = resolve
})

window.fcitx = {
  createPanel(html: string) {
    const tree = document.createElement('div')
    tree.innerHTML = html
    for (const el of [...tree.children]) {
      switch (el.tagName) {
        case 'STYLE':
          document.head.append(el)
          break
        case 'DIV':
          document.body.append(el)
          break
        case 'SCRIPT':
          eval(el.textContent!) // eslint-disable-line no-eval
          break
      }
    }
  },
  placePanel,
  setPreedit,
  commit,
  setCurrentInputMethod,
  currentInputMethod,
  getInputMethods,
  setInputMethods,
  enable() {
    document.addEventListener('focus', focus, true)
    document.addEventListener('blur', blur, true)
    document.addEventListener('keydown', keyEvent)
    document.addEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.addEventListener('mousedown', clickPanel)
    focus() // there may be textarea focused before wasm initialized
  },
  disable() {
    document.removeEventListener('focus', focus, true)
    document.removeEventListener('blur', blur, true)
    document.removeEventListener('keydown', keyEvent)
    document.removeEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.removeEventListener('mousedown', clickPanel)
  },
}
const apis = [
  'log',
  'copyHTML',
  'select',
  'highlight',
  'page',
  'scroll',
  'askActions',
  'action',
  'resize',
]
for (const api of apis) {
  const name = `_${api}`
  window.fcitx[name] = (...args) => window.Module.ccall('web_action', 'void', ['string', 'string'], [name, JSON.stringify(args)])
}

window.Module = { ...window.Module, ...{
  onRuntimeInitialized() {
    res(null)
  },
} }

const script = document.createElement('script')
script.src = './Fcitx5.js'
document.body.append(script)

export {
  fcitxReady,
}
