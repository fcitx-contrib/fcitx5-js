import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init } from './util'

test('Touching outside loses focus', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  const keyboard = page.locator('#fcitx-virtual-keyboard')
  await expect(keyboard).toHaveCSS('bottom', '0px')

  await page.locator('button').tap()
  await expect(textarea).not.toBeFocused()
  await expect(keyboard).toHaveCSS('bottom', /^-2\d\d(\.\d+)?px$/)
})

test('Touching keyboard remains focus', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()

  const keyboard = page.locator('#fcitx-virtual-keyboard')
  await keyboard.tap()
  await expect(textarea).toBeFocused()
  await expectKeyboardShown(page)
})

test('Touching collapse loses focus', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)

  await page.locator('.fcitx-keyboard-toolbar .fcitx-keyboard-toolbar-button').last().tap()
  await expect(textarea).not.toBeFocused()
  await expect(page.locator('#fcitx-virtual-keyboard')).toHaveCSS('bottom', /^-2\d\d(\.\d+)?px$/)
})

test('Touching input switches focus', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()

  const input = page.locator('input')
  await input.tap()

  await expect(input).toBeFocused()
  await expectKeyboardShown(page)
})
