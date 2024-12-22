import { activateMenuAction, getMenuActions } from './action'
import { commit, hidePanel, placePanel, setPreedit } from './client'
import { getAddons, getConfig, setConfig } from './config'
import { blur, clickPanel, focus } from './focus'
import { currentInputMethod, getAllInputMethods, getInputMethods, setCurrentInputMethod, setInputMethods } from './input-method'
import { jsKeyToFcitxString, keyEvent } from './keycode'
import Module from './module'
import { getInstalledPlugins, installPlugin } from './plugin'

let res: (value: any) => void

const fcitxReady = new Promise((resolve) => {
  res = resolve
})

let statusAreaCallback = () => {}

window.fcitx = {
  Module,
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
    hidePanel()
  },
  placePanel,
  hidePanel,
  setPreedit,
  commit,
  setCurrentInputMethod,
  currentInputMethod,
  getInputMethods,
  setInputMethods,
  getAllInputMethods,
  getConfig,
  setConfig,
  getAddons,
  jsKeyToFcitxString,
  getMenuActions,
  activateMenuAction,
  installPlugin,
  getInstalledPlugins,
  enable() {
    Module.ccall('init', 'void', [], [])
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
  setStatusAreaCallback(callback: () => void) {
    statusAreaCallback = callback
  },
  updateStatusArea() {
    statusAreaCallback()
  },
  followCursor: false,
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
  window.fcitx[name] = (...args: any[]) => Module.ccall('web_action', 'void', ['string', 'string'], [name, JSON.stringify(args)])
}

Module.onRuntimeInitialized = () => res(null)

export {
  fcitxReady,
}
