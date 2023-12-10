import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const response = await axios.get('https://api.github.com/users/yangoz94');
        const data = response.data;
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: JSON.stringify(data),
                input: event,
            }, null, 2),
        };
    }
    catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err as any,
                input: event,
            }, null, 2),
        };
    }   

}
