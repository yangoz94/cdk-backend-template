import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export interface OgiVpcProps extends Omit<ec2.VpcProps, 'cidr'> {
  vpcName: string;
  cidr?: string;
  vpcEndpoints?: string[];
}

export class OgiVpc extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: OgiVpcProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, `${props.vpcName}`, {
      ...props,
      cidr: props.cidr || '10.0.0.0/16',
      maxAzs: 3, // Maximum number of Availability Zones to use
      natGateways: props.natGateways || 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateIsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnetWithNat',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Add the VPC name as a tag.
    cdk.Tags.of(this.vpc).add('Name', `${props.vpcName}`);

    // Add VPC endpoints
    if (props.vpcEndpoints) {
      const interfaceServiceMap: { [key: string]: string } = {
        rds: 'com.amazonaws.us-east-1.rds',
        apigateway: 'com.amazonaws.us-east-1.execute-api',
        events: 'com.amazonaws.us-east-1.events',
        ec2: 'com.amazonaws.us-east-1.ec2',
        ecs: 'com.amazonaws.us-east-1.ecs',
        sqs: 'com.amazonaws.us-east-1.sqs',
      };
      for (const serviceName of Object.keys(interfaceServiceMap)) {
        if (props.vpcEndpoints.includes(serviceName)) {
          this.vpc.addInterfaceEndpoint(`${props.vpcName}-${serviceName}`, {
            service: new ec2.InterfaceVpcEndpointService(
              interfaceServiceMap[serviceName]
            ),
          });
        }
      }

      const gatewayServiceMap: {
        [key: string]: ec2.IGatewayVpcEndpointService;
      } = {
        s3: ec2.GatewayVpcEndpointAwsService.S3,
        dynamodb: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      };
      for (const serviceName of Object.keys(gatewayServiceMap)) {
        if (props.vpcEndpoints.includes(serviceName)) {
          this.vpc.addGatewayEndpoint(
            `${props.vpcName}-${serviceName}GatewayEndpoint`,
            {
              service: gatewayServiceMap[serviceName],
            }
          );
        }
      }
    }
  }
}
