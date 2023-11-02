import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { OgiEventRuleProps } from './OgiEventRule';

export interface OgiEventBusProps {
  eventBusName: string;
}

export class OgiEventBus extends Construct {
  public readonly eventBus: events.EventBus;
  

  constructor(scope: Construct, props: OgiEventBusProps) {
    const appName = process.env.APP_NAME;
    super(scope, `${appName}-${props.eventBusName}`);

    this.eventBus = new events.EventBus(this, `${appName}-${props.eventBusName}`, {
      eventBusName: `${appName}-${props.eventBusName}`,
    });
  }

  public addRule(props: OgiEventRuleProps) {
    const appName = process.env.APP_NAME;
    new events.Rule(this, `${appName}-${props.ruleName}`, {
      eventBus: props.schedule ? undefined : this.eventBus, // Only set eventBus if schedule is not provided
      eventPattern: props.eventPattern,
      targets: [new targets.LambdaFunction(props.lambdaTarget)],
      schedule: props.schedule,
    });
  }
  
}
