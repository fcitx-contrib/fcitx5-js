import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectKeyboardShown, getSelection, init, tapKeyboard } from './util'

function undo(page: Page) {
  return page.locator('.fcitx-keyboard-toolbar > .fcitx-keyboard-toolbar-button:nth-child(1)').tap()
}

function redo(page: Page) {
  return page.locator('.fcitx-keyboard-toolbar > .fcitx-keyboard-toolbar-button:nth-child(2)').tap()
}

test('Continuous insert', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await tapKeyboard(page, 'a@')
  await tapKeyboard(page, 'b!')

  await undo(page)
  await expect(textarea).toHaveValue('')

  await redo(page)
  await expect(textarea).toHaveValue('ab')

  await tapKeyboard(page, 'c;')
  await undo(page)
  await expect(textarea).toHaveValue('ab')
  await undo(page)
  await expect(textarea).toHaveValue('')
})

test('Long interval insert', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await tapKeyboard(page, 'a@')

  await page.waitForTimeout(5000)
  await tapKeyboard(page, 'b!')

  await undo(page)
  await expect(textarea).toHaveValue('a')

  await undo(page)
  await expect(textarea).toHaveValue('')
})

test('Delete merge', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => el.value = 'ab')
  await textarea.tap()
  await expectKeyboardShown(page)

  const backspace = page.locator('.fcitx-keyboard-backspace')
  await tapKeyboard(page, backspace)
  await tapKeyboard(page, backspace)

  await undo(page)
  await expect(textarea).toHaveValue('ab')

  await redo(page)
  await expect(textarea).toHaveValue('')
})

test('Delete no merge', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => el.value = 'ab')
  await textarea.tap()
  await expectKeyboardShown(page)

  const backspace = page.locator('.fcitx-keyboard-backspace')
  await tapKeyboard(page, backspace)
  await page.waitForTimeout(5000)
  await tapKeyboard(page, backspace)

  await undo(page)
  await expect(textarea).toHaveValue('a')

  await redo(page)
  await expect(textarea).toHaveValue('')
})

test('Replace', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'abc'
  })
  await textarea.tap()
  await expectKeyboardShown(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.selectionStart = 1
    el.selectionEnd = 2
  })

  await tapKeyboard(page, 'd+')
  await expect(textarea).toHaveValue('adc')

  await undo(page)
  await expect(textarea).toHaveValue('abc')
  expect(await getSelection(textarea)).toEqual([2, 2])

  await redo(page)
  await expect(textarea).toHaveValue('adc')
  expect(await getSelection(textarea)).toEqual([2, 2])
})

test('Reset stacks', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await tapKeyboard(page, 'a@')

  await page.locator('button').click()
  await textarea.tap()
  await undo(page)
  await expect(textarea).toHaveValue('a')
})
