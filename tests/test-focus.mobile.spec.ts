import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, installResizeObserverProbe, recordedFcitxCalls, recordFcitxCalls, resizeObserverProbe } from './util'

test.beforeEach(async ({ page }) => {
  await installResizeObserverProbe(page)
})

test('disable cleans and re-enable restores the touch input session', async ({ page }) => {
  await init(page)
  await recordFcitxCalls(page)

  const textarea = page.locator('textarea')
  const keyboard = page.locator('#fcitx-virtual-keyboard')
  await textarea.tap()
  await expectKeyboardShown(page)
  const firstContext = (await recordedFcitxCalls(page)).find(call => call.name === 'focus_in')!.args[0] as number
  const focusedResize = await resizeObserverProbe(page)
  await page.evaluate(context => fcitx.setPreedit(context, 'x', 1), firstContext)
  await expect(page.locator('.fcitx-preedit-underline')).toBeAttached()

  await page.evaluate(() => fcitx.disable())

  await expect(keyboard).toHaveCSS('bottom', /^-2\d\d(\.\d+)?px$/)
  await expect(page.locator('.fcitx-preedit-underline')).not.toBeAttached()
  await expect(textarea).not.toHaveAttribute('readonly')
  expect(await resizeObserverProbe(page)).toEqual({
    observed: focusedResize.observed,
    unobserved: focusedResize.unobserved + 1,
  })
  const disabledCalls = await recordedFcitxCalls(page)
  const focusOut = disabledCalls.findIndex(call => call.name === 'focus_out' && call.args[0] === firstContext)
  const destroy = disabledCalls.findIndex(call => call.name === 'destroy_input_context' && call.args[0] === firstContext)
  expect(focusOut).toBeGreaterThan(-1)
  expect(destroy).toBeGreaterThan(focusOut)

  const originallyReadOnly = page.locator('#originally-readonly')
  await page.evaluate(() => {
    const element = document.createElement('input')
    element.id = 'originally-readonly'
    element.readOnly = true
    document.body.append(element)
    document.querySelector('textarea')!.focus()
    fcitx.enable()
    fcitx.disable()
  })
  await page.waitForTimeout(50)
  await expect(textarea).not.toBeFocused()
  await expect(textarea).not.toHaveAttribute('readonly')
  await expect(originallyReadOnly).toHaveAttribute('readonly')

  await page.evaluate(() => fcitx.enable())
  await textarea.tap()
  await expectKeyboardShown(page)
  const secondContext = (await recordedFcitxCalls(page)).filter(call => call.name === 'focus_in').at(-1)!.args[0]
  expect(secondContext).not.toBe(firstContext)

  await page.evaluate(() => fcitx.disable())
  await expect(originallyReadOnly).toHaveAttribute('readonly')
})

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

test('System keyboard refocus does not steal a newer focus', async ({ page }) => {
  await init(page)

  const input = page.locator('input')
  await page.evaluate(() => {
    const textarea = document.createElement('textarea')
    textarea.id = 'late-textarea'
    textarea.addEventListener('blur', () => document.querySelector('input')!.focus(), { once: true })
    document.body.append(textarea)
    textarea.focus()
  })
  await page.waitForTimeout(50)

  await expect(input).toBeFocused()
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
