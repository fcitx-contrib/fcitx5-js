import { expect, test } from '@playwright/test'
import { expectKeyboardShown, getBox, init, tapKeyboard, tapReturn } from './util'

test('keyboard-us', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await expect(page.locator('.fcitx-keyboard-space')).toHaveText('Keyboard - English (US)')

  await tapKeyboard(page, 'a@')
  await expect(textarea).toHaveValue('a')

  await tapKeyboard(page, page.locator('.fcitx-keyboard-key.fcitx-keyboard-backspace'))
  await expect(textarea).toHaveValue('')
})

test('keyboard-th', async ({ page }) => {
  await init(page)

  await page.evaluate(() => {
    window.fcitx.setInputMethods(['keyboard-th'])
  })
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await expect(page.locator('.fcitx-keyboard-space')).toHaveText('Keyboard - Thai')

  await tapKeyboard(page, 'l')
  await expect(textarea).toHaveValue('ส')
})

test('Body has margin', async ({ page }) => {
  await init(page)
  await page.evaluate(() => document.body.style.margin = '8px')
  await page.locator('textarea').tap()
  await expectKeyboardShown(page)

  const box = await getBox(page.locator('#fcitx-virtual-keyboard'))
  expect(box.x).toBe(0)
})

test('Space label preserved when collapse on editor', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const space = page.locator('.fcitx-keyboard-space')
  const fontSize = await space.evaluate(el => getComputedStyle(el).fontSize)
  expect(Number.parseFloat(fontSize)).toBeGreaterThan(10)

  await page.locator('.fcitx-keyboard-toolbar-button:nth-child(5)').tap()
  await page.locator('button').tap()
  await textarea.tap()
  await tapReturn(page)
  await expect(space).toHaveText('Keyboard - English (US)')
  await expect(space).toHaveCSS('font-size', fontSize)
})
