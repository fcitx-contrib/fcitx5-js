import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { init } from './util'

function getSpellCheck(locator: Locator) {
  return locator.evaluate((el: HTMLElement) => el.spellcheck)
}

test('Disable spellcheck', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  expect(await getSpellCheck(textarea), 'Original value set by browser is true').toBe(true)

  await textarea.click()
  await page.evaluate(() => {
    window.fcitx.setPreedit('pin xie', 7)
  })
  expect(await getSpellCheck(textarea), 'Spellcheck is turned off when there is preedit').toBe(false)

  await page.evaluate(() => {
    window.fcitx.setPreedit('', 0)
  })
  expect(await getSpellCheck(textarea), 'Original spellcheck value is restored').toBe(true)
})

test('Respect original spellcheck value (manually set false)', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLElement) => {
    el.spellcheck = false
  })

  await page.evaluate(() => {
    window.fcitx.setPreedit('pin xie', 7)
  })
  expect(await getSpellCheck(textarea), 'Spellcheck is turned off when there is preedit').toBe(false)

  await page.evaluate(() => {
    window.fcitx.setPreedit('', 0)
  })
  expect(await getSpellCheck(textarea), 'Original spellcheck value is restored').toBe(false)
})
