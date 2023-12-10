import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface OgiVpcProps extends Omit<ec2.VpcProps, 'cidr'> {
  appName: string;
  cidr?: string;
  vpcEndpoints?: string[];
  privateSubnetType?: ec2.SubnetType;
}

export class OgiVpc extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, props: OgiVpcProps) {
    super(scope, `${props.appName}-vpc`);

    this.vpc = new ec2.Vpc(this, `${props.appName}-vpc`, {
      ...props,
      cidr: props.cidr || "10.0.0.0/16",
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'Public',
          cidrMask: 24,
        },
        {
          subnetType: props.privateSubnetType || ec2.SubnetType.PRIVATE_ISOLATED,
          name: 'Private',
          cidrMask: 24,
        },
      ],
      natGateways: props.privateSubnetType === ec2.SubnetType.PRIVATE_WITH_EGRESS ? 1 : 0,
    });

    // Add VPC endpoints
    if (props.vpcEndpoints) {
      const serviceMap: { [key: string]: string } = {
        's3': 'com.amazonaws.region.s3',
        'dynamodb': 'com.amazonaws.region.dynamodb',
        'rds': 'com.amazonaws.region.rds',
        'apigateway': 'com.amazonaws.region.execute-api',
        'events': 'com.amazonaws.region.events',
        'ec2': 'com.amazonaws.region.ec2',
        'ecs': 'com.amazonaws.region.ecs',
        'sqs': 'com.amazonaws.region.sqs',
        // will add more here if i need them
      };

      for (const serviceName of props.vpcEndpoints) {
        const service = serviceMap[serviceName];
        if (!service) {
          throw new Error(`Unsupported service: ${serviceName}`);
        }
        this.vpc.addInterfaceEndpoint(`${props.appName}-${serviceName}`, {
          service: new ec2.InterfaceVpcEndpointService(service),
        });
      }
    }
  }
}
