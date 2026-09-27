import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface RecordedFcitxCall {
  name: string
  args: unknown[]
  result: unknown
}

export async function init(page: Page) {
  await page.goto('http://localhost:9000')
  return page.evaluate(() => {
    return window.fcitxReady
  })
}

export function installResizeObserverProbe(page: Page) {
  return page.addInitScript(() => {
    const probe = { observed: 0, unobserved: 0 }
    ;(window as any).__resizeObserverProbe = probe
    window.ResizeObserver = class {
      observe() {
        probe.observed++
      }

      unobserve() {
        probe.unobserved++
      }

      disconnect() {}
    } as unknown as typeof ResizeObserver
  })
}

export function recordFcitxCalls(page: Page) {
  return page.evaluate(() => {
    const recordedNames = new Set([
      'create_input_context',
      'destroy_input_context',
      'focus_in',
      'focus_out',
      'init',
      'process_key',
      'reset_input',
      'set_surrounding_text',
      'trigger_unicode',
    ])
    const calls: RecordedFcitxCall[] = []
    const original = fcitx.Module.ccall
    fcitx.__recordedCalls = calls
    fcitx.Module.ccall = ((...args: Parameters<typeof original>) => {
      const result = original(...args)
      if (recordedNames.has(args[0])) {
        calls.push({
          name: args[0],
          args: [...((args[3] as unknown[] | undefined) ?? [])],
          result,
        })
      }
      return result
    }) as typeof original
  })
}

export function recordedFcitxCalls(page: Page): Promise<RecordedFcitxCall[]> {
  return page.evaluate(() => fcitx.__recordedCalls)
}

export function resizeObserverProbe(page: Page): Promise<{ observed: number, unobserved: number }> {
  return page.evaluate(() => (window as any).__resizeObserverProbe)
}

export async function captureInputContextId(page: Page, activate: () => Promise<void>) {
  await page.evaluate(() => {
    const original = fcitx.Module.ccall
    const capture: { id?: number, original: typeof original } = { original }
    fcitx.__inputContextCapture = capture
    fcitx.Module.ccall = ((...args: Parameters<typeof original>) => {
      const result = original(...args)
      if (args[0] === 'focus_in') {
        capture.id = (args[3] as number[])[0]
      }
      return result
    }) as typeof original
  })
  try {
    await activate()
    return await page.evaluate(() => {
      const id = fcitx.__inputContextCapture.id
      if (id === undefined) {
        throw new Error('Input context was not focused')
      }
      return id
    })
  }
  finally {
    await page.evaluate(() => {
      const capture = fcitx.__inputContextCapture
      fcitx.Module.ccall = capture.original
      delete fcitx.__inputContextCapture
    })
  }
}

export function browserName(page: Page) {
  return page.context().browser()!.browserType().name()
}

export async function getBox(locator: Locator): Promise<{ x: number, y: number, width: number, height: number }> {
  while (true) {
    const box = await locator.boundingBox()
    if (box)
      return box
  }
}

// For test, don't let the initial "en" tip on focus affect panel visibility.
// In reality, it won't be an issue as real engine ignores the hide action.
export function disableTip(page: Page) {
  return page.evaluate(() => fcitx.setConfig('fcitx://config/global', { Behavior: { ShowInputMethodInformation: 'False' } }))
}

export async function showPanel(page: Page) {
  await page.evaluate(() => {
    fcitx.setCandidates([
      { text: 'foo', label: '1', comment: 'comment', actions: [] },
    ], 0, '', true, false, true, 0, false, false)
    fcitx.placePanel(0, 0, 0, 0, false)
  })
  return expect(page.locator('#fcitx-theme')).toHaveCSS('display', 'block')
}

export function expectPanelHidden(page: Page) {
  return expect(page.locator('#fcitx-theme')).toHaveCSS('display', 'none')
}

export function expectKeyboardShown(page: Page) {
  return expect(page.locator('#fcitx-virtual-keyboard')).toHaveCSS('bottom', '0px')
}

export async function tapKeyboard(page: Page, key: string | Locator,
) {
  const keyboard = page.locator('#fcitx-virtual-keyboard')
  const box = await getBox(keyboard)
  const locator = typeof key === 'string' ? keyboard.locator('.fcitx-keyboard-key', { hasText: key }) : key
  const keyBox = await getBox(locator)
  return keyboard.tap({ force: true, position: { x: keyBox.x + keyBox.width / 2 - box.x, y: keyBox.y + keyBox.height / 2 - box.y } })
}

export function getSelection(locator: Locator): Promise<[number, number]> {
  return locator.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])
}

export function tapReturn(page: Page) {
  return page.locator('.fcitx-keyboard-return-button').tap()
}
