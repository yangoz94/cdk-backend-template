import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';


export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
   console.log("EVENT: \n" + JSON.stringify(event, null, 2))

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Greetings!"
        })
    }

}
