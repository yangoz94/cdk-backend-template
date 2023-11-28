import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { OgiLambda, OgiLambdaProps } from "../src/constructs/OgiLambda";
import * as events from "aws-cdk-lib/aws-events";
import { OgiScheduledRule } from "../src/constructs/OgiScheduledRule";
import { OgiEventBus } from "../src/constructs/OgiEventBus";

export interface CdkBackendStackProps extends cdk.StackProps {
  qualifier: string; // will be appended to the stack resources (10 characters max)
}
export class CdkBackendStack extends cdk.Stack {
  public readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: CdkBackendStackProps) {
    const appName = process.env.APP_NAME as string;
    super(scope, id, props);
    this.templateOptions.description = `(${appName}) - ${props?.qualifier} - ${this.templateOptions.description}`;

    /**********VPC LOOKUP**********/ 
    this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${appName}-vpc`, {
      isDefault: true,
    });

    /**********LAMBDA**********/ 
    const sampleLambda
     = new OgiLambda(this, 'sample-lambda', {
      lambdaName: `sample-lambda`,
      vpc: this.vpc,
      permissions: ["dynamodb"],
      allowPublicSubnet: true,
    });
  
    /**********EVENT BUS**********/ 
    const myEventBus = new OgiEventBus(this, {
      eventBusName: "test-event-bus",
    });
    
    /**********EVENT RULE**********/ 
    myEventBus.addRule({
      ruleName: `EventRule`,
      lambdaTarget: sampleLambda
      .lambdaFunction,
      eventPattern: {
        source: ["dynamodb"],
        detailType: ["NewRegistration"],
      },
    });
    
    /**********SCHEDULED RULE OPTION 1**********/ 
    const ruleOption1 = new OgiScheduledRule(this, {
      ruleName: `ScheduledRule1`,
      lambdaTarget: sampleLambda
      .lambdaFunction,
      scheduleConfig: {
        at: '06:30' // UTC 
      }
    });

    /**********SCHEDULED RULE OPTION 2**********/ 
    const ruleOption2 = new OgiScheduledRule(this, {
      ruleName: `ScheduledRule2`,
      lambdaTarget: sampleLambda
      .lambdaFunction,
      scheduleConfig: {
        every: 7,
        unit: 'days'
      }
    });
  }
}
