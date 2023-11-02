import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'; // Import the PolicyStatement class

export interface OgiLambdaProps {
    lambdaName: string;
    vpc : ec2.IVpc;
    handler?: string;
    codeDirectory?: string;
    memorySize?: number;
    timeout?: cdk.Duration;
    epheramalStorageSize?: cdk.Size;
    reservedConcurrentExecutions?: number;
    logRetention?: RetentionDays;
    tracing?: lambda.Tracing;
}
export class OgiLambda extends Construct {
  public readonly lambdaFunction: lambda.Function;

  private permissionsMap: { [key: string]: string[] } = {
    s3: ['s3:*'], // S3
    dynamodb: ['dynamodb:*'], // DynamoDB
    rds: ['rds:*'], // RDS including Aurora
    apigateway: ['execute-api:*'], // API Gateway
    events: ['events:*'], // EventBridge
    ec2: ['ec2:*'], // EC2
    ecs: ['ecs:*'], // Fargate (Fargate is a launch type for ECS)
    sqs: ['sqs:*'], // SQS
  };
  
  
  constructor(scope: Construct, props: OgiLambdaProps) {
    const appName = process.env.APP_NAME as string;
    super(scope, `${appName}-${props.lambdaName}`);

    this.lambdaFunction = new lambda.Function(this, `${appName}-${props.lambdaName}`, {
      functionName: `${appName}-${props.lambdaName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(props.codeDirectory || `src/lambdas/${props.lambdaName}`),
      handler: props.handler || 'index.handler',
      vpc: props.vpc,
      allowPublicSubnet: true,
      memorySize: props.memorySize || 128,
      timeout: props.timeout || cdk.Duration.minutes(1),
      ephemeralStorageSize: props.epheramalStorageSize || cdk.Size.mebibytes(512),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      // Additional configurations:
      reservedConcurrentExecutions: props.reservedConcurrentExecutions || 20, // Limit the number of concurrent executions
      logRetention: props.logRetention || RetentionDays.ONE_WEEK, // Retain logs for 7 days
      tracing: props.tracing || lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });
  }

  public addPermissions(services: string[]) {
    for (const service of services) {
      const actions = this.permissionsMap[service];
      if (actions) {
        this.lambdaFunction.addToRolePolicy(new PolicyStatement({
          actions,
          resources: ['*'],
        }));
      }
    }
  }
}
