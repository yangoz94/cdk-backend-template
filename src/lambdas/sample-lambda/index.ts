import { Context, Callback, EventBridgeEvent } from 'aws-lambda';

export async function handler(event: EventBridgeEvent<string, any>, context: Context, callback: Callback) {
    console.log('Hello, world!')
    callback(null, 'Hello, world!')
    }

