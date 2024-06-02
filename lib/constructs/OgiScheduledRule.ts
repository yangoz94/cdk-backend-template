import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { OgiLambda } from './OgiLambda';
import { Schedule } from 'aws-cdk-lib/aws-events';


export interface OgiScheduledRuleProps extends events.RuleProps {
  ruleName: string;
  lambdaTarget: OgiLambda
  scheduleConfig: ScheduleConfig;
}
export interface Interval {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface ScheduleConfig {
  interval?: Interval;
  at?: string; // specific time in 'HH:mm' format
}

export class OgiScheduledRule extends Construct {
  constructor(scope: Construct,id:string, props: OgiScheduledRuleProps) {
    super(scope, `${props.ruleName}`);

    let schedule: events.Schedule;
    if (props.scheduleConfig.interval && props.scheduleConfig.at) {
      const time = props.scheduleConfig.at.split(':');
      schedule = Schedule.cron({ 
        minute: time[1], 
        hour: time[0], 
        day: `*/${props.scheduleConfig.interval.value}` 
      });
    } else if (props.scheduleConfig.at) {
      const time = props.scheduleConfig.at.split(':');
      schedule = Schedule.cron({ minute: time[1], hour: time[0] });
    } else {
      throw new Error('Invalid schedule configuration: You must specify either a specific time ("at") or both an interval ("interval") and a specific time ("at").');
    }

    new events.Rule(this, `${props.ruleName}`, {
      ruleName: `${props.ruleName}`,
      schedule: schedule,
      targets: [new targets.LambdaFunction(props.lambdaTarget.lambdaFunction)],
    });
  }
}
