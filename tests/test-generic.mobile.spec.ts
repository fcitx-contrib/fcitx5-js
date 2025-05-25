import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, tapKeyboard } from './util'

test('keyboard-us', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)

  await tapKeyboard(page, 'a')
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

  await tapKeyboard(page, 'l')
  await expect(textarea).toHaveValue('ส')
})
