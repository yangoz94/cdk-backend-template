
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from 'dynamodb-toolbox'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

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

type OgiDynamoDBProps  =  {
  tableName: string;
  partitionKey: string, 
  sortKey: string, 
  indexes?: Indexes;
}

export class OgiDynamoDB extends Construct {
  public readonly dbToolBoxTable: DDBToolboxTable
  public readonly dynamoTable: cdk.aws_dynamodb.TableV2

  constructor(scope: Construct, id: string, props: OgiDynamoDBProps) {
    super(scope, id);

    const marshallOptions = {
      convertEmptyValues: false 
    }
    const translateConfig = { marshallOptions }
    const DocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient(), translateConfig)

    // Create DynamoDB table with AWS CDK
    this.dynamoTable = new cdk.aws_dynamodb.TableV2(this, 'Table', {
      tableName: props.tableName,
      partitionKey: { name: props.partitionKey, type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: props.sortKey, type: cdk.aws_dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // adjust as needed
    });

    // Add GSIs
    if (props.indexes) {
      for (const [indexName, keys] of Object.entries(props.indexes)) {
        this.dynamoTable.addGlobalSecondaryIndex({
          indexName: indexName,
          partitionKey: { 
            name: keys.partitionKey, 
            type: keys.partitionKeyType || cdk.aws_dynamodb.AttributeType.STRING 
          },
          sortKey: keys.sortKey ? { 
            name: keys.sortKey, 
            type: keys.sortKeyType || cdk.aws_dynamodb.AttributeType.STRING 
          } : undefined,
        });
      }
    }

    // Create Table instance with dynamodb-toolbox
    this.dbToolBoxTable = new Table({
      name: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      DocumentClient: DocumentClient,
      indexes: props.indexes
    })
  }
}
