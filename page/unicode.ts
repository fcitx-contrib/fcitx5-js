const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const textEncoder = new TextEncoder()

export function graphemeIndices(text: string): number[] {
  const segments = segmenter.segment(text)
  return Array.from(segments, segment => segment.index)
}

export function utf8Index2JS(text: string, index: number) {
  // Convert UTF-8 index to JS string index
  let i = text.length
  const indices = graphemeIndices(text)
  for (const idx of indices) {
    const { length } = textEncoder.encode(text.slice(0, idx))
    if (length === index) {
      i = idx
      break
    }
  }
  return i
}
