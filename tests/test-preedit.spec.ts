import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { browserName, getBox, init } from './util'

test('Caret with emoji', async ({ page }) => {
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

test('Underline follows page scroll', async ({ page }) => {
  await init(page)

  const container = page.locator('.container')
  await container.evaluate((el) => {
    el.style.width = '100px'
    el.style.height = '100px'
    el.style.overflow = 'auto'
  })
  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.style.width = '120px'
    el.style.height = '120px'
  })
  await textarea.focus()
  await page.evaluate(() => window.fcitx.setPreedit('a', 0))
  const underline = page.locator('.fcitx-preedit-underline')
  const box = await getBox(underline)

  await container.evaluate(el => el.scrollBy(10, 10))
  let newBox
  while (true) {
    newBox = await getBox(underline)
    if (newBox.x < box.x) {
      break
    }
  }
  expect(newBox.x).toBeCloseTo(box.x - 10, 0.1)
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})

test('Underline follows input horizontal scroll', async ({ page }) => {
  test.skip(browserName(page) === 'webkit') // Safari's input can't scroll horizontally.
  await init(page)

  const input = page.locator('input')
  await input.evaluate(el => el.style.width = '20px')

  await input.focus()
  await page.evaluate(() => {
    window.fcitx.commit('a')
    window.fcitx.setPreedit('aaaaa', 0)
  })
  const underline = page.locator('.fcitx-preedit-underline')
  const box = await getBox(underline)

  await input.evaluate(el => el.scrollBy(5, 0))

  let newBox
  while (true) {
    newBox = await getBox(underline)
    if (newBox.x < box.x) {
      break
    }
  }
  expect(newBox.x).toBeCloseTo(box.x - 5, 0.1)
  expect(newBox.y).toEqual(box.y)
  expect(newBox.width).toBeCloseTo(box.width + 5, 0.1)
})

test('Underline follows input vertical scroll', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.focus()
  await page.evaluate(() => {
    window.fcitx.commit('\n')
    window.fcitx.setPreedit('a\nb', 0)
  })
  const underline = page.locator('.fcitx-preedit-underline')
  await expect(underline).toHaveCount(1)
  await textarea.evaluate(el => el.scrollBy(0, 50))
  await expect(underline).toHaveCount(2)
})

test('Underline follows input resize', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.focus()
  await page.evaluate(() => {
    window.fcitx.setPreedit('aaaaaaaaaaaaaaaa', 0)
  })
  const underline = page.locator('.fcitx-preedit-underline')
  await expect(underline).toHaveCount(1)

  await textarea.evaluate(el => el.style.width = '50px')
  while (true) {
    const count = await underline.count()
    if (count > 1) {
      break
    }
  }
})
