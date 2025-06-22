import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, tapKeyboard } from './util'

function openEditor(page: Page) {
  return page.locator('.fcitx-keyboard-toolbar-button:nth-child(3)').tap()
}

test('Printable', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'ad'
    el.selectionStart = el.selectionEnd = 1
  })

  await tapKeyboard(page, 'b!')
  await tapKeyboard(page, 'c;')
  await expect(textarea, 'selectionStart is not reset to the end').toHaveValue('abcd')
})

test('ArrowLeft and ArrowRight', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = '左🦨右'
    el.selectionStart = el.selectionEnd = 3
  })
  await openEditor(page)

  const left = page.locator('.fcitx-keyboard-editor-button-container:nth-child(1)')
  const right = page.locator('.fcitx-keyboard-editor-button-container:nth-child(3)')
  await left.tap()
  expect(await textarea.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])).toEqual([1, 1])

  await right.tap()
  expect(await textarea.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])).toEqual([3, 3])
  await right.tap()
  expect(await textarea.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])).toEqual([4, 4])
})

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
