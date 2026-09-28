import { expect, test } from '@playwright/test'
import { expectKeyboardShown, init, recordedFcitxCalls, recordFcitxCalls } from './util'

test('invalid menu action ID is ignored', async ({ page }) => {
  await init(page)
  await page.evaluate(() => {
    const sendEventToKeyboard = fcitx.sendEventToKeyboard
    fcitx.sendEventToKeyboard = (event: string) => {
      const parsed = JSON.parse(event)
      if (parsed.type === 'CANDIDATES') {
        fcitx.__candidateContext = parsed.data
      }
      else if (parsed.type === 'STATUS_AREA') {
        fcitx.__statusAreaContext = parsed.data
      }
      return sendEventToKeyboard(event)
    }
  })

  await page.locator('textarea').focus()
  await page.keyboard.press('Control+Alt+Shift+U')
  await expect.poll(() => page.evaluate(() => fcitx.__candidateContext)).toBeTruthy()

  // A null action dereference traps in Wasm and rejects page.evaluate().
  await page.evaluate(() => {
    const context = fcitx.__statusAreaContext ?? {
      inputContext: fcitx.__candidateContext.inputContext,
      generation: 0,
    }
    fcitx.activateMenuAction(0x7FFFFFFF, context.inputContext, context.generation)
  })
})

for (const { name, direction, triggerName } of [
  { name: 'Unicode', direction: -1, triggerName: 'trigger_unicode' },
  { name: 'Quick Phrase', direction: 1, triggerName: 'trigger_quickphrase' },
]) {
  test(`long press comma triggers ${name} mode for the focused input context`, async ({ page }) => {
    await init(page)
    await recordFcitxCalls(page)

    await page.locator('textarea').tap()
    await expectKeyboardShown(page)
    const comma = page.locator('.fcitx-keyboard').getByText(',', { exact: true })
    const box = (await comma.boundingBox())!
    await page.evaluate(async ({ x, y, dx }) => {
      const mask = document.querySelector('.fcitx-keyboard-mask')!
      const dispatch = (type: string, touch: Touch, touches: Touch[]) => {
        const event = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperties(event, {
          changedTouches: { value: [touch] },
          touches: { value: touches },
        })
        mask.dispatchEvent(event)
      }
      let touch = { identifier: 1, target: mask, clientX: x, clientY: y } as unknown as Touch
      dispatch('touchstart', touch, [touch])
      await new Promise(resolve => setTimeout(resolve, 400))
      touch = { identifier: 1, target: mask, clientX: x + dx, clientY: y } as unknown as Touch
      dispatch('touchmove', touch, [touch])
      dispatch('touchend', touch, [])
    }, {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      dx: box.width * 1.5 * direction,
    })

    const calls = await recordedFcitxCalls(page)
    const create = calls.find(call => call.name === 'create_input_context')!
    const reset = calls.find(call => call.name === 'reset_input')!
    const trigger = calls.find(call => call.name === triggerName)!
    expect(reset.args).toEqual([create.result])
    expect(trigger.args).toEqual([create.result])
    expect(calls.indexOf(reset)).toBeLessThan(calls.indexOf(trigger))
  })
}
