import { Construct } from "constructs";

import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { StackProps } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { OgiLambda, Permission } from "./OgiLambda";
import { IVpc } from "aws-cdk-lib/aws-ec2";

interface OgiSQSWithLambdaProcessorProps extends StackProps {
  appName: string;
  vpc: IVpc;
  fifo: boolean;
  visibilityTimeout: cdk.Duration;
  batchSize?: number;
  retentionPeriod?: cdk.Duration;
  deadLetterQueue?: sqs.DeadLetterQueue;
}

export class OgiSQSWithLambdaProcessor extends Construct {
  public queue: sqs.Queue;
  public readonly queueProcessor: OgiLambda;

  constructor(
    scope: Construct,
    id: string,
    props: OgiSQSWithLambdaProcessorProps
  ) {
    super(scope, id);
    const queueName = props.fifo
      ? `${props.appName}-queue.fifo`
      : `${props.appName}-queue`;

    /* Create a new SQS queue with support for FIFO High Throughput */
    this.queue = new sqs.Queue(this, queueName, {
      queueName: queueName,
      fifo: props.fifo,
      contentBasedDeduplication: false,
      deduplicationScope: props.fifo
        ? sqs.DeduplicationScope.MESSAGE_GROUP
        : sqs.DeduplicationScope.QUEUE,
      fifoThroughputLimit: props.fifo
        ? sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID
        : sqs.FifoThroughputLimit.PER_QUEUE,
      visibilityTimeout: props.visibilityTimeout,
      retentionPeriod: props.retentionPeriod,
      deadLetterQueue: props.deadLetterQueue,
    });

    /* Create a new Lambda function to process the messages in the queue */
    this.queueProcessor = new OgiLambda(this, {
      appName: props.appName,
      vpc: props.vpc,
      lambdaName: `${props.appName}-queue-processor`,
      externalModules: ["aws-sdk/*", "aws-lambda/*"],
      allowPublicSubnet: false,
      permissions: [Permission.DynamoDB, Permission.SQS],
    });

    /* Hook up the Lambda function to the SQS queue */
    this.queueProcessor.lambdaFunction.addEventSource(
      new SqsEventSource(this.queue, {
        batchSize: props.batchSize || 10,
        reportBatchItemFailures: true,
      })
    );
  }
}
