window.fcitx = {
  createPanel(html: string) {
    const tree = document.createElement('div')
    tree.innerHTML = html
    for (const el of [...tree.children]) {
      switch (el.tagName) {
        case 'STYLE':
          document.head.append(el)
          break
        case 'DIV':
          document.body.append(el)
          break
        case 'SCRIPT':
          eval(el.textContent!) // eslint-disable-line no-eval
          break
      }
    }
  },
}
const apis = [
  'log',
  'copyHTML',
  'select',
  'highlight',
  'page',
  'scroll',
  'askActions',
  'action',
  'resize',
]
for (const api of apis) {
  const name = `_${api}`
  window.fcitx[name] = (...args) => window.Module.ccall('web_action', 'void', ['string', 'string'], [name, JSON.stringify(args)])
}

window.Module = { ...window.Module, ...{
  onRuntimeInitialized() {
  },
} }

const script = document.createElement('script')
script.src = './Fcitx5.js'
document.body.append(script)
