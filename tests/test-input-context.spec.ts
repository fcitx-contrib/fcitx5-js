import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { init } from './util'

async function configureInputContexts(page: Page, shareInputState: 'No' | 'Program' | 'All') {
  await page.evaluate((shareInputState) => {
    fcitx.setInputMethods(['keyboard-us', 'keyboard-th'])
    fcitx.setConfig('fcitx://config/global', { Behavior: { ShareInputState: shareInputState } })
  }, shareInputState)
}

test('each DOM input keeps its own input context', async ({ page }) => {
  await init(page)
  await configureInputContexts(page, 'No')

  const textarea = page.locator('textarea')
  const input = page.locator('input')

  await textarea.focus()
  await page.evaluate(() => fcitx.setCurrentInputMethod('keyboard-th'))
  await input.focus()
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-us')

  await textarea.focus()
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-th')
})

test('pathname is the program used to share input state', async ({ page }) => {
  await init(page)
  await configureInputContexts(page, 'Program')
  await page.evaluate(() => history.replaceState(null, '', '/input-context-a'))

  const textarea = page.locator('textarea')
  const input = page.locator('input')

  await textarea.focus()
  await page.evaluate(() => fcitx.setCurrentInputMethod('keyboard-th'))
  await input.focus()
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-th')

  await page.evaluate(() => history.pushState(null, '', '/input-context-b'))
  await page.keyboard.press('l')
  await expect(input).toHaveValue('l')
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-us')

  await page.evaluate(() => history.pushState(null, '', '/input-context-a'))
  await page.keyboard.press('l')
  await expect(input).toHaveValue('lส')
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-th')
})

test('all input contexts share input state across pathnames', async ({ page }) => {
  await init(page)
  await configureInputContexts(page, 'All')
  await page.evaluate(() => history.replaceState(null, '', '/input-context-all-a'))

  const textarea = page.locator('textarea')
  const input = page.locator('input')

  await textarea.focus()
  await page.evaluate(() => fcitx.setCurrentInputMethod('keyboard-th'))

  await page.evaluate(() => history.pushState(null, '', '/input-context-all-b'))
  await input.focus()
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-th')
  await page.keyboard.press('l')
  await expect(input).toHaveValue('ส')
})

test('removing a DOM input destroys its input context', async ({ page }) => {
  await init(page)
  await configureInputContexts(page, 'Program')
  await page.evaluate(() => history.replaceState(null, '', '/removed-input-context'))

  const textarea = page.locator('textarea')
  await textarea.focus()
  await page.evaluate(() => fcitx.setCurrentInputMethod('keyboard-th'))
  await textarea.evaluate(element => element.remove())
  await page.evaluate(() => new Promise(requestAnimationFrame))

  const input = page.locator('input')
  await input.focus()
  expect(await page.evaluate(() => fcitx.currentInputMethod())).toBe('keyboard-us')
})
