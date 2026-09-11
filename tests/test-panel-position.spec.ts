import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { getBox, init } from './util'

async function showPanel(page: Page) {
  await page.evaluate(() => {
    window.fcitx.setCandidates([
      { text: 'foo', label: '1', comment: 'comment', actions: [] },
    ], 0, '', true, false, true, 0, false, false)
    const panel = document.querySelector('.fcitx-panel')!.getBoundingClientRect()
    const decoration = document.querySelector('.fcitx-decoration')!.getBoundingClientRect()
    window.fcitx.placePanel(0, 0, Math.min(panel.top, decoration.top), Math.min(panel.left, decoration.left), false)
  })
  await expect(page.locator('#fcitx-theme')).toHaveCSS('display', 'block')
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

async function getPanelOffsetFromInput(page: Page) {
  const input = await getBox(page.locator('textarea'))
  const panel = await getBox(page.locator('#fcitx-theme'))
  return { x: panel.x - input.x, y: panel.y - input.y }
}

async function dragPanel(page: Page, dx: number, dy: number) {
  await page.evaluate(({ dx, dy }) => {
    const panel = document.querySelector('.fcitx-panel')!.getBoundingClientRect()
    const decoration = document.querySelector('.fcitx-decoration')!.getBoundingClientRect()
    window.fcitx.placePanel(dx, dy, Math.min(panel.top, decoration.top), Math.min(panel.left, decoration.left), true)
  }, { dx, dy })
}

test('Panel is positioned correctly after page scroll', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.focus()
  await page.locator('.container').evaluate((el) => {
    el.style.width = '110vw'
    el.style.height = '110vh'
  })
  await showPanel(page)
  const offset = await getPanelOffsetFromInput(page)

  await page.evaluate(() => window.scrollBy(10, 10))
  await expect.poll(() => page.evaluate(() => [window.scrollX, window.scrollY])).toEqual([10, 10])
  await showPanel(page)

  const newOffset = await getPanelOffsetFromInput(page)
  expect(newOffset.x).toBeCloseTo(offset.x, 0.1)
  expect(newOffset.y).toBeCloseTo(offset.y, 0.1)
})

test('Panel follows container scroll', async ({ page }) => {
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
  await showPanel(page)
  const panel = page.locator('#fcitx-theme')
  const box = await getBox(panel)

  await container.evaluate(el => el.scrollBy(10, 10))
  await expect.poll(async () => (await getBox(panel)).x).toBeCloseTo(box.x - 10, 0.1)
  const newBox = await getBox(panel)
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})

test('Panel follows textarea scroll', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.style.height = '40px'
    el.value = 'first\nsecond\nthird\nfourth'
    el.selectionStart = el.selectionEnd = 0
  })
  await textarea.focus()
  await showPanel(page)
  const panel = page.locator('#fcitx-theme')
  const box = await getBox(panel)

  await textarea.evaluate(el => el.scrollBy(0, 10))
  await expect.poll(async () => (await getBox(panel)).y).toBeCloseTo(box.y - 10, 0.1)
})

test('Panel preserves drag offset while following container scroll', async ({ page }) => {
  await init(page)

  const container = page.locator('.container')
  await container.evaluate((el) => {
    el.style.width = '100px'
    el.style.height = '100px'
    el.style.overflow = 'auto'
  })
  const textarea = page.locator('textarea')
  await textarea.evaluate((el) => {
    el.style.width = '120px'
    el.style.height = '120px'
  })
  await textarea.focus()
  await showPanel(page)
  await dragPanel(page, 20, 20)
  const panel = page.locator('#fcitx-theme')
  const box = await getBox(panel)

  await container.evaluate(el => el.scrollBy(10, 10))
  await expect.poll(async () => (await getBox(panel)).x).toBeCloseTo(box.x - 10, 0.1)
  const newBox = await getBox(panel)
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})
