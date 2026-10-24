import { expect, test } from '@playwright/test'
import { init } from './util'

test('bulk highlight follows the global cursor across candidate pages', async ({ page }) => {
  await init(page)
  await page.locator('textarea').tap()
  await page.keyboard.press('Control+Alt+Shift+U')
  await page.keyboard.type('cat')

  const candidates = page.locator('.fcitx-keyboard-candidate')
  const highlighted = page.locator('.fcitx-keyboard-candidate.fcitx-keyboard-highlighted')
  await expect(candidates.nth(6)).toBeAttached()
  await expect(highlighted).toHaveCount(1)
  await expect(candidates.nth(0)).toHaveClass(/fcitx-keyboard-highlighted/)

  // The fallback page size is five; bulk indexes must not wrap at that boundary.
  for (let index = 1; index <= 6; index++) {
    await page.keyboard.press('Tab')
    await expect(highlighted).toHaveCount(1)
    await expect(candidates.nth(index)).toHaveClass(/fcitx-keyboard-highlighted/)
  }
  await page.keyboard.press('Shift+Tab')
  await expect(candidates.nth(5)).toHaveClass(/fcitx-keyboard-highlighted/)
})

test('bulk candidates default to the first candidate when the global cursor is unavailable', async ({ page }) => {
  await init(page)
  await page.evaluate(() => fcitx.setConfig('fcitx://config/addon/keyboard', {
    EnableHintByDefault: 'True',
    EnableEmoji: 'False',
  }))
  await page.locator('textarea').tap()
  await page.keyboard.type('hel')

  const candidates = page.locator('.fcitx-keyboard-candidate')
  const highlighted = page.locator('.fcitx-keyboard-candidate.fcitx-keyboard-highlighted')
  await expect(candidates.nth(1)).toBeAttached()
  await expect(highlighted).toHaveCount(1)
  await expect(candidates.nth(0)).toHaveClass(/fcitx-keyboard-highlighted/)
  await page.keyboard.press('Tab')
  await expect(candidates.nth(0)).toHaveClass(/fcitx-keyboard-highlighted/)
  await page.keyboard.press('Tab')
  await expect(candidates.nth(1)).toHaveClass(/fcitx-keyboard-highlighted/)
  await page.keyboard.press('Shift+Tab')
  await expect(candidates.nth(0)).toHaveClass(/fcitx-keyboard-highlighted/)
  await page.keyboard.press('Shift+Tab')
  await expect(candidates.nth(0)).toHaveClass(/fcitx-keyboard-highlighted/)
})

test('bulk highlight beyond the initial batch remains visible', async ({ page }) => {
  await init(page)
  await page.locator('textarea').tap()
  await page.keyboard.press('Control+Alt+Shift+U')
  await page.keyboard.type('letter')

  // Move the cursor beyond the sixty candidates loaded initially.
  for (let index = 0; index < 60; index++) {
    await page.keyboard.press('Tab')
  }
  const candidate = page.locator('.fcitx-keyboard-candidate').nth(60)
  await expect(candidate).toBeAttached()
  await expect(candidate).toHaveClass(/fcitx-keyboard-highlighted/)
  await expect(candidate).toBeInViewport({ ratio: 1 })
})
