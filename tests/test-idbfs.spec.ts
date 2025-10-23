import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { init } from './util'

async function readTextFile(page: Page, path: string): Promise<string> {
  return page.evaluate(({ path }) => window.fcitx.Module.FS.readFile(path, { encoding: 'utf8' }), { path })
}

test('IDBFS works', async ({ page }) => {
  await init(page)

  expect(await page.evaluate(() => window.fcitx.Module.FS.readdir('/backup')), '/backup/usr is automatically created').toEqual(['.', '..', 'usr'])

  await page.evaluate(() => window.fcitx.Module.FS.mkdirTree('/backup/usr/local'))
  await page.evaluate(() => window.fcitx.Module.FS.writeFile('/backup/usr/local/foo.txt', 'bar'))
  await page.evaluate(() => window.fcitx.Module.FS.writeFile('/home/web_user/bar.txt', 'baz'))
  await init(page)
  expect(await readTextFile(page, '/backup/usr/local/foo.txt'), 'Data persists after reload').toBe('bar')
  expect(await readTextFile(page, '/home/web_user/bar.txt')).toBe('baz')

  await page.evaluate(() => window.fcitx.reset())
  await init(page)
  expect(await page.evaluate(() => window.fcitx.Module.FS.readdir('/backup/usr')), 'Data cleared after reset').toEqual(['.', '..'])
  expect(await page.evaluate(() => window.fcitx.Module.FS.readdir('/home/web_user'))).toEqual(['.', '..', '.config'])
})
