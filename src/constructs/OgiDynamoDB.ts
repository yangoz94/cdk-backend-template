import { Table } from 'dynamodb-toolbox'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Construct } from "constructs";

type IndexKeys = {
  partitionKey: string;
  sortKey: string;
};

type Indexes = {
  [indexName: string]: IndexKeys;
};

type OgiDynamoDBProps =  {
  name: string;
  partitionKey: string, 
  sortKey: string, 
  indexes?: Indexes;
}

export class OgiDynamoDB extends Construct {
  public readonly table: any //TO-DO: update this with the correct type

  constructor(scope: Construct, id: string, props: OgiDynamoDBProps) {
    super(scope, id);

    const marshallOptions = {
      convertEmptyValues: false 
    }
    const translateConfig = { marshallOptions }
    const DocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient(), translateConfig)

    this.table = new Table({
      name: props.name,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      DocumentClient: DocumentClient,
      indexes: props.indexes
    })
  }
}
