import type { Locator, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { expectKeyboardShown, getSelection, init, recordedFcitxCalls, recordFcitxCalls, tapKeyboard } from './util'

// Held touches are synthetic; focus, disable and removal are scripted host changes.
// These cases do not establish that a second physical finger can switch focus.
let touchId = 0

async function startTouch(page: Page, key: Locator, direct = false) {
  const box = (await key.boundingBox())!
  let x = box.x + box.width / 2
  let y = box.y + box.height / 2
  const id = touchId++
  const target = (await (direct
    ? key
    : page.locator('.fcitx-keyboard-mask')).elementHandle())!
  const dispatch = (type: string) => target.evaluate((element, { type, x, y, id }) => {
    const touch = {
      identifier: id,
      target: element,
      clientX: x,
      clientY: y,
    } as unknown as Touch
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperties(event, {
      changedTouches: {
        value: [touch],
      },
      touches: {
        value: type === 'touchend'
          ? []
          : [touch],
      },
    })
    element.dispatchEvent(event)
  }, { type, x, y, id })
  await dispatch('touchstart')
  return {
    end: () => dispatch('touchend'),
    move(dx: number, dy: number) {
      x += dx
      y += dy
      return dispatch('touchmove')
    },
  }
}

test.beforeEach(async ({ page }) => {
  await init(page)
  await recordFcitxCalls(page)
  await page.locator('textarea').tap()
  await expectKeyboardShown(page)
  await page.evaluate(() => {
    const textarea = document.querySelector('textarea')!
    textarea.value = 'abcdef'
    textarea.setSelectionRange(6, 6)
    const input = document.querySelector('input')!
    input.value = 'uvwxyz'
    input.setSelectionRange(6, 6)
  })
  await page.clock.install({ time: 0 })
  await page.clock.pauseAt(1000)
})

for (const boundary of [
  'other input',
  'blur and refocus',
  'disable and enable',
  'detach',
] as const) {
  test(`Keyboard Backspace repeat stops across ${boundary}`, async ({ page }) => {
    const textarea = page.locator('textarea')
    const original = (await textarea.elementHandle())!
    const firstContext = (await recordedFcitxCalls(page)).find(call => call.name === 'focus_in')!.args[0]
    const press = await startTouch(page, page.locator('.fcitx-keyboard .fcitx-keyboard-backspace'))
    await page.clock.runFor(380)
    await expect(textarea).toHaveValue('abcde')
    await page.evaluate((boundary) => {
      const textarea = document.querySelector('textarea')!
      const input = document.querySelector('input')!
      switch (boundary) {
        case 'other input':
          input.focus()
          break
        case 'blur and refocus':
          textarea.blur()
          textarea.focus()
          break
        case 'disable and enable':
          fcitx.disable()
          fcitx.enable()
          break
        case 'detach':
          textarea.remove()
          input.focus()
          break
      }
    }, boundary)
    await page.clock.runFor(180)
    expect(await original.evaluate(element => (element as HTMLTextAreaElement).value)).toBe('abcde')
    await expect(page.locator('input')).toHaveValue('uvwxyz')
    await press.end()
    const changedElement = boundary === 'other input' || boundary === 'detach'
    const target = changedElement
      ? page.locator('input')
      : textarea
    await tapKeyboard(page, 'k(')
    await expect(target).toHaveValue(changedElement ? 'uvwxyzk' : 'abcdek')
    if (boundary === 'other input' || boundary === 'blur and refocus') {
      await textarea.focus()
      const calls = await recordedFcitxCalls(page)
      expect(calls.filter(call => call.name === 'destroy_input_context')).toEqual([])
      expect(calls.filter(call => call.name === 'focus_in').at(-1)!.args[0]).toBe(firstContext)
    }
  })
}

test('A pending letter cannot commit to a later input after blur', async ({ page }) => {
  const press = await startTouch(page, page.locator('.fcitx-keyboard').getByText('k('))
  await page.locator('input').focus()
  await press.end()
  await expect(page.locator('textarea')).toHaveValue('abcdef')
  await expect(page.locator('input')).toHaveValue('uvwxyz')
  await tapKeyboard(page, 'k(')
  await expect(page.locator('input')).toHaveValue('uvwxyzk')
})

test('A held Shift cannot carry into a later input after blur', async ({ page }) => {
  const press = await startTouch(page, page.locator('.fcitx-keyboard-shift'))
  await expect(page.locator('.fcitx-keyboard').getByText('k(')).toHaveText('K(')
  await page.locator('input').focus()
  await expect(page.locator('.fcitx-keyboard').getByText('k(')).toHaveText('k(')
  await press.end()
  await tapKeyboard(page, 'k(')
  await expect(page.locator('input')).toHaveValue('uvwxyzk')
})

test('A Backspace slide abandoned on blur keeps the preview and never deletes in the next input', async ({ page }) => {
  const press = await startTouch(page, page.locator('.fcitx-keyboard .fcitx-keyboard-backspace'))
  await press.move(-60, 0)
  expect(await getSelection(page.locator('textarea'))).toEqual([4, 6])
  await page.locator('input').evaluate((element: HTMLInputElement) => {
    element.focus()
    element.setSelectionRange(1, 4)
  })
  await press.end()
  await expect(page.locator('textarea')).toHaveValue('abcdef')
  expect(await getSelection(page.locator('textarea'))).toEqual([4, 6])
  await expect(page.locator('input')).toHaveValue('uvwxyz')
  expect(await getSelection(page.locator('input'))).toEqual([1, 4])
})

test('An editor arrow repeat cannot move the caret in the next input', async ({ page }) => {
  await page.locator('.fcitx-keyboard-toolbar .fcitx-keyboard-toolbar-button:nth-child(4)').tap()
  const left = page.locator('.fcitx-keyboard-editor-button-container').nth(0)
  const press = await startTouch(page, left, true)
  await page.clock.runFor(380)
  expect(await getSelection(page.locator('textarea'))).toEqual([5, 5])
  await page.locator('input').focus()
  await page.clock.runFor(180)
  await press.end()
  expect(await getSelection(page.locator('input'))).toEqual([6, 6])
})
