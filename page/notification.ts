import type { NotificationCallback } from './Fcitx5'
import Module from './module'

let notificationCallback: NotificationCallback = () => {}

export function setNotificationCallback(callback: NotificationCallback) {
  notificationCallback = callback
}

export function notify(name: string, icon: string, body: string, timeout: number, tipId: string, actionString?: string) {
  notificationCallback(name, icon, body, timeout, tipId, JSON.parse(actionString ?? '[]'))
}

export function activateNotificationAction(action: string, tipId?: string) {
  Module.ccall('notification_action', 'void', ['string', 'string'], [action, tipId ?? ''])
}
