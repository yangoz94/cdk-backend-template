import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface OgiEventRuleProps {
  ruleName: string;
  eventBus: events.IEventBus;
  lambdaTarget: lambda.IFunction;
  source: string[]; 
  detailType: string[]; 
  detail?: { [key: string]: any };
}

export class OgiEventRule extends Construct {
  constructor(scope: Construct, props: OgiEventRuleProps) {
    const appName = process.env.APP_NAME;
    super(scope, `${appName}-${props.ruleName}`);

    new events.Rule(this, `${appName}-${props.ruleName}`, {
      eventBus: props.eventBus,
      eventPattern: {
        source: props.source, 
        detailType: props.detailType, 
      },
      targets: [new targets.LambdaFunction(props.lambdaTarget)],
    });
  }
}
