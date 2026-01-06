import type { NotificationCallback } from './Fcitx5'
import type { Input } from './focus'
import UZIP from 'uzip'
import { activateMenuAction, getMenuActions } from './action'
import { commit, hidePanel, placePanel, setPreedit } from './client'
import { getAddons, getConfig, setConfig } from './config'
import { OPTIONS, SERVICE_WORKER, WEB, WEB_WORKER } from './constant'
import { hasTouch, isFirefox } from './context'
import { blur, clickPanel, focus, isInputElement, redrawCaretAndPreeditUnderline } from './focus'
import { mount, reset, rmR, traverseAsync, traverseSync } from './fs'
import { currentInputMethod, getAllInputMethods, getInputMethods, getLanguageName, setCurrentInputMethod, setInputMethods } from './input-method'
import { createKeyboard, sendEventToKeyboard } from './keyboard'
import { jsKeyToFcitxString, keyEvent } from './keycode'
import { getLocale } from './locale'
import Module from './module'
import { getInstalledPlugins, installPlugin, reload, restorePlugins, unzip } from './plugin'
import { selectionChange } from './primary-selection'
import { utf8Index2JS } from './unicode'
import { deployRimeInWorker, zip } from './workerAPI'

const { promise: fcitxReady, resolve } = Promise.withResolvers()

let inputMethodsCallback = () => {}
let statusAreaCallback = () => {}
let notificationCallback: NotificationCallback = () => {}

function getRuntime() {
  // @ts-expect-error uncertain environment
  if (typeof globalThis.ServiceWorkerGlobalScope !== 'undefined') {
    return SERVICE_WORKER
  }
  if (globalThis.location.protocol.includes('extension')) {
    return OPTIONS
  }
  // @ts-expect-error uncertain environment
  if (typeof globalThis.WorkerGlobalScope !== 'undefined') {
    return WEB_WORKER
  }
  return WEB
}

globalThis.fcitx = {
  Module,
  UZIP,
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
    if (isFirefox) {
      // Firefox doesn't support assigning numeric scrollbar width. Event the thinnest scrollbar
      // pushes the 6th candidate to next row. Set it none to mitigate.
      (document.querySelector('.fcitx-hoverables') as HTMLElement).style.scrollbarWidth = 'none'
    }
    hidePanel()
  },
  placePanel,
  hidePanel,
  setPreedit,
  commit,
  sendEventToKeyboard,
  getLanguageName,
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
  utf8Index2JS,
  enable() {
    // Don't create keyboard for desktop, otherwise it may jump out when widening window.
    if (globalThis.fcitx.runtime === WEB && hasTouch) {
      createKeyboard() // Must be called before init as webkeyboard will manipulate DOM.
    }
    Module.ccall('init', 'void', ['string', 'number', 'bool'], [getLocale(), globalThis.fcitx.runtime, hasTouch])
    if (globalThis.fcitx.runtime !== WEB) {
      return { keyEvent }
    }
    document.addEventListener('focus', focus, true)
    document.addEventListener('blur', blur, true)
    document.addEventListener('keydown', keyEvent)
    document.addEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.addEventListener('mousedown', clickPanel)
    document.addEventListener('scroll', redrawCaretAndPreeditUnderline, true)
    document.addEventListener('selectionchange', selectionChange)
    // selectionChange() // Capture initial selection.
    if (hasTouch) {
      // This is destructive. I tried listening on touchstart of input elements, but system keyboard still shows
      // up because on iOS if you touch body that nears an input element, it's still focused before set readonly.
      document.querySelectorAll('input, textarea').forEach((el) => {
        (<Input>el).readOnly = true
      })
      const activeElement = document.activeElement as HTMLElement | null
      if (isInputElement(activeElement)) {
        // Collapse system keyboard and expand fcitx keyboard.
        activeElement.blur()
        setTimeout(() => activeElement.focus(), 0)
      }
    }
    else {
      focus() // there may be textarea focused before wasm initialized
    }
  },
  disable() {
    if (globalThis.fcitx.runtime !== WEB) {
      return
    }
    document.removeEventListener('focus', focus, true)
    document.removeEventListener('blur', blur, true)
    document.removeEventListener('keydown', keyEvent)
    document.removeEventListener('keyup', keyEvent)
    document.querySelector('.fcitx-decoration')?.removeEventListener('mousedown', clickPanel)
    document.removeEventListener('scroll', redrawCaretAndPreeditUnderline, true)
    document.removeEventListener('selectionchange', selectionChange)
    if (hasTouch) {
      // Not ideal, but 🤷‍♂️
      document.querySelectorAll('input, textarea').forEach((el) => {
        (<Input>el).readOnly = false
      })
    }
  },
  setInputMethodsCallback(callback: () => void) {
    inputMethodsCallback = callback
  },
  updateInputMethods() {
    inputMethodsCallback()
    if (globalThis.fcitx.runtime === WEB) {
      sendEventToKeyboard(JSON.stringify({ type: 'INPUT_METHODS', data: {
        currentInputMethod: globalThis.fcitx.currentInputMethod(),
        inputMethods: globalThis.fcitx.getInputMethods(),
      } }))
    }
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
  rmR,
  traverseAsync,
  traverseSync,
  deployRimeInWorker,
  reload,
  reset,
  zip,
  // Private field that indicates whether spawn a worker in current environment.
  // On f5o main thread set true to enable worker. On worker thread this is always false.
  useWorker: false,
  runtime: getRuntime(),
  followCaret: false,
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

Module.onRuntimeInitialized = () => {
  mount()
  restorePlugins().then(resolve)
}

export {
  fcitxReady,
}
