import { EventEmitter } from 'events';

export const trackingBus = new EventEmitter();
trackingBus.setMaxListeners(0);

