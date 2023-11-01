import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface OgiLambdaProps {
    appName: string;
    lambdaName: string;
    vpc : ec2.IVpc;
    memorySize?: number;
    timeout?: cdk.Duration;
    epheramalStorageSize?: cdk.Size;
    reservedConcurrentExecutions?: number;
    logRetention?: RetentionDays;
    tracing?: lambda.Tracing;
}
export class OgiLambda extends Construct {
  constructor(scope: Construct, props: OgiLambdaProps) {
    super(scope, `${props.appName}-${props.lambdaName}`);

    new lambda.Function(this, `${props.appName}-${props.lambdaName}`, {
      functionName: `${props.appName}-${props.lambdaName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas/hello-world'),
      handler: 'index.handler',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      memorySize: props.memorySize || 128,
      timeout: props.timeout || cdk.Duration.minutes(1),
      ephemeralStorageSize: props.epheramalStorageSize || cdk.Size.mebibytes(512),
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      // Additional configurations:
      reservedConcurrentExecutions: 20, // Limit the number of concurrent executions
      logRetention: RetentionDays.ONE_WEEK, // Retain logs for 7 days
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
    });
  }
}
