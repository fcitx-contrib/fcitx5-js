import { getInputElement } from './focus'

export function commit(text: string) {
  const input = getInputElement()
  if (!input) {
    return
  }
  const { selectionStart, selectionEnd } = input
  input.value = input.value.slice(0, selectionStart!) + text + input.value.slice(selectionEnd!)
  input.selectionEnd = selectionStart! + text.length
}
