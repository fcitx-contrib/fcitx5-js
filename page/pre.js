Module = {
  printErr(message) {
    const match = message.match(/^[EWID]/)
    if (match) {
      ({
        E: console.error,
        W: console.warn,
        I: console.info,
        D: console.debug
      })[message[0]](message.slice(1))
    } else {
      console.error(message)
    }
  }
}
