import Module from './module'

export function getMenuActions() {
  return JSON.parse(Module.ccall('get_menu_actions', 'string', [], []))
}

export function activateMenuAction(id: number) {
  return Module.ccall('activate_menu_action', 'void', ['number'], [id])
}
