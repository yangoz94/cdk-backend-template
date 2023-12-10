import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OgiVpc } from "../src/constructs/OgiVpc";

export interface InfrastructureStackProps extends cdk.StackProps {
  appName: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly vpc: cdk.aws_ec2.IVpc;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    this.vpc = new OgiVpc(this, {
      appName: props.appName,
      vpcEndpoints: ["dynamodb", "s3"],
      privateSubnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
    }).vpc;
  }
}
