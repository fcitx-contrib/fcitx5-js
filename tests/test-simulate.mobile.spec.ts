import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, tapKeyboard } from './util'

function openEditor(page: Page) {
  return page.locator('.fcitx-keyboard-toolbar-button:nth-child(3)').tap()
}

function getButton(page: Page, n: number) {
  return page.locator(`.fcitx-keyboard-editor-button-container:nth-child(${n})`)
}

function getLeft(page: Page) {
  return getButton(page, 1)
}

function getUp(page: Page) {
  return getButton(page, 2)
}

function getRight(page: Page) {
  return getButton(page, 3)
}

function getDown(page: Page) {
  return getButton(page, 4)
}

function getSelect(page: Page) {
  return getButton(page, 5)
}

function getCutOrSelectAll(page: Page) {
  return getButton(page, 6)
}

function getHome(page: Page) {
  return getButton(page, 10)
}

function getEnd(page: Page) {
  return getButton(page, 11)
}

function getSelection(locator: Locator): Promise<[number, number]> {
  return locator.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd])
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

  const left = getLeft(page)
  const right = getRight(page)
  await left.tap()
  expect(await getSelection(textarea)).toEqual([1, 1])

  await right.tap()
  expect(await getSelection(textarea)).toEqual([3, 3])
  await right.tap()
  expect(await getSelection(textarea)).toEqual([4, 4])
})

test('ArrowUp and ArrowDown', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'mm\nm\nmm'
    el.selectionStart = el.selectionEnd = 2
  })
  await openEditor(page)

  const up = getUp(page)
  const down = getDown(page)
  await down.tap()
  expect(await getSelection(textarea)).toEqual([4, 4])
  await down.tap()
  expect(await getSelection(textarea)).toEqual([6, 6])
  await down.tap()
  expect(await getSelection(textarea)).toEqual([7, 7])

  await up.tap()
  expect(await getSelection(textarea)).toEqual([4, 4])
  await up.tap()
  expect(await getSelection(textarea)).toEqual([1, 1])
  await up.tap()
  expect(await getSelection(textarea)).toEqual([0, 0])
})

test('Home and End', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'ab\ncd'
    el.selectionStart = el.selectionEnd = 1
  })
  await openEditor(page)

  const home = getHome(page)
  const end = getEnd(page)
  await end.tap()
  expect(await getSelection(textarea)).toEqual([2, 2])
  await home.tap()
  expect(await getSelection(textarea)).toEqual([0, 0])

  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.selectionStart = el.selectionEnd = 4
  })
  await end.tap()
  expect(await getSelection(textarea)).toEqual([5, 5])
  await home.tap()
  expect(await getSelection(textarea)).toEqual([3, 3])
})

test('Selection direction none', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await openEditor(page)

  for (const [button, start] of [
    [getLeft(page), 3],
    [getRight(page), 4],
    [getUp(page), 1],
    [getDown(page), 7],
    [getHome(page), 2],
    [getEnd(page), 5],
  ] as [Locator, number][]) {
    await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.value = 'a\nbcd\ne'
      el.selectionStart = 3
      el.selectionEnd = 4
    })
    await button.tap()
    expect(await getSelection(textarea)).toEqual([start, start])
  }
})

test('Select all and deselect', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await openEditor(page)

  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'ab'
  })
  await getCutOrSelectAll(page).tap()
  expect(await getSelection(textarea)).toEqual([0, 2])

  await getSelect(page).tap()
  expect(await getSelection(textarea)).toEqual([2, 2])

  await getLeft(page).tap()
  expect(await getSelection(textarea), 'Should be a simple caret move after deselect').toEqual([1, 1])
})

test('Move selection', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await openEditor(page)
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'abc\nde'
    el.selectionStart = 2
    el.selectionEnd = 2
  })

  for (const [button, start, end] of [
    [getSelect(page), 2, 2],
    [getLeft(page), 1, 2],
    [getDown(page), 2, 5],
    [getRight(page), 2, 6],
    [getUp(page), 2, 2],
    [getHome(page), 0, 2],
    [getEnd(page), 0, 3],
  ] as [Locator, number, number][]) {
    await button.tap()
    expect(await getSelection(textarea)).toEqual([start, end])
  }
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
