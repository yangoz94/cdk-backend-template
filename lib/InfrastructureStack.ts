import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { OgiVpc } from "../src/constructs/OgiVpc";
import { OgiDynamoDB } from "../src/constructs/OgiDynamoDB";

export interface InfrastructureStackProps extends cdk.NestedStackProps {
  appName: string;
  region: string;
}

export class InfrastructureStack extends cdk.NestedStack {
  public readonly vpc: cdk.aws_ec2.IVpc;
  public readonly table: cdk.aws_dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    /* VPC */
    // this.vpc = new OgiVpc(this, `${props.appName}-vpc`, {
    //   vpcName: `${props.appName}-vpc`,
    //   vpcEndpoints: ["dynamodb", "apigateway"],
    //   natGateways: 0, // set to 1 or more if you want your lambda to access the internet outside the VPC
    // }).vpc;

    // If you want to use the default VPC, you can use the following code:
    this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${props.appName}-vpc`, {
      isDefault: true,
      region: props.region,
    });

    /* DynamoDB Table with DDB Toolbox */
    this.table = new OgiDynamoDB(this, `${props.appName}-table`, {
      tableName: `${props.appName}-table`,
      partitionKey: "PK",
      sortKey: "SK",
    }).dynamoTable;
  }
}
