import * as cdk from 'aws-cdk-lib';
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from 'constructs';
import { OgiLambda, OgiLambdaProps } from '../src/constructs/OgiLambda';
import { OgiEventBus } from '../src/constructs/OgiEventBus';
import * as events from 'aws-cdk-lib/aws-events';

export interface CdkBackendStackProps extends cdk.StackProps {
  qualifier: string; // will be appended to the stack resources (10 characters max)
}

export class CdkBackendStack extends cdk.Stack {
  public readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: CdkBackendStackProps) {
    const appName = process.env.APP_NAME as string 
    super(scope, id, props);
    this.templateOptions.description = `(${appName}) - ${props?.qualifier} - ${this.templateOptions.description}`;
    // VPC Lookup
    this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${appName}-vpc`, {
      isDefault: true,
    });
    // Lambda
    const helloworldLambda = new OgiLambda(this, {
      lambdaName: 'hello-world',
      vpc: this.vpc,
    });
    // Event Bus
    const myEventBus = new OgiEventBus(this, {
      eventBusName: 'test-event-bus',
    });
    //Event rule
    myEventBus.addRule({
      ruleName: 'hello-world-lambda-scheduled-invocation',
      lambdaTarget: helloworldLambda.lambdaFunction,
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)), // Invoke every 5 minutes
    });
    
    //add permissions
    helloworldLambda.addPermissions(['events']);
  }
}
