import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { OgiLambda, OgiLambdaProps } from "../constructs/OgiLambda";
import { OgilLoadBalancedECSFargate } from "../constructs/OgilLoadBalancedECSFargate";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export interface BackendStackProps extends cdk.NestedStackProps {
  appName: string;
  ddbTable: ITable;
  vpc: IVpc;
  domainName: string;
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
      vpc: this.vpc,
      appName: props.appName,
      lambdaName: "helloworld",
      allowPublicSubnet: true,
    });

    const greetingsLambda = new OgiLambda(this, {
      vpc: this.vpc,
      appName: props.appName,
      lambdaName: "greeting",
      permissions: ["dynamodb"],
      nodeModules: ["axios"], // just an example
      allowPublicSubnet: true,
    });

    //   /**********API GATEWAY**********/
    //   const apiGateway = new OgiApiGateway(this, {
    //     apiGatewayName: `${props.appName}-api-gateway`,
    //     endpoints: [
    //       {
    //         // Example protected endpoint
    //         httpMethod: "GET",
    //         lambdaFunction: greetingsLambda,
    //         resourcePath: "/greetings",
    //         apiKey:  props.apiGwApiKey,
    //       },
    //       {
    //         // Example unprotected endpoint
    //         httpMethod: "GET",
    //         lambdaFunction: helloWorldLambda,
    //         resourcePath: "/hello-world",
    //       }
    //       // TODO: Add more endpoints here if needed
    //     ],
    //   });

    //   /**********EVENT BUS**********/
    //   const myEventBus = new OgiEventBus(this, {
    //     eventBusName: `${props.appName}-event-bus`,
    //   });

    //   /**********EVENT RULE**********/
    //   myEventBus.addRule({
    //     ruleName: `${props.appName}-event-rule`,
    //     lambdaTarget: helloWorldLambda,
    //     eventPattern: {
    //         source: ["dynamodb"],
    //         detailType: ["NewRegistration"],
    //     },
    // });

    //   /**********SCHEDULED RULE OPTION 1**********/
    //   const scheduledRuleOption1 = new OgiScheduledRule(this,'ScheduledRule1',  {
    //     ruleName: `${props.appName}-ScheduledRule1`,
    //     lambdaTarget: helloWorldLambda,
    //     scheduleConfig: {
    //       at: "06:30", // UTC every day
    //     },
    //   });

    //   /**********SCHEDULED RULE OPTION 2**********/
    //   const scheduledRuleOption2 = new OgiScheduledRule(this,'ScheduledRule2', {
    //     ruleName: `${props.appName}-ScheduledRule2`,
    //     lambdaTarget: helloWorldLambda,
    //     scheduleConfig: {
    //       at: "06:30", // UTC
    //       interval: {
    //         value: 7,
    //         unit: "days",
    //       },
    //     },
    //   });

    /********** LOADBALANCED ECS FARGATE SERVICE**********/
    const fargateService = new OgilLoadBalancedECSFargate(
      this,
      `${props.appName}-fargate-service`,
      {
        appName: props.appName,
        domainName: props.domainName,
        subdomain: "api",
        serviceName: "go-web-server",
        vpc: props.vpc,
        ddbTable: props.ddbTable,
        environmentVariables: {
          APP_NAME: props.appName,
          TABLE_NAME: props.ddbTable.tableName,
        },
        imagePathRelativeToRoot: "src/containers/go-web-server/",
        enableAutoScaling: false,
      }
    );
  }
}
