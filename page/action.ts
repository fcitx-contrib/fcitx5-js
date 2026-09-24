import Module from './module'

export function activateMenuAction(id: number, inputContext: string, generation: number) {
  return Module.ccall('activate_menu_action', null, ['number', 'string', 'number'], [id, inputContext, generation])
}
