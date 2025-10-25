import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function init(page: Page) {
  await page.goto('http://localhost:9000')
  return page.evaluate(() => {
    return window.fcitxReady
  })
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
  return page.locator('.fcitx-keyboard-return-bar .fcitx-keyboard-toolbar-button').tap()
}
