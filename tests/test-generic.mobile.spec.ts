import { expect, test } from '@playwright/test'
import { expectKeyboardShown, getBox, init, tapKeyboard, tapReturn } from './util'

test('keyboard-us', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await expect(page.locator('.fcitx-keyboard-space')).toHaveText('Keyboard - English (US)')

  await tapKeyboard(page, 'a@')
  await expect(textarea).toHaveValue('a')

  await tapKeyboard(page, page.locator('.fcitx-keyboard .fcitx-keyboard-backspace'))
  await expect(textarea).toHaveValue('')
})

test('keyboard-th', async ({ page }) => {
  await init(page)

  await page.evaluate(() => {
    window.fcitx.setInputMethods(['keyboard-th'])
  })
  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  await expect(page.locator('.fcitx-keyboard-space')).toHaveText('Keyboard - Thai')

  await tapKeyboard(page, 'l')
  await expect(textarea).toHaveValue('ส')
})

test('Body has margin', async ({ page }) => {
  await init(page)
  await page.evaluate(() => document.body.style.margin = '8px')
  await page.locator('textarea').tap()
  await expectKeyboardShown(page)

  const box = await getBox(page.locator('#fcitx-virtual-keyboard'))
  expect(box.x).toBe(0)
})

test('Space label preserved when collapse on editor', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)
  const space = page.locator('.fcitx-keyboard-space')
  const fontSize = await space.evaluate(el => getComputedStyle(el).fontSize)
  expect(Number.parseFloat(fontSize)).toBeGreaterThan(10)

  await page.locator('.fcitx-keyboard-toolbar-button:nth-child(5)').tap()
  await page.locator('button').tap()
  await textarea.tap()
  await tapReturn(page)
  await expect(space).toHaveText('Keyboard - English (US)')
  await expect(space).toHaveCSS('font-size', fontSize)
})

test('Numpad', async ({ page }) => {
  await init(page)

  const textarea = page.locator('textarea')
  await textarea.tap()
  await expectKeyboardShown(page)

  const symbol = page.locator('.fcitx-keyboard-symbol')
  const symbolBox = await getBox(symbol)
  await page.evaluate(async ({ x, y }) => {
    const mask = document.querySelector('.fcitx-keyboard-mask')!
    const touch = { identifier: 0, target: mask, clientX: x, clientY: y } as unknown as Touch
    const dispatchTouch = (type: string, touches: Touch[]) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperties(event, {
        touches: { value: touches },
        changedTouches: { value: [touch] },
      })
      mask.dispatchEvent(event)
    }
    dispatchTouch('touchstart', [touch])
    await new Promise(resolve => setTimeout(resolve, 400))
    dispatchTouch('touchend', [])
  }, { x: symbolBox.x + symbolBox.width / 2, y: symbolBox.y + symbolBox.height / 2 })

  const numpad = page.locator('.fcitx-keyboard-numpad')
  await expect(numpad).toBeVisible()
  await tapKeyboard(page, numpad.getByText('1', { exact: true }))
  await expect(textarea).toHaveValue('1')
})
