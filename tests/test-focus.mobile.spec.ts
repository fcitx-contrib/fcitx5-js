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

test('Kick system keyboard', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  const input = page.locator('input')

  await expect(textarea).toHaveAttribute('readonly')
  await expect(input).toHaveAttribute('readonly')

  await textarea.evaluate(el => el.remove())
  await page.evaluate(() => document.body.insertAdjacentHTML('afterend', '<textarea></textarea>'))
  await expect(textarea).not.toHaveAttribute('readonly')

  await page.evaluate(() => {
    const events: string[] = []
    document.addEventListener('focus', el => events.push(`focus${(<Element>el.target).tagName}`), true)
    document.addEventListener('blur', el => events.push(`blur${(<Element>el.target).tagName}`), true)
    // @ts-expect-error this is just a test
    window.events = events
  })
  await textarea.tap()
  await expectKeyboardShown(page)
  await expect(textarea).toHaveAttribute('readonly')

  expect(await page.evaluate(() => (window as any).events)).toEqual([
    'focusTEXTAREA', // tap
    'blurTEXTAREA', // kick system keyboard
    'focusTEXTAREA', // refocus
  ])

  await page.evaluate(() => window.fcitx.disable())
  await expect(textarea).not.toHaveAttribute('readonly')
  await expect(input).not.toHaveAttribute('readonly')

  await page.evaluate(() => (window as any).events.length = 0)

  await input.tap()
  await expect(input).toBeFocused()
  expect(await page.evaluate(() => (window as any).events)).toEqual([
    'blurTEXTAREA', // tap
    'focusINPUT', // tap
  ])
})
