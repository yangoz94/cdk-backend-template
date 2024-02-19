import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import {
  AwsLogDriver,
  ContainerImage,
  CpuArchitecture,
  FargatePlatformVersion,
  RuntimePlatform,
} from "aws-cdk-lib/aws-ecs";
import {
  Cluster,
  FargateTaskDefinition,
  ICluster,
  OperatingSystemFamily,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import path = require("path");
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Duration } from "aws-cdk-lib";
import {
  ApplicationProtocol,
  ListenerAction,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface OgiECSFargateProps {
  appName: string;
  serviceName: string;
  vpc: IVpc;
  domainName: string;
  subdomain: string;
  environmentVariables: { [key: string]: string };
  imagePathRelativeToRoot?: string;
  enableAutoScaling?: boolean;
}

export class OgiECSFargate extends Construct {
  public readonly cluster: ICluster;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly service: ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: OgiECSFargateProps) {
    super(scope, id);

    // // create a new Hosted Zone
    // const hostedZone = new HostedZone(
    //   this,
    //   `${props.appName}-${props.serviceName}-hosted-zone`,
    //   {
    //     zoneName: props.subdomain + "." + props.domainName,
    //   }
    // );

    const DOMAIN = `${props.subdomain}.${props.domainName}`
    // Look up the existing Hosted Zone (Domain is on Google Domains NOT on Route53. Route 53 hosted zone was created manually and DNS records were added to Google Domains)
    const hostedZone = HostedZone.fromLookup(
      this,
      `${props.appName}-${props.serviceName}-hosted-zone`,
      {
        domainName: DOMAIN,
      }
    );

    // create a new Certificate for the https
    const certificate = new Certificate(
      this,
      `${props.appName}-${props.serviceName}-certificate`,
      {
        domainName: DOMAIN,
        validation: CertificateValidation.fromDns(hostedZone),
      }
    );

    // create a new ECS Cluster
    this.cluster = new Cluster(
      this,
      `${props.appName}-${props.serviceName}-cluster`,
      {
        vpc: props.vpc,
        clusterName: `${props.appName}-${props.serviceName}-cluster`,
      }
    );

    // create security group
    const clusterSecurityGroup = this.cluster.connections;
    clusterSecurityGroup.allowFrom(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow inbound HTTPS traffic"
    );

    // create a new Fargate Task Definition
    this.taskDefinition = new FargateTaskDefinition(
      this,
      `${props.appName}-${props.serviceName}-task`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        runtimePlatform: {
          operatingSystemFamily: OperatingSystemFamily.LINUX,
          cpuArchitecture: CpuArchitecture.ARM64,
        },
      }
    );

    // add a container to the Task Definition
    const container = this.taskDefinition.addContainer(
      `${props.appName}-${props.serviceName}-container`,
      {
        containerName: `${props.appName}-${props.serviceName}-container`,
        image: ContainerImage.fromAsset(
          path.join(__dirname, "..", "..", props.imagePathRelativeToRoot || ""),
          {
            file: `Dockerfile.${props.serviceName}`,
            platform: Platform.LINUX_ARM64,
          }
        ),
        dockerLabels: {
          name: `${props.appName}-${props.serviceName}-container`,
          service: props.serviceName,
          app: props.appName,
        },
        logging: new AwsLogDriver({
          streamPrefix: `${props.appName}-${props.serviceName}`,
          logRetention: RetentionDays.TWO_WEEKS,
        }),
        portMappings: [
          {
            containerPort: 443,
            hostPort: 443,
          },
        ],
        environment: props.environmentVariables,
      }
    );

    // create a new Fargate Service
    this.service = new ApplicationLoadBalancedFargateService(
      this,
      `${props.appName}-${props.serviceName}-service`,
      {
        cluster: this.cluster,
        taskDefinition: this.taskDefinition,
        serviceName: `${props.appName}-${props.serviceName}-service`,
        desiredCount: 1,
        certificate: certificate,
        domainName: DOMAIN,
        domainZone: hostedZone,
        assignPublicIp: true,
        maxHealthyPercent: 100,
        minHealthyPercent: 0,
        publicLoadBalancer: true,
        platformVersion: FargatePlatformVersion.LATEST,
        loadBalancerName: `${props.serviceName}-lb`,
        listenerPort: 443,
        protocol: ApplicationProtocol.HTTPS,
        redirectHTTP: true,
      }
    );

    // setup AutoScaling policy
    if (props.enableAutoScaling) {
      const scaling = this.service.service.autoScaleTaskCount({
        maxCapacity: 2,
      });

      scaling.scaleOnCpuUtilization("CpuScaling", {
        targetUtilizationPercent: 80,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(60),
      });
    }

    // configure health check
    this.service.targetGroup.configureHealthCheck({
      path: "/health",
      interval: Duration.seconds(30),
      healthyThresholdCount: 2,
    });

    // Add a default action to the HTTPS listener
    this.service.listener.addAction("DefaultAction", {
      action: ListenerAction.fixedResponse(200, {
        contentType: "text/plain",
        messageBody: "OK",
      }),
    });

  }
}
