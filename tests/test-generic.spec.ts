import { expect, test } from '@playwright/test'
import { init } from './util'

test('keyboard-us', async ({ page }) => {
  const addons: string[] = []
  page.on('console', (msg) => {
    const match = msg.text().match(/Loaded addon (\S+)/)
    if (match) {
      addons.push(match[1])
    }
  })

  await init(page)
  expect(addons.sort()).toEqual(['clipboard', 'imselector', 'keyboard', 'notifications', 'quickphrase', 'unicode', 'wasmfrontend', 'webpanel'])

  const textarea = page.locator('textarea')
  await textarea.click()
  await page.keyboard.press('q')
  await expect(textarea).toHaveValue('q')

  const input = page.locator('input')
  await input.click()
  await page.keyboard.press('w')
  await expect(input).toHaveValue('w')
})

test('keyboard-th', async ({ page }) => {
  await init(page)

  await page.evaluate(() => {
    window.fcitx.setInputMethods(['keyboard-th'])
  })
  const textarea = page.locator('textarea')
  await textarea.click()
  for (const key of 'l;ylfu') {
    await page.keyboard.press(key)
  }
  await expect(textarea).toHaveValue('สวัสดี')
})
