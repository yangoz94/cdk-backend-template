import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { OgiVpc } from "../src/constructs/OgiVpc";
import { Table } from 'dynamodb-toolbox'
import { OgiDynamoDB } from "../src/constructs/OgiDynamoDB";


export interface InfrastructureStackProps extends cdk.NestedStackProps {
  appName: string;
}

export type DDBToolboxTable = Table<string, string, string>;

export class InfrastructureStack extends cdk.NestedStack {
  public readonly vpc: cdk.aws_ec2.IVpc;
  public readonly table: DDBToolboxTable;


  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    /* VPC */
    this.vpc = new OgiVpc(this, `${props.appName}-vpc`, {
      vpcName: `${props.appName}-vpc`,
      vpcEndpoints: ["dynamodb", "apigateway"],
      natGateways: 0, // set to 1 or more if you want your lambda to access the internet outside the VPC
    }).vpc;

    /* DynamoDB Table with DDB Toolbox */
    this.table = new OgiDynamoDB(this, `${props.appName}-ddb`, {
      name: `${props.appName}-table`,
      partitionKey: 'pk',
      sortKey: 'sk',
    }).table;
  }
}
