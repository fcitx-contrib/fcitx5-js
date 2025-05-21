import type { Locator, Page } from '@playwright/test'

export async function init(page: Page) {
  await page.goto('http://localhost:9000')
  return page.evaluate(() => {
    return window.fcitxReady
  })
}

export async function getBox(locator: Locator) {
  return (await locator.boundingBox())!
}
