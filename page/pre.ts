import ErrorStackParser from 'error-stack-parser'

const urlPrefix = (() => {
  let err: Error
  try {
    throw new Error()
  }
  catch (e) {
    err = e as Error
  }
  const fileName = ErrorStackParser.parse(err)[0].fileName!
  return fileName.slice(0, fileName.lastIndexOf('/') + 1)
})()

// @ts-expect-error defined by emscripten
Module = {
  printErr(message: string) {
    const match = message.match(/^[EWID]/)
    if (match) {
      ({
        E: console.error,
        W: console.warn,
        I: console.info,
        D: console.debug,
      })[message[0] as 'E' | 'W' | 'I' | 'D'](message.slice(1))
    }
    else {
      console.error(message)
    }
  },
  locateFile(file: string) {
    return urlPrefix + file
  },
}
