import type { NotificationCallback } from './Fcitx5'
import { activateMenuAction, getMenuActions } from './action'
import { commit, hidePanel, placePanel, setPreedit } from './client'
import { getAddons, getConfig, setConfig } from './config'
import { blur, clickPanel, focus } from './focus'
import { mkdirP, rmR, traverseAsync } from './fs'
import { currentInputMethod, getAllInputMethods, getInputMethods, setCurrentInputMethod, setInputMethods } from './input-method'
import { jsKeyToFcitxString, keyEvent } from './keycode'
import { getLocale } from './locale'
import Module from './module'
import { getInstalledPlugins, installPlugin, unzip } from './plugin'
import { deployRimeInWorker } from './workerAPI'

let res: (value: any) => void

const fcitxReady = new Promise((resolve) => {
  res = resolve
})

let inputMethodsCallback = () => {}
let statusAreaCallback = () => {}
let notificationCallback: NotificationCallback = () => {}

globalThis.fcitx = {
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
  unzip,
  enable() {
    Module.ccall('init', 'void', ['string', 'bool'], [getLocale(), globalThis.fcitx.isWorker])
    if (globalThis.fcitx.isWorker) {
      return
    }
    document.addEventListener('focus', focus, true)
    document.addEventListener('blur', blur, true)
    document.addEventListener('keydown', keyEvent)
    document.addEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.addEventListener('mousedown', clickPanel)
    focus() // there may be textarea focused before wasm initialized
  },
  disable() {
    if (globalThis.fcitx.isWorker) {
      return
    }
    document.removeEventListener('focus', focus, true)
    document.removeEventListener('blur', blur, true)
    document.removeEventListener('keydown', keyEvent)
    document.removeEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.removeEventListener('mousedown', clickPanel)
  },
  setInputMethodsCallback(callback: () => void) {
    inputMethodsCallback = callback
  },
  updateInputMethods() {
    inputMethodsCallback()
  },
  setStatusAreaCallback(callback: () => void) {
    statusAreaCallback = callback
  },
  updateStatusArea() {
    statusAreaCallback()
  },
  setNotificationCallback(callback: NotificationCallback) {
    notificationCallback = callback
  },
  notify(name: string, icon: string, body: string, timeout: number) {
    notificationCallback(name, icon, body, timeout)
  },
  mkdirP,
  rmR,
  traverseAsync,
  deployRimeInWorker,
  // Private field that indicates whether spawn a worker in current environment.
  // On f5o main thread set true to enable worker. On worker thread this is always false.
  useWorker: false,
  // @ts-expect-error uncertain environment
  isWorker: typeof globalThis.WorkerGlobalScope !== 'undefined',
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
  globalThis.fcitx[name] = (...args: any[]) => Module.ccall('web_action', 'void', ['string', 'string'], [name, JSON.stringify(args)])
}

Module.onRuntimeInitialized = () => res(null)

export {
  fcitxReady,
}
