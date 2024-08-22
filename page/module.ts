// @ts-expect-error bundled index.js will appear as post-js of Fcitx5.js, which defines Module.
const module = Module as EM_MODULE

export default module
