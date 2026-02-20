export function cli(command: string, ...args: string[]): number {
  try {
    return window.fcitx.Module.ccall('cli', 'number', ['string', 'string'], [command, JSON.stringify(args)])
  }
  catch (e) {
    console.error(e)
    return 1
  }
}
