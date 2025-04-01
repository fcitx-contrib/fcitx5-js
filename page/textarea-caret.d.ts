declare function getCaretCoordinates(element: HTMLElement, position: number): {
  top: number
  left: number
  height: number
}

declare module 'textarea-caret' {
  export = getCaretCoordinates
}
