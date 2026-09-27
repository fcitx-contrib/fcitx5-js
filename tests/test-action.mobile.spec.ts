import { expect, test } from '@playwright/test'
import { init } from './util'

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
