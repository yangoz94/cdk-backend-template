import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { OgiLambda, OgiLambdaProps } from "../src/constructs/OgiLambda";
import { OgiScheduledRule } from "../src/constructs/OgiScheduledRule";
import { OgiEventBus } from "../src/constructs/OgiEventBus";
import { OgiVpc } from "../src/constructs/OgiVpc";
import { OgiApiGateway } from "../src/constructs/OgiApiGateway";

export interface BackendStackProps extends cdk.NestedStackProps {
  qualifier: string; // will be appended to the stack resources (10 characters max)
  appName: string;
  vpc: IVpc;
  apiGwApiKey?: string;
}
export class BackendStack extends cdk.NestedStack {
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

    const greetingsLambda = new OgiLambda(this, {
      appName: props.appName,
      lambdaName: "greetings",
      vpc: this.vpc,
      permissions: ["dynamodb"],
      nodeModules: ["axios"], // just an example
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    /**********API GATEWAY**********/
    const apiGateway = new OgiApiGateway(this, {
      apiGatewayName: `${props.appName}-api-gateway`,
      endpoints: [
        {
          // Example protected endpoint
          httpMethod: "GET",
          lambdaFunction: greetingsLambda,
          resourcePath: "/greetings",
          apiKey:  props.apiGwApiKey,
        },
        {
          // Example unprotected endpoint
          httpMethod: "GET",
          lambdaFunction: helloWorldLambda,
          resourcePath: "/hello-world",
        }
        // TODO: Add more endpoints here if needed
      ],
    });

    /**********EVENT BUS**********/
    const myEventBus = new OgiEventBus(this, {
      eventBusName: `${props.appName}-event-bus`,
    });
    

    /**********EVENT RULE**********/
    myEventBus.addRule({
      ruleName: `${props.appName}-event-rule`,
      lambdaTarget: helloWorldLambda,
      eventPattern: {
          source: ["dynamodb"],
          detailType: ["NewRegistration"],
      },
  });

    /**********SCHEDULED RULE OPTION 1**********/
    const scheduledRuleOption1 = new OgiScheduledRule(this,'ScheduledRule1',  {
      ruleName: `${props.appName}-ScheduledRule1`,
      lambdaTarget: helloWorldLambda,
      scheduleConfig: {
        at: "06:30", // UTC every day
      },
    }); 

    /**********SCHEDULED RULE OPTION 2**********/
    const scheduledRuleOption2 = new OgiScheduledRule(this,'ScheduledRule2', {
      ruleName: `${props.appName}-ScheduledRule2`,
      lambdaTarget: helloWorldLambda,
      scheduleConfig: {
        at: "06:30", // UTC
        interval: {
          value: 7,
          unit: "days",
        },
      },
    });
  }
}
