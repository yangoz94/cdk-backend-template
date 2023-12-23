import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { OgiVpc } from "../src/constructs/OgiVpc";

export interface InfrastructureStackProps extends cdk.NestedStackProps {
  appName: string;
}

export class InfrastructureStack extends cdk.NestedStack {
  public readonly vpc: cdk.aws_ec2.IVpc;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    this.vpc = new OgiVpc(this, `${props.appName}`, {
        vpcName: `${props.appName}`,
        vpcEndpoints: ["dynamodb", "apigateway"],
        natGateways:0, // set to 1 or more if you want your lambda to access the internet outside the VPC
        }).vpc;
    }   
}
