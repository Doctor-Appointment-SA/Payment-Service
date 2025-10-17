import { EventEmitter } from 'events';

export const paymentBus = new EventEmitter();
paymentBus.setMaxListeners(0);

