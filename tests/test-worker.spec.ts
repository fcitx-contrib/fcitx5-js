import { expect, test } from '@playwright/test'
import { init } from './util'

test('overlapping worker zip requests resolve with their own response', async ({ page }) => {
  await init(page)

  const contents = await page.evaluate(async () => {
    fcitx.useWorker = true
    const [first, second] = await Promise.all([
      fcitx.zip({ 'first.txt': new TextEncoder().encode('first') }),
      fcitx.zip({ 'second.txt': new TextEncoder().encode('second') }),
    ])
    return [
      new TextDecoder().decode(fcitx.UZIP.parse(first)['first.txt']),
      new TextDecoder().decode(fcitx.UZIP.parse(second)['second.txt']),
    ]
  })

  expect(contents).toEqual(['first', 'second'])
})
