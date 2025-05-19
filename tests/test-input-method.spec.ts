import { expect, test } from '@playwright/test'
import { init } from './util'

test('Generate profile', async ({ page }) => {
  await init(page)

  await page.evaluate(() => {
    window.fcitx.setInputMethods(['keyboard-th'])
  })
  expect(await page.evaluate(() => window.fcitx.Module.FS.readFile('/home/web_user/.config/fcitx5/profile', { encoding: 'utf8' }))).toEqual(
    `[Groups/0]
# Group Name
Name=Default
# Layout
Default Layout=us
# Default Input Method
DefaultIM=keyboard-th

[Groups/0/Items/0]
# Name
Name=keyboard-th
# Layout
Layout=

[GroupOrder]
0=Default

`,
  )
})
