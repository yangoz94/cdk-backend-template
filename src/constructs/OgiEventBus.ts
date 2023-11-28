import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { OgiEventRule, OgiEventRuleProps } from './OgiEventRule';

export interface OgiEventBusProps extends events.EventBusProps {
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

  addRule(props: OgiEventRuleProps) {
    new OgiEventRule(this, props);
  }
}
