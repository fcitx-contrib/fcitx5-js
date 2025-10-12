import { expect, test } from '@playwright/test'
import { init } from './util'

test.use({ locale: 'zh-CN' })

test('Keyboard name', async ({ page }) => {
  await init(page)

  const inputMethods = await page.evaluate(() => fcitx.getInputMethods())
  expect(inputMethods[0].displayName).toEqual('键盘 - 英语（美国）')
})

test('Language name', async ({ page }) => {
  await init(page)

  const name = await page.evaluate(() => fcitx.getLanguageName('ami'))
  expect(name).toEqual('阿美语')
})
