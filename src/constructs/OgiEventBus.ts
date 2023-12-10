import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import { OgiEventRule, OgiEventRuleProps } from './OgiEventRule';

export interface OgiEventBusProps extends events.EventBusProps {
  appName: string;
  eventBusName: string;
}

export class OgiEventBus extends Construct {
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, props: OgiEventBusProps) {
    super(scope, `${props.appName}-${props.eventBusName}`);

    this.eventBus = new events.EventBus(this, `${props.appName}-${props.eventBusName}`, {
      eventBusName: `${props.appName}-${props.eventBusName}`,
    });
  }

  addRule(props: OgiEventRuleProps) {
    new OgiEventRule(this, props);
  }
}
