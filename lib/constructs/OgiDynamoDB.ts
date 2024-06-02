import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "dynamodb-toolbox";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

type IndexKeys = {
  partitionKey: string;
  sortKey?: string; // sortKey is optional for GSIs
  partitionKeyType?: cdk.aws_dynamodb.AttributeType; // default is STRING
  sortKeyType?: cdk.aws_dynamodb.AttributeType; // default is STRING
};

type Indexes = {
  [indexName: string]: IndexKeys;
};

export type DDBToolboxTable = Table<string, string, string>;

type OgiDynamoDBProps = {
  tableName: string;
  partitionKey: string;
  sortKey: string;
  gsi?: Indexes;
};

export class OgiDynamoDB extends Construct {
  public readonly dbToolBoxTable: DDBToolboxTable;
  public readonly dynamoTable: cdk.aws_dynamodb.TableV2;

  constructor(scope: Construct, id: string, props: OgiDynamoDBProps) {
    super(scope, id);

    const marshallOptions = {
      convertEmptyValues: false,
    };
    const translateConfig = { marshallOptions };
    const DocumentClient = DynamoDBDocumentClient.from(
      new DynamoDBClient(),
      translateConfig
    );

    // Create DynamoDB table with AWS CDK
    this.dynamoTable = new cdk.aws_dynamodb.TableV2(this, "Table", {
      tableName: props.tableName,
      partitionKey: {
        name: props.partitionKey,
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: props.sortKey,
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      dynamoStream: cdk.aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecovery: false,
    });

    // Add GSIs
    if (props.gsi) {
      for (const [indexName, keys] of Object.entries(props.gsi)) {
        this.dynamoTable.addGlobalSecondaryIndex({
          indexName: indexName,
          partitionKey: {
            name: keys.partitionKey,
            type:
              keys.partitionKeyType || cdk.aws_dynamodb.AttributeType.STRING,
          },
          sortKey: keys.sortKey
            ? {
                name: keys.sortKey,
                type: keys.sortKeyType || cdk.aws_dynamodb.AttributeType.STRING,
              }
            : undefined,
        });
      }
    }

    // Create Table instance with dynamodb-toolbox
    this.dbToolBoxTable = new Table({
      name: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      DocumentClient: DocumentClient,
      indexes: props.gsi
        ? Object.entries(props.gsi).reduce((acc, [indexName, keys]) => {
            acc[indexName] = {
              partitionKey: keys.partitionKey,
              sortKey: keys.sortKey,
            };
            return acc;
          }, {} as Indexes)
        : undefined,
    });
  }
}
