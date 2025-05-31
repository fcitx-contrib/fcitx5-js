import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, tapKeyboard } from './util'

test('Backspace', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => el.value = 'a只🦨')
  await textarea.tap()
  await expectKeyboardShown(page)

  const backspace = page.locator('.fcitx-keyboard-backspace')
  await tapKeyboard(page, backspace)
  await expect(textarea).toHaveValue('a只')

  await tapKeyboard(page, backspace)
  await expect(textarea).toHaveValue('a')

  await tapKeyboard(page, backspace)
  await expect(textarea).toHaveValue('')
})
