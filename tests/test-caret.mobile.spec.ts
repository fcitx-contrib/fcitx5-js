import { expect, test } from '@playwright/test'
import { expectKeyboardShown, getBox, init, tapKeyboard } from './util'

test('Focus, blink and blur', async ({ page }) => {
  await init(page)

  const caret = page.locator('.fcitx-mobile-caret')
  await expect(caret).not.toBeInViewport()

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expect(caret).toHaveCSS('opacity', '1')
  await expect(caret).toHaveCSS('opacity', '0')
  await expect(caret).toHaveCSS('opacity', '1')

  await page.locator('button').tap()
  await expect(caret).not.toBeInViewport()
})

test('Input and Backspace', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const caret = page.locator('.fcitx-mobile-caret')
  const { x: x0 } = await getBox(caret)

  await tapKeyboard(page, 'a@')
  const { x: x1 } = await getBox(caret)
  expect(x1).toBeGreaterThan(x0)

  await tapKeyboard(page, page.locator('.fcitx-keyboard-key.fcitx-keyboard-backspace'))
  const { x } = await getBox(caret)
  expect(x).toEqual(x0)
})

test('Touch', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const caret = page.locator('.fcitx-mobile-caret')
  const { x: x0 } = await getBox(caret)

  await tapKeyboard(page, 'a@')
  await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionStart = el.selectionEnd = 0)
  const { x } = await getBox(caret)
  expect(x).toEqual(x0)

  await textarea.tap()
  const { x: x1 } = await getBox(caret)
  expect(x1, 'Tapping on center should effectively change caret position').toBeGreaterThan(x0)
})
