import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { OgiLambda, OgiLambdaProps } from "../src/constructs/OgiLambda";
import { OgiScheduledRule } from "../src/constructs/OgiScheduledRule";
import { OgiEventBus } from "../src/constructs/OgiEventBus";
import { OgiVpc } from "../src/constructs/OgiVpc";
import { OgiApiGateway } from "../src/constructs/OgiApiGateway";

export interface CdkBackendStackProps extends cdk.StackProps {
  qualifier: string; // will be appended to the stack resources (10 characters max)
  appName: string;
}
export class CdkBackendStack extends cdk.Stack {
  public readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: CdkBackendStackProps) {
    super(scope, id, props);
    this.templateOptions.description = `(${props.appName}) - ${props?.qualifier} - ${this.templateOptions.description}`;

    /**********VPC LOOKUP OR CREATION**********/
    try {
      this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${props.appName}-vpc`, {
        vpcName: `${props.appName}-vpc`, // Look up the VPC by name
      });
    } catch (error) {
      this.vpc = new OgiVpc(this, {
        appName: props.appName,
        vpcEndpoints: ["dynamodb", "s3"], // Add VPC endpoints for DynamoDB and S3 in the VPC
        privateSubnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
      }).vpc;
    }

    /**********LAMBDA**********/
    const helloWorldLambda = new OgiLambda(this, {
      lambdaName: "hello-world",
      vpc: this.vpc,
    });

    const githubLambda = new OgiLambda(this, {
      lambdaName: "github-sample",
      vpc: this.vpc,
      permissions: ["dynamodb"],
      nodeModules: ["axios"],
    });

    /**********API GATEWAY**********/
    const apiGateway = new OgiApiGateway(this, {
      apiGatewayName: `${props.appName}-api-gateway`,
      endpoints: [
        { httpMethod: 'GET', lambdaFunction: githubLambda, resourcePath: 'github' },
        // TODO: Add more endpoints here if needed
      ],
    });
    

    /**********EVENT BUS**********/
    const myEventBus = new OgiEventBus(this, {
      eventBusName: "test-event-bus",
    });

    /**********EVENT RULE**********/
    myEventBus.addRule({
      ruleName: `event-rule`,
      lambdaTarget: helloWorldLambda.lambdaFunction,
      eventPattern: {
        source: ["dynamodb"],
        detailType: ["NewRegistration"],
      },
    });

    /**********SCHEDULED RULE OPTION 1**********/
    const scheduledRuleOption1 = new OgiScheduledRule(this, {
      ruleName: `ScheduledRule1`,
      lambdaTarget: helloWorldLambda.lambdaFunction,
      scheduleConfig: {
        at: "06:30", // UTC
      },
    });

    /**********SCHEDULED RULE OPTION 2**********/
    const scheduledRuleOption2 = new OgiScheduledRule(this, {
      ruleName: `ScheduledRule2`,
      lambdaTarget: helloWorldLambda.lambdaFunction,
      scheduleConfig: {
        every: 7,
        unit: "days",
      },
    });
  }
}
