import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export enum Permission {
  S3 = "s3",
  DynamoDB = "dynamodb",
  RDS = "rds",
  APIGateway = "apigateway",
  Events = "events",
  EC2 = "ec2",
  ECS = "ecs",
  SQS = "sqs",
}

export interface OgiLambdaProps
  extends Omit<lambda.FunctionProps, "runtime" | "handler" | "code"> {
  appName: string;
  lambdaName: string;
  permissions?: string[];
  runtime?: lambda.Runtime;
  handler?: string;
  nodeModules?: string[];
  externalModules?: string[];
  allowApiGatewayInvoke?: boolean;
  vpc: ec2.IVpc;
  vpcSubnets?: ec2.SubnetSelection;
}

export class OgiLambda extends Construct {
  public readonly lambdaFunction: lambda.Function;

  private permissionsMap: { [key in Permission]: string[] } = {
    [Permission.S3]: ["s3:*"], // S3
    [Permission.DynamoDB]: ["dynamodb:*"], // DynamoDB
    [Permission.RDS]: ["rds:*"], // RDS including Aurora
    [Permission.APIGateway]: ["execute-api:*"], // API Gateway
    [Permission.Events]: ["events:*"], // EventBridge
    [Permission.EC2]: ["ec2:*"], // EC2
    [Permission.ECS]: ["ecs:*"], // Fargate (Fargate is a launch type for ECwS)
    [Permission.SQS]: ["sqs:*"], // SQS
  };

  constructor(scope: Construct, props: OgiLambdaProps) {
    super(scope, props.lambdaName);

    this.lambdaFunction = new nodejs.NodejsFunction(this, props.lambdaName, {
      ...props,
      functionName: `${props.appName}-${props.lambdaName}`,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      runtime: props.runtime || lambda.Runtime.NODEJS_LATEST,
      architecture: lambda.Architecture.ARM_64,
      handler: props.handler || "index.handler",
      entry: path.join(__dirname, `../../src/lambdas/${props.lambdaName}.ts`),
      bundling: {
        sourceMap: false,
        nodeModules: props.nodeModules || [],
        externalModules: props.externalModules || ["@aws-sdk/*", "aws-lambda"],
        format: OutputFormat.ESM,
      },
    });

    // Add permission for API Gateway to invoke this Lambda function by default
    if (props.allowApiGatewayInvoke !== false) {
      // If not explicitly set to false
      this.lambdaFunction.addPermission("ApiGatewayInvoke", {
        principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      });
    }

    if (props.permissions) {
      this.addPermissions(props.permissions);
    }
  }

  public addPermissions(services: string[]) {
    for (const service of services) {
      const permission = this.permissionsMap[service as Permission];
      if (permission) {
        this.lambdaFunction.addToRolePolicy(
          new iam.PolicyStatement({
            actions: permission,
            resources: ["*"],
          })
        );
      } else {
        console.error(`Invalid permission: ${service}`);
      }
    }
  }
}
