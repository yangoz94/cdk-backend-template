import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { IVpc, Protocol } from "aws-cdk-lib/aws-ec2";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import {
  AwsLogDriver,
  CfnCapacityProvider,
  ContainerImage,
  CpuArchitecture,
  FargatePlatformVersion,
} from "aws-cdk-lib/aws-ecs";
import {
  Cluster,
  FargateTaskDefinition,
  ICluster,
  OperatingSystemFamily,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import * as path from "path";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export interface OgilLoadBalancedECSFargateProps {
  appName: string;
  serviceName: string;
  vpc: IVpc;
  domainName: string;
  subdomain: string;
  environmentVariables: { [key: string]: string };
  imagePathRelativeToRoot?: string;
  assignPublicIp?: boolean;
  enableAutoScaling?: boolean;
  ddbTables?: ITable[];
  containerHttpPort: string;
}

export class OgilLoadBalancedECSFargate extends Construct {
  public readonly cluster: ICluster;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly service: ApplicationLoadBalancedFargateService;
  public readonly lb: ApplicationLoadBalancer;

  constructor(
    scope: Construct,
    id: string,
    props: OgilLoadBalancedECSFargateProps
  ) {
    super(scope, id);

    const DOMAIN = `${props.subdomain}.${props.domainName}`;
    const CONTAINER_HTTP_PORT = parseInt(props.containerHttpPort);

    /* Look up the existing Hosted Zone (Domain is on Google Domains NOT on Route53. Route 53 hosted zone was created manually and DNS records were added to Google Domains) */
    const hostedZone = HostedZone.fromLookup(
      this,
      `${props.appName}-${props.serviceName}-hosted-zone`,
      {
        domainName: DOMAIN,
      }
    );

    /* Create a new ACM Certificate */
    const certificate = new Certificate(
      this,
      `${props.appName}-${props.serviceName}-certificate`,
      {
        domainName: DOMAIN,
        validation: CertificateValidation.fromDns(hostedZone),
      }
    );

    /* Create a new ECS Cluster */
    this.cluster = new Cluster(
      this,
      `${props.appName}-${props.serviceName}-cluster`,
      {
        vpc: props.vpc,
        clusterName: `${props.appName}-${props.serviceName}-cluster`,
        enableFargateCapacityProviders: true,
      }
    );

    /* Create a new Fargate Task Definition */
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

    /* Create the Docker Image Asset */
    const dockerImage = ContainerImage.fromAsset(
      path.join(__dirname, "..", "..", props.imagePathRelativeToRoot || ""),
      {
        file: `Dockerfile.${props.serviceName}`,
        platform: Platform.LINUX_ARM64,
      }
    );

    /* Create a Log Group */
    const logGroup = new LogGroup(
      this,
      `${props.appName}-${props.serviceName}-log-group`,
      {
        logGroupName: `/ecs/container/${props.appName}/${props.serviceName}`,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: RetentionDays.TWO_WEEKS,
      }
    );

    /* Create a Custom Log Driver */
    const logDriver = new AwsLogDriver({
      streamPrefix: `${props.appName}-${props.serviceName}`,
      logGroup: logGroup,
    });

    /* Add a container to the Task Definition */
    const container = this.taskDefinition.addContainer(
      `${props.appName}-${props.serviceName}-container`,
      {
        containerName: `${props.appName}-${props.serviceName}-container`,
        image: dockerImage,
        dockerLabels: {
          name: `${props.appName}-${props.serviceName}-container`,
          service: props.serviceName,
          app: props.appName,
        },
        logging: logDriver,
        portMappings: [
          {
            containerPort: CONTAINER_HTTP_PORT,
          },
        ],
        healthCheck: {
          command: [
            "CMD-SHELL",
            `curl -f http://localhost:${CONTAINER_HTTP_PORT}/health || exit 1`,
          ],
          interval: Duration.seconds(30),
          timeout: Duration.seconds(5),
          retries: 2,
          startPeriod: Duration.seconds(10),
        },
        environment: props.environmentVariables,
      }
    );

    /* Instantiate the Load Balanced Fargate Service */
    this.service = new ApplicationLoadBalancedFargateService(
      this,
      `${props.appName}-${props.serviceName}-service`,
      {
        cluster: this.cluster,
        circuitBreaker: { rollback: true },
        domainName: DOMAIN,
        domainZone: hostedZone,
        listenerPort: 443,
        loadBalancerName: `${props.serviceName}-lb`,
        publicLoadBalancer: true,
        protocol: ApplicationProtocol.HTTPS,
        redirectHTTP: true,
        serviceName: `${props.appName}-${props.serviceName}-service`,
        desiredCount: 1,
        certificate: certificate,
        assignPublicIp: props.assignPublicIp ? true : false,
        maxHealthyPercent: 100,
        minHealthyPercent: 0,
        platformVersion: FargatePlatformVersion.LATEST,
        taskDefinition: this.taskDefinition,
      }
    );

    /* Configure the Target Group Health Check for the Load Balancer */
    this.service.targetGroup.configureHealthCheck({
      path: "/health",
      port: `${CONTAINER_HTTP_PORT}`,
      interval: Duration.seconds(30),
    });

    /* Configure Auto Scaling based on CPU and Memory Utilization */
    if (props.enableAutoScaling) {
      const scaling = this.service.service.autoScaleTaskCount({
        maxCapacity: 2,
      });

      scaling.scaleOnCpuUtilization("CpuScaling", {
        targetUtilizationPercent: 80,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(60),
      });

      scaling.scaleOnMemoryUtilization("MemoryScaling", {
        targetUtilizationPercent: 80,
        scaleInCooldown: Duration.seconds(60),
        scaleOutCooldown: Duration.seconds(60),
      });
    }

    /*Permissons for the ECS Service to access the DynamoDB Table */
    if (props.ddbTables) {
      props.ddbTables.forEach((table) => {
        table.grantReadWriteData(this.service.taskDefinition.taskRole);
      });
    }
  }
}
