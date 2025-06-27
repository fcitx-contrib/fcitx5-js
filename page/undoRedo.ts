import { getInputElement } from './focus'
import { sendSystemEventToKeyboard } from './keyboard'

interface BaseOperation {
  start: number
  text: string
  time: number
}

interface InsertOperation extends BaseOperation {
  type: 'insert'
}

interface DeleteOperation extends BaseOperation {
  type: 'delete'
}

interface ReplaceOperation extends BaseOperation {
  type: 'replace'
  oldText: string
}

type TextOperation = InsertOperation | DeleteOperation | ReplaceOperation

const undoes: TextOperation[] = []
const redoes: TextOperation[] = []
let currentText = ''
const STACK_LIMIT = 1024
const MERGE_TIMEOUT = 5000

function clearArray(array: Array<TextOperation>) {
  array.splice(0, array.length)
}

export function resetStacks(text: string) {
  currentText = text
  clearArray(undoes)
  clearArray(redoes)
  sendSystemEventToKeyboard({ type: 'UNDO', data: false })
  sendSystemEventToKeyboard({ type: 'REDO', data: false })
}

function replace(input: HTMLTextAreaElement | HTMLInputElement, start: number, end: number, text: string) {
  const pre = input.value.slice(0, start) + text
  input.value = pre + input.value.slice(end)
  input.selectionStart = input.selectionEnd = pre.length
  input.dispatchEvent(new Event('change'))
}

function calculateDiff(a: string, b: string): TextOperation {
  let prefixLength = 0
  while (prefixLength < a.length && prefixLength < b.length && a[prefixLength] === b[prefixLength]) {
    prefixLength++
  }

  let suffixLength = 0
  while (suffixLength < a.length - prefixLength && suffixLength < b.length - prefixLength
    && a[a.length - 1 - suffixLength] === b[b.length - 1 - suffixLength]) {
    suffixLength++
  }

  const remainingA = a.slice(prefixLength, a.length - suffixLength)
  const remainingB = b.slice(prefixLength, b.length - suffixLength)
  const time = new Date().getTime()

  if (remainingA && !remainingB) {
    return {
      type: 'delete',
      start: prefixLength,
      text: remainingA,
      time,
    }
  }
  else if (!remainingA && remainingB) {
    return {
      type: 'insert',
      start: prefixLength,
      text: remainingB,
      time,
    }
  }
  else {
    return {
      type: 'replace',
      start: prefixLength,
      oldText: remainingA,
      text: remainingB,
      time,
    }
  }
}

export function onTextChange(text: string) {
  if (currentText === text) {
    return
  }
  clearArray(redoes)
  const diff = calculateDiff(currentText, text)
  let merged = false
  if (undoes.length && !redoes.length) {
    const lastUndo = undoes[undoes.length - 1]
    if (diff.time - lastUndo.time < MERGE_TIMEOUT) {
      if (lastUndo.type === 'insert' && diff.type === 'insert') {
        if (lastUndo.start + lastUndo.text.length === diff.start) {
          // Continuous insert
          lastUndo.text += diff.text
          merged = true
        }
      }
      else if (lastUndo.type === 'delete' && diff.type === 'delete') {
        if (diff.start + diff.text.length === lastUndo.start) {
          // Continuous Backspace
          lastUndo.start = diff.start
          lastUndo.text = diff.text + lastUndo.text
          merged = true
        }
        else if (lastUndo.start === diff.start) {
          // Continuous Delete
          lastUndo.text += diff.text
          merged = true
        }
      }
    }
  }
  if (!merged) {
    undoes.push(diff)
    if (undoes.length > STACK_LIMIT) {
      undoes.shift()
    }
  }
  sendSystemEventToKeyboard({ type: 'UNDO', data: true })
  sendSystemEventToKeyboard({ type: 'REDO', data: false })
  currentText = text
}

export function undo() {
  const input = getInputElement()
  if (!input) {
    return
  }
  const lastUndo = undoes.pop()
  if (lastUndo) {
    switch (lastUndo.type) {
      case 'insert':
        replace(input, lastUndo.start, lastUndo.start + lastUndo.text.length, '')
        break
      case 'delete':
        replace(input, lastUndo.start, lastUndo.start, lastUndo.text)
        break
      case 'replace':
        replace(input, lastUndo.start, lastUndo.start + lastUndo.text.length, lastUndo.oldText)
        break
    }
    redoes.push(lastUndo)
    if (!undoes.length) {
      sendSystemEventToKeyboard({ type: 'UNDO', data: false })
    }
    sendSystemEventToKeyboard({ type: 'REDO', data: true })
  }
}

export function redo() {
  const input = getInputElement()
  if (!input) {
    return
  }
  const lastRedo = redoes.pop()
  if (lastRedo) {
    switch (lastRedo.type) {
      case 'insert':
        replace(input, lastRedo.start, lastRedo.start, lastRedo.text)
        break
      case 'delete':
        replace(input, lastRedo.start, lastRedo.start + lastRedo.text.length, '')
        break
      case 'replace':
        replace(input, lastRedo.start, lastRedo.start + lastRedo.oldText.length, lastRedo.text)
        break
    }
    undoes.push({ ...lastRedo, time: 0 })
    sendSystemEventToKeyboard({ type: 'UNDO', data: true })
    if (!redoes.length) {
      sendSystemEventToKeyboard({ type: 'REDO', data: false })
    }
  }
}
