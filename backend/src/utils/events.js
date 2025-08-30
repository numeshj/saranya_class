import { EventEmitter } from 'events';
export const appEvents = new EventEmitter();
export function emitEvent(type, payload) {
  appEvents.emit('event', { type, payload, ts: Date.now() });
}