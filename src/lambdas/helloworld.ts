import { Context, EventBridgeEvent } from 'aws-lambda';

export async function handler(event: EventBridgeEvent<string, any>, context: Context) {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello World!',
            input: event,
        }, null, 2),
    }
}