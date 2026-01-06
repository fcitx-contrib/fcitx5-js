import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { browserName, expectPanelHidden, init } from './util'

function openClipboard(page: Page) {
  return page.keyboard.press('Control+;')
}

test('Clipboard', async ({ page }) => {
  test.skip(process.platform === 'linux' && browserName(page) === 'webkit')
  await init(page)
  const CONTROL = process.platform === 'darwin' ? 'Meta' : 'Control'

  const textarea = page.locator('textarea')
  await textarea.click()
  await textarea.fill('abc')

  // Cut
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.up('Shift')
  await page.keyboard.down(CONTROL)
  await page.keyboard.press('x')
  await page.keyboard.up(CONTROL)

  // Copy
  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.up('Shift')
  await page.keyboard.down(CONTROL)
  await page.keyboard.press('c')
  await page.keyboard.up(CONTROL)

  await openClipboard(page)
  const text = page.locator('.fcitx-text')
  const auxDown = page.locator('.fcitx-aux-down')
  await expect(text).toHaveCount(2)
  await expect(text.nth(0)).toHaveText('ab')
  await expect(text.nth(1)).toHaveText('c')
  await expect(auxDown).not.toBeVisible()

  await page.keyboard.press('2')
  await expect(textarea).toHaveValue('c')

  await openClipboard(page)
  await page.keyboard.press('Backspace')
  await expectPanelHidden(page)

  await openClipboard(page)
  await expect(page.locator('.fcitx-aux-down')).toHaveText('No clipboard history.')
  await expect(text).toHaveCount(0)
})

test('Primary selection', async ({ page }) => {
  const fcitxKey = 'Control+Super+K'
  const playwrightKey = 'Control+Meta+K'
  await init(page)

  await page.evaluate(({ fcitxKey }) => {
    const foo = document.createElement('div')
    foo.textContent = 'foo'
    const bar = document.createElement('div')
    bar.textContent = 'bar'
    document.body.append(foo, bar)
    fcitx.setConfig('fcitx://config/addon/clipboard', { PastePrimaryKey: { 0: fcitxKey } })
    const range = document.createRange()
    range.setStartBefore(foo)
    range.setEndAfter(bar)
    window.getSelection()?.addRange(range)
  }, { fcitxKey })

  // Static text
  const textarea = page.locator('textarea')
  await textarea.click()
  await page.keyboard.press(playwrightKey)
  await expect(textarea).toHaveValue('foo\nbar')

  // Editable text
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.setSelectionRange(0, 3)
  })
  const input = page.locator('input')
  await input.click()
  await page.keyboard.press(playwrightKey)
  await expect(input).toHaveValue('foo')
})
