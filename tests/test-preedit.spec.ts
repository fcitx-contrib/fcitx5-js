import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { getBox, init } from './util'

test('Cursor with emoji', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.click()
  await page.evaluate(() => {
    window.fcitx.setPreedit('🐦‍🔥she', 13)
  })
  expect(await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionStart)).toBe('🐦‍🔥sh'.length)
})

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

  await textarea.click()
  await page.evaluate(() => {
    window.fcitx.setPreedit('pin xie', 7)
  })
  expect(await getSpellCheck(textarea), 'Spellcheck is turned off when there is preedit').toBe(false)

  await page.evaluate(() => {
    window.fcitx.setPreedit('', 0)
  })
  expect(await getSpellCheck(textarea), 'Original spellcheck value is restored').toBe(false)
})

test('Underline', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLElement) => {
    el.style.width = '20px'
    el.style.fontSize = '16px'
  })
  await textarea.focus()
  await page.evaluate(() => {
    window.fcitx.setPreedit('aa', 0)
  })
  const underline = page.locator('.fcitx-preedit-underline')
  await expect(underline).toHaveCount(1)
  const box = await getBox(underline)
  expect(box.height).toBe(1)

  await page.evaluate(() => {
    window.fcitx.setPreedit('', 0)
  })
  await expect(underline, 'Clearing preedit should clear underline').not.toBeAttached()

  await page.evaluate(() => {
    window.fcitx.setPreedit('aaa', 0)
  })
  await expect(underline).toHaveCount(2)
  const firstBox = await getBox(underline.nth(0))
  const secondBox = await getBox(underline.nth(1))
  expect(firstBox).toEqual(box)
  expect(secondBox.height).toBe(1)
  expect(secondBox.x).toEqual(box.x)
  expect(secondBox.y).toBeGreaterThan(box.y)
  expect(secondBox.width, 'a should be thinner than aa').toBeLessThan(box.width)

  await page.evaluate(() => {
    window.fcitx.setPreedit('啊', 0)
  })
  await expect(underline).toHaveCount(1)
  const aBox = await getBox(underline)
  expect(aBox.height).toBe(1)
  expect(aBox.x).toEqual(box.x)
  expect(aBox.y, '啊 could be taller than a').toBeGreaterThanOrEqual(box.y)
  expect(aBox.width, '啊 should be wider than a').toBeGreaterThan(secondBox.width)

  await page.locator('input').click()
  await expect(underline, 'Focusing out should clear underline').not.toBeAttached()
})
