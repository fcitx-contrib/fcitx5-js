import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { browserName, captureInputContextId, getBox, init } from './util'

test('Caret with emoji', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  const contextId = await captureInputContextId(page, () => textarea.click())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, '🐦‍🔥she', 13), contextId)
  expect(await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionStart)).toBe('🐦‍🔥sh'.length)
})

function getSpellCheck(locator: Locator) {
  return locator.evaluate((el: HTMLElement) => el.spellcheck)
}

test('Disable spellcheck', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  expect(await getSpellCheck(textarea), 'Original value set by browser is true').toBe(true)

  const contextId = await captureInputContextId(page, () => textarea.click())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'pin xie', 7), contextId)
  expect(await getSpellCheck(textarea), 'Spellcheck is turned off when there is preedit').toBe(false)

  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, '', 0), contextId)
  expect(await getSpellCheck(textarea), 'Original spellcheck value is restored').toBe(true)
})

test('Respect original spellcheck value (manually set false)', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLElement) => {
    el.spellcheck = false
  })

  const contextId = await captureInputContextId(page, () => textarea.click())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'pin xie', 7), contextId)
  expect(await getSpellCheck(textarea), 'Spellcheck is turned off when there is preedit').toBe(false)

  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, '', 0), contextId)
  expect(await getSpellCheck(textarea), 'Original spellcheck value is restored').toBe(false)
})

test('Underline', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLElement) => {
    el.style.width = '20px'
    el.style.fontSize = '16px'
  })
  const contextId = await captureInputContextId(page, () => textarea.focus())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'aa', 0), contextId)
  const underline = page.locator('.fcitx-preedit-underline')
  await expect(underline).toHaveCount(1)
  const box = await getBox(underline)
  expect(box.height).toBe(1)

  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, '', 0), contextId)
  await expect(underline, 'Clearing preedit should clear underline').not.toBeAttached()

  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'aaa', 0), contextId)
  await expect(underline).toHaveCount(2)
  const firstBox = await getBox(underline.nth(0))
  const secondBox = await getBox(underline.nth(1))
  expect(firstBox).toEqual(box)
  expect(secondBox.height).toBe(1)
  expect(secondBox.x).toEqual(box.x)
  expect(secondBox.y).toBeGreaterThan(box.y)
  expect(secondBox.width, 'a should be thinner than aa').toBeLessThan(box.width)

  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, '啊', 0), contextId)
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

  const textarea = page.locator('textarea')
  const contextId = await captureInputContextId(page, () => textarea.focus())
  const container = page.locator('.container')
  await container.evaluate((el, contextId) => {
    el.style.width = '110vw'
    el.style.height = '110vh'
    window.fcitx.setPreedit(contextId, 'a', 0)
  }, contextId)

  const underline = page.locator('.fcitx-preedit-underline')
  const box = await getBox(underline)
  await page.evaluate(() => window.scrollBy(10, 10))
  let newBox
  while (true) { // Wait scroll take effect.
    newBox = await getBox(underline)
    if (newBox.x < box.x) {
      break
    }
  }
  // With above treatment there could still be false negative, but it's acceptable.
  expect(newBox.x).toBeCloseTo(box.x - 10, 0.1)
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})

test('Underline follows container scroll', async ({ page }) => {
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
  const contextId = await captureInputContextId(page, () => textarea.focus())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'a', 0), contextId)
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

  const contextId = await captureInputContextId(page, () => input.focus())
  await page.evaluate((contextId) => {
    window.fcitx.commit(contextId, 'a')
    window.fcitx.setPreedit(contextId, 'aaaaa', 0)
  }, contextId)
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
  const contextId = await captureInputContextId(page, () => textarea.focus())
  await page.evaluate((contextId) => {
    window.fcitx.commit(contextId, '\n')
    window.fcitx.setPreedit(contextId, 'a\nb', 0)
  }, contextId)
  const underline = page.locator('.fcitx-preedit-underline')
  await expect(underline).toHaveCount(1)
  await textarea.evaluate(el => el.scrollBy(0, 50))
  await expect(underline).toHaveCount(2)
})

test('Underline follows input resize', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  const contextId = await captureInputContextId(page, () => textarea.focus())
  await page.evaluate(contextId => window.fcitx.setPreedit(contextId, 'aaaaaaaaaaaaaaaa', 0), contextId)
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
