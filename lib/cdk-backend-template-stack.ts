import * as cdk from 'aws-cdk-lib';
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from 'constructs';
import { OgiLambda, OgiLambdaProps } from '../src/constructs/OgiLambda';

export interface CdkBackendStackProps extends cdk.StackProps {
  appName: string;
  qualifier: string; // will be appended to the stack resources (10 characters max)
}

export class CdkBackendStack extends cdk.Stack {
  public readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: CdkBackendStackProps) {
    super(scope, id, props);
    this.templateOptions.description = `(${props.appName}) - ${props?.qualifier} - ${this.templateOptions.description}`;
    // VPC Lookup
    this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${props.appName}-vpc`, {
      isDefault: true,
    });
    // Lambda
    new OgiLambda(this, {
      appName: props.appName,
      lambdaName: 'hello-world',
      vpc: this.vpc,
    });
  }
}
