const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function graphemeIndices(text: string): number[] {
  const segments = segmenter.segment(text)
  return Array.from(segments, segment => segment.index)
}
