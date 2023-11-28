import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');


type Permission = 's3' | 'dynamodb' | 'rds' | 'apigateway' | 'events' | 'ec2' | 'ecs' | 'sqs';

export interface OgiLambdaProps extends Omit<lambda.FunctionProps, 'runtime' | 'handler' | 'code'> {
  lambdaName: string;
  vpc: ec2.IVpc;
  permissions?: Permission[];
  runtime?: lambda.Runtime;
  handler?: string;
  code?: string;
}

export class OgiLambda extends Construct {
  public readonly lambdaFunction: lambda.Function;

  private permissionsMap: { [key: string]: string[] } = {
    s3: ["s3:*"], // S3
    dynamodb: ["dynamodb:*"], // DynamoDB
    rds: ["rds:*"], // RDS including Aurora
    apigateway: ["execute-api:*"], // API Gateway
    events: ["events:*"], // EventBridge
    ec2: ["ec2:*"], // EC2
    ecs: ["ecs:*"], // Fargate (Fargate is a launch type for ECS)
    sqs: ["sqs:*"], // SQS
  };

  constructor(scope: Construct, id: string, props: OgiLambdaProps, ) {
    const appName = process.env.APP_NAME as string;
    super(scope, id);

    this.lambdaFunction = new lambda.Function(this, `${props.lambdaName}`, {
      ...props,
      functionName: `${appName}-${props.lambdaName}`,
      vpc: props.vpc,
      runtime: props.runtime || lambda.Runtime.NODEJS_18_X,
      handler: props.handler || "index.handler",
      code:lambda.Code.fromAsset( props.code || `src/lambdas/${props.lambdaName}`)
    });

    if (props.permissions) {
      this.addPermissions(props.permissions);
    }
  }

  public addPermissions(services: string[]) {
    for (const service of services) {
      const actions = this.permissionsMap[service];
      if (actions) {
        this.lambdaFunction.addToRolePolicy(
          new iam.PolicyStatement({
            actions,
            resources: ["*"],
          })
        );
      }
    }
  }
}
