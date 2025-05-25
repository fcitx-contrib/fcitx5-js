import { expect, test } from '@playwright/test'
import { disableTip, expectPanelHidden, init, showPanel } from './util'

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
