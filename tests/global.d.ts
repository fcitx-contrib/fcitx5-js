declare global {
  interface Window {
    fcitxReady: Promise<void>
  }
}

export {}
