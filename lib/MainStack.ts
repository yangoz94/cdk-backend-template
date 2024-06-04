import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps } from "aws-cdk-lib";
import { InfrastructureStack } from "./nested-stacks/InfrastructureStack";
import { BackendStack } from "./nested-stacks/BackendStack";

export interface MainStackProps extends StackProps {
  appName: string;
  domainName: string;
  containerHttpPort: string;
  apiGatewayApiKey?: string;
}

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MainStackProps) {
    super(scope, id, props);

    /* Infrastructure Stack */
    const infrastructureStack = new InfrastructureStack(
      this,
      `${props.appName}-infrastructure-stack`,
      {
        appName: props.appName,
        region: props.env?.region as string,
      }
    );

    /* Backend Stack */
    const backendStack = new BackendStack(
      this,
      `${props.appName}-backend-stack`,
      {
        appName: props.appName,
        ddbTable: infrastructureStack.table,
        vpc: infrastructureStack.vpc,
        domainName: props.domainName,
        containerHttpPort: props.containerHttpPort,
      }
    );
    /* Ensure that the BackendStack is created after the InfrastructureStack */
    backendStack.addDependency(infrastructureStack);

    // TO-DO: Add more stacks here as the application grows
  }
}
