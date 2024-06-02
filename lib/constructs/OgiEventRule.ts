import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OgiLambda } from './OgiLambda';
export interface OgiEventRuleProps extends events.RuleProps {
  ruleName: string;
  lambdaTarget: OgiLambda;
  eventPattern: events.EventPattern;
  eventBus?: events.IEventBus;
}

export class OgiEventRule extends Construct {
  constructor(scope: Construct, props: OgiEventRuleProps) {
    super(scope, `${props.ruleName}`);

    new events.Rule(this, `${props.ruleName}`, {
      eventBus: props.eventBus,
      ruleName: `${props.ruleName}`,
      eventPattern: props.eventPattern,
      targets: [new targets.LambdaFunction(props.lambdaTarget.lambdaFunction)],
    });
  }
}
