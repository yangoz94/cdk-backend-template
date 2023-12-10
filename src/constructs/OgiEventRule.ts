import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
export interface OgiEventRuleProps extends events.RuleProps {
  ruleName: string;
  lambdaTarget: lambda.IFunction;
  eventPattern: events.EventPattern;
  eventBus?: events.IEventBus;
}

export class OgiEventRule extends Construct {
  constructor(scope: Construct, props: OgiEventRuleProps) {
    const appName = process.env.APP_NAME;
    super(scope, `${appName}-${props.ruleName}`);

    new events.Rule(this, `${appName}-${props.ruleName}`, {
      eventBus: props.eventBus,
      ruleName: `${appName}-${props.ruleName}`,
      eventPattern: props.eventPattern,
      targets: [new targets.LambdaFunction(props.lambdaTarget)],
    });
  }
}
