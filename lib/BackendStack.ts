import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { OgiLambda, OgiLambdaProps } from "../src/constructs/OgiLambda";
import { OgiScheduledRule } from "../src/constructs/OgiScheduledRule";
import { OgiEventBus } from "../src/constructs/OgiEventBus";
import { OgiVpc } from "../src/constructs/OgiVpc";
import { OgiApiGateway } from "../src/constructs/OgiApiGateway";

export interface BackendStackProps extends cdk.StackProps {
  qualifier: string; // will be appended to the stack resources (10 characters max)
  appName: string;
  vpc: IVpc;
}
export class BackendStack extends cdk.Stack {
  private vpc: IVpc;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    /********** VPC LOOKUP**********/
    this.vpc = props.vpc;

    /**********LAMBDA**********/
    const helloWorldLambda = new OgiLambda(this, {
      appName: props.appName,
      lambdaName: "hello-world",
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const githubLambda = new OgiLambda(this, {
      appName: props.appName,
      lambdaName: "github-sample",
      vpc: this.vpc,
      permissions: ["dynamodb"],
      nodeModules: ["axios"],
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    /**********API GATEWAY**********/
    const apiGateway = new OgiApiGateway(this, {
      apiGatewayName: `${props.appName}-api-gateway`,
      endpoints: [
        {
          httpMethod: "GET",
          lambdaFunction: githubLambda,
          resourcePath: "github",
        },
        // TODO: Add more endpoints here if needed
      ],
    });

    /**********EVENT BUS**********/
    const myEventBus = new OgiEventBus(this, {
      appName: props.appName,
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
    const scheduledRuleOption1 = new OgiScheduledRule(this,'ScheduledRule1',  {
      appName: props.appName,
      ruleName: `ScheduledRule1`,
      lambdaTarget: helloWorldLambda.lambdaFunction,
      scheduleConfig: {
        at: "06:30", // UTC
      },
    });

    /**********SCHEDULED RULE OPTION 2**********/
    const scheduledRuleOption2 = new OgiScheduledRule(this,'ScheduledRule2', {
      appName: props.appName,
      ruleName: `ScheduledRule2`,
      lambdaTarget: helloWorldLambda.lambdaFunction,
      scheduleConfig: {
        every: 7,
        unit: "days",
      },
    });
  }
}
