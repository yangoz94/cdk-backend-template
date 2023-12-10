import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { OgiLambda } from './OgiLambda';

export interface OgiApiGatewayProps extends apigw.RestApiProps {
  apiGatewayName: string;
  endpoints?: EndpointConfig[];
}

export interface EndpointConfig {
  httpMethod: string;
  lambdaFunction: OgiLambda;
  resourcePath: string;
}

export class OgiApiGateway extends Construct {
  public readonly apiGateway: apigw.RestApi;

  constructor(scope: Construct, props: OgiApiGatewayProps) {
    super(scope, props.apiGatewayName);

    this.apiGateway = new apigw.RestApi(this, props.apiGatewayName, {
      ...props,
      restApiName: props.apiGatewayName,
    });

    // Add all endpoints
    if (props.endpoints) {
      for (const endpointConfig of props.endpoints) {
        this.addLambdaIntegration(endpointConfig);
      }
    }
  }

  public addLambdaIntegration(endpointConfig: EndpointConfig) {
    const lambdaIntegration = new apigw.LambdaIntegration(endpointConfig.lambdaFunction.lambdaFunction);
  
    // Split the resourcePath and create resources recursively
    const pathParts = endpointConfig.resourcePath.split('/').filter(part => part !== '');
    let parentResource = this.apiGateway.root;
  
    for (const part of pathParts) {
      const existingResource = parentResource.getResource(part);
      parentResource = existingResource ?? parentResource.addResource(part);
    }
  
    parentResource.addMethod(endpointConfig.httpMethod.toUpperCase(), lambdaIntegration);
  }
}
