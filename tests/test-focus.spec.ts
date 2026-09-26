import { expect, test } from '@playwright/test'
import { disableTip, expectPanelHidden, init, installResizeObserverProbe, recordedFcitxCalls, recordFcitxCalls, resizeObserverProbe, showPanel } from './util'

test.beforeEach(async ({ page }) => {
  await installResizeObserverProbe(page)
})

test('disable cleans and re-enable restores the input session', async ({ page }) => {
  await init(page)
  await recordFcitxCalls(page)
  await page.evaluate(() => fcitx.enable())
  expect(await recordedFcitxCalls(page)).toEqual([])

  const textarea = page.locator('textarea')
  await textarea.focus()
  const firstCalls = await recordedFcitxCalls(page)
  const firstContext = firstCalls.find(call => call.name === 'focus_in')!.args[0] as number
  const focusedResize = await resizeObserverProbe(page)
  await page.evaluate(context => fcitx.setPreedit(context, 'x', 1), firstContext)
  await expect(page.locator('.fcitx-preedit-underline')).toBeAttached()

  await page.evaluate(() => fcitx.disable())

  await expect(page.locator('.fcitx-preedit-underline')).not.toBeAttached()
  await expect(textarea).toHaveJSProperty('spellcheck', true)
  expect(await resizeObserverProbe(page)).toEqual({
    observed: focusedResize.observed,
    unobserved: focusedResize.unobserved + 1,
  })

  const disabledCalls = await recordedFcitxCalls(page)
  const focusOut = disabledCalls.findIndex(call => call.name === 'focus_out' && call.args[0] === firstContext)
  const destroy = disabledCalls.findIndex(call => call.name === 'destroy_input_context' && call.args[0] === firstContext)
  expect(focusOut).toBeGreaterThan(-1)
  expect(destroy).toBeGreaterThan(focusOut)
  expect(await page.evaluate(context => fcitx.Module.ccall('process_key', 'boolean', ['number', 'string', 'string', 'number', 'boolean'], [context, 'a', 'KeyA', 0, false]), firstContext)).toBe(false)

  const callCount = (await recordedFcitxCalls(page)).length
  await page.locator('button').focus()
  await textarea.focus()
  await textarea.dispatchEvent('input')
  expect((await recordedFcitxCalls(page)).length).toBe(callCount)

  await page.evaluate(() => fcitx.enable())

  const enabledCalls = await recordedFcitxCalls(page)
  const secondContext = enabledCalls.filter(call => call.name === 'focus_in').at(-1)!.args[0]
  expect(secondContext).not.toBe(firstContext)
  expect(await resizeObserverProbe(page)).toEqual({
    observed: focusedResize.observed + 1,
    unobserved: focusedResize.unobserved + 1,
  })
})

test('Clicking outside loses focus', async ({ page }) => {
  await init(page)

  await disableTip(page)
  const textarea = page.locator('textarea')
  await textarea.click()
  await showPanel(page)

  await page.locator('body').click()
  await expect(textarea).not.toBeFocused()
  await expectPanelHidden(page)
})

test('Clicking panel remains focus', async ({ page }) => {
  await init(page)

  await disableTip(page)
  const textarea = page.locator('textarea')
  await textarea.click()
  await showPanel(page)
  await page.locator('.fcitx-panel').click()
  await expect(textarea).toBeFocused()
})

test('Panel refocus does not steal a newer focus', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  const input = page.locator('input')
  await textarea.focus()
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('.fcitx-decoration')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.querySelector('textarea')!.blur()
    document.querySelector('input')!.focus()
  })
  await page.waitForTimeout(50)

  await expect(input).toBeFocused()
})

test('Clicking input switches focus', async ({ page }) => {
  await init(page)

  await disableTip(page)
  const textarea = page.locator('textarea')
  await textarea.click()
  await showPanel(page)

  const input = page.locator('input')
  await input.click()
  await expect(input).toBeFocused()
})
