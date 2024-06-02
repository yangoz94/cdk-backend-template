import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps } from "aws-cdk-lib";
import { InfrastructureStack } from "./nested-stacks/InfrastructureStack";
import { BackendStack } from "./nested-stacks/BackendStack";

export interface MainStackProps extends StackProps {
  appName: string;
  region: string;
  accountId: string;
  domainName: string;
  apiGatewayApiKey?: string;
}

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    /* Infrastructure Stack */
    const infrastructureStack = new InfrastructureStack(
      this,
      "InfrastructureStack",
      {
        appName: props.appName,
        region: props.region,
      }
    );

    /* Backend Stack */
    const backendStack = new BackendStack(this, "BackendStack", {
      appName: props.appName,
      ddbTable: infrastructureStack.table,
      vpc: infrastructureStack.vpc,
      domainName: props.domainName,
      apiGwApiKey: props.apiGatewayApiKey,
    });
    /* Ensure that the BackendStack is created after the InfrastructureStack */
    backendStack.addDependency;

    // add more stacks here if needed
  }
}
