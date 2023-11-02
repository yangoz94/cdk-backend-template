import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface OgiEventRuleProps {
  ruleName: string;
  lambdaTarget: lambda.IFunction;
  eventPattern?: events.EventPattern;
  schedule?: events.Schedule;
}
export class OgiEventRule extends Construct {
  constructor(scope: Construct, props: OgiEventRuleProps) {
    const appName = process.env.APP_NAME;
    super(scope, `${appName}-${props.ruleName}`);

    if (!props.eventPattern && !props.schedule) {
      throw new Error('Either eventPattern or schedule must be defined');
    }

    new events.Rule(this, `${appName}-${props.ruleName}`, {
      eventPattern: props.eventPattern,
      schedule: props.schedule,
      targets: [new targets.LambdaFunction(props.lambdaTarget)],
      // Do not set the eventBus property for scheduled rules
    });
  }
}
