import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

export interface ScheduleConfig {
  every?: number;
  unit?: 'minutes' | 'hours' | 'days';
  at?: string; // specific time in 'HH:mm' format
}

export interface OgiScheduledRuleProps extends events.RuleProps {
  ruleName: string;
  lambdaTarget: lambda.IFunction;
  scheduleConfig: ScheduleConfig;
}

export class OgiScheduledRule extends Construct {
  constructor(scope: Construct,id:string, props: OgiScheduledRuleProps) {
    super(scope, `${props.ruleName}`);

    if (props.scheduleConfig.every && props.scheduleConfig.at) {
      throw new Error('Invalid schedule configuration: both "every" and "at" cannot be specified');
    }

    let schedule: events.Schedule;
    if (props.scheduleConfig.every && props.scheduleConfig.unit) {
      schedule = events.Schedule.rate(cdk.Duration[props.scheduleConfig.unit](props.scheduleConfig.every));
    } else if (props.scheduleConfig.at) {
      schedule = events.Schedule.cron({ minute: props.scheduleConfig.at.split(':')[1], hour: props.scheduleConfig.at.split(':')[0] });
    } else {
      throw new Error('Invalid schedule configuration: either "every" or "at" must be specified');
    }

    new events.Rule(this, `${props.ruleName}`, {
      ruleName: `${props.ruleName}`,
      schedule: schedule,
      targets: [new targets.LambdaFunction(props.lambdaTarget)],
    });
  }
}
