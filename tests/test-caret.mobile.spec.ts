import { expect, test } from '@playwright/test'
import { browserName, expectKeyboardShown, getBox, init, tapKeyboard } from './util'

test('Focus, blink and blur', async ({ page }) => {
  await init(page)

  const caret = page.locator('.fcitx-mobile-caret')
  await expect(caret).not.toBeInViewport()

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expect(caret).toHaveCSS('opacity', '1')
  await expect(caret).toHaveCSS('opacity', '0')
  await expect(caret).toHaveCSS('opacity', '1')

  await page.locator('button').tap()
  await expect(caret).not.toBeInViewport()
})

test('Input and Backspace', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const caret = page.locator('.fcitx-mobile-caret')
  const { x: x0 } = await getBox(caret)

  await tapKeyboard(page, 'a@')
  const { x: x1 } = await getBox(caret)
  expect(x1).toBeGreaterThan(x0)

  await tapKeyboard(page, page.locator('.fcitx-keyboard-key.fcitx-keyboard-backspace'))
  const { x } = await getBox(caret)
  expect(x).toEqual(x0)
})

test('Touch', async ({ page }) => {
  await init(page)
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const caret = page.locator('.fcitx-mobile-caret')
  const { x: x0 } = await getBox(caret)

  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'a'
    el.selectionStart = el.selectionEnd = 0
  })
  const { x } = await getBox(caret)
  expect(x).toEqual(x0)

  await textarea.tap()
  while (true) {
    const { x: x1 } = await getBox(caret)
    // Tapping on center should effectively change caret position
    if (x1 > x0) {
      break
    }
  }
})

test('Caret follows page scroll', async ({ page }) => {
  await init(page)

  const container = page.locator('.container')
  await container.evaluate((el) => {
    // On Android there is layout issue with keyboard if width is bigger than 100vw.
    el.style.height = '110vh'
  })
  const textarea = page.locator('textarea')
  await textarea.tap()
  const caret = page.locator('.fcitx-mobile-caret')
  const box = await getBox(caret)

  await page.evaluate(() => window.scrollBy(10, 10))
  let newBox
  while (true) {
    newBox = await getBox(caret)
    if (newBox.y < box.y) {
      break
    }
  }
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})

test('Caret follows container scroll', async ({ page }) => {
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
  await textarea.tap()
  const caret = page.locator('.fcitx-mobile-caret')
  const box = await getBox(caret)

  await container.evaluate(el => el.scrollBy(10, 10))
  let newBox
  while (true) {
    newBox = await getBox(caret)
    if (newBox.x < box.x) {
      break
    }
  }
  expect(newBox.x).toBeCloseTo(box.x - 10, 0.1)
  expect(newBox.y).toBeCloseTo(box.y - 10, 0.1)
})

test('Caret follows input horizontal scroll', async ({ page }) => {
  test.skip(browserName(page) === 'webkit') // Safari's input can't scroll horizontally.
  await init(page)

  const input = page.locator('input')
  await input.evaluate(el => el.style.width = '20px')

  await input.tap()
  await input.evaluate((el: HTMLInputElement) => {
    el.value = 'aaaaaa'
    el.selectionStart = el.selectionEnd = 0
  })
  const caret = page.locator('.fcitx-mobile-caret')
  await expect(caret).toHaveCount(1)

  await input.evaluate(el => el.scrollBy(5, 0))
  await expect(caret).toHaveCount(0)
})

test('Caret follows input vertical scroll', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = '\n\n\na'
    el.selectionStart = el.selectionEnd = 0
  })
  const caret = page.locator('.fcitx-mobile-caret')
  await expect(caret).toHaveCount(1)
  await textarea.evaluate(el => el.scrollBy(0, 50))
  await expect(caret).toHaveCount(0)
})

test('Caret follows input resize', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await textarea.evaluate((el: HTMLTextAreaElement) => {
    el.value = 'aaaaaaaaaa'
    el.selectionStart = el.selectionEnd = el.value.length
  })
  const caret = page.locator('.fcitx-mobile-caret')
  const box = await getBox(caret)

  await textarea.evaluate(el => el.style.width = '50px')
  let newBox
  while (true) {
    newBox = await getBox(caret)
    if (newBox.y > box.y) {
      break
    }
  }
})
