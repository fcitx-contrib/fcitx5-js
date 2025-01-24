import { lsDir } from './fs'

export function getLocale() {
  let supported: string[]
  try {
    supported = lsDir('/usr/share/locale')
  }
  catch {
    supported = []
  }
  for (const language of navigator.languages) {
    if (language === 'zh-HK' || language === 'zh-TW') {
      return 'zh_TW'
    }
    if (language === 'zh-CN' || language === 'zh-SG') {
      return 'zh_CN'
    }
    const lang = language.split('-')[0]
    // en is not in locale dir.
    if (lang === 'en' || supported.includes(lang)) {
      return lang
    }
  }
  return 'en'
}
