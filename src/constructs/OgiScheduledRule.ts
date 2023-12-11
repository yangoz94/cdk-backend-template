import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { OgiLambda } from './OgiLambda';

export interface ScheduleConfig {
  every?: number;
  unit?: 'minutes' | 'hours' | 'days';
  at?: string; // specific time in 'HH:mm' format
  startTime?: string; // start time in 'HH:mm' format for interval-based schedules
}

export interface OgiScheduledRuleProps extends events.RuleProps {
  ruleName: string;
  lambdaTarget: OgiLambda
  scheduleConfig: ScheduleConfig;
}

export class OgiScheduledRule extends Construct {
  constructor(scope: Construct,id:string, props: OgiScheduledRuleProps) {
    super(scope, `${props.ruleName}`);

    if ((props.scheduleConfig.every || props.scheduleConfig.unit) && props.scheduleConfig.at) {
      throw new Error('Invalid schedule configuration: You cannot specify both a specific time ("at") and an interval ("every" and "unit"). Please choose one.');
    }

    let schedule: events.Schedule;
    if (props.scheduleConfig.every && props.scheduleConfig.unit) {
      const rate = cdk.Duration[props.scheduleConfig.unit]
      const startTime = props.scheduleConfig.startTime ? `T${props.scheduleConfig.startTime}` : '';
      schedule = events.Schedule.expression(`rate(${rate}${startTime})`);
    } else if (props.scheduleConfig.at) {
      schedule = events.Schedule.cron({ minute: props.scheduleConfig.at.split(':')[1], hour: props.scheduleConfig.at.split(':')[0] });
    } else {
      throw new Error('Invalid schedule configuration: You must specify either a specific time ("at") or an interval ("every" and "unit").');
    }

    new events.Rule(this, `${props.ruleName}`, {
      ruleName: `${props.ruleName}`,
      schedule: schedule,
      targets: [new targets.LambdaFunction(props.lambdaTarget.lambdaFunction)],
    });
  }
}
