import Module from './module'

export function selectionChange() {
  const selection = window.getSelection()?.toString() ?? ''
  if (selection) {
    Module.ccall('write_primary', 'void', ['string'], [selection])
  }
}
