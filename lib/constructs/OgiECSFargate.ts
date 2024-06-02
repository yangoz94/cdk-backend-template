import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import {
  AwsLogDriver,
  ContainerImage,
  CpuArchitecture,
  FargateService,
} from "aws-cdk-lib/aws-ecs";
import {
  Cluster,
  FargateTaskDefinition,
  ICluster,
  OperatingSystemFamily,
} from "aws-cdk-lib/aws-ecs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import path = require("path");
import { Duration } from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export interface OgiECSFargateProps {
  appName: string;
  includeHTTPSCertificate: boolean;
  serviceName: string;
  vpc: IVpc;
  environmentVariables: { [key: string]: string };
  imagePathRelativeToRoot?: string;
  enableAutoScaling?: boolean;
  ddbTable?: ITable;
}

export class OgiECSFargate extends Construct {
  public readonly cluster: ICluster;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly service: FargateService;

  constructor(scope: Construct, id: string, props: OgiECSFargateProps) {
    super(scope, id);

    // create a new ECS Cluster
    this.cluster = new Cluster(
      this,
      `${props.appName}-${props.serviceName}-cluster`,
      {
        // vpc: props.vpc, use default vpc
        clusterName: `${props.appName}-${props.serviceName}-cluster`,
      }
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
            containerPort: 80,
          },
        ],
        healthCheck: {
          command: [
            "CMD-SHELL",
            `curl -f http://localhost:80/health || exit 1`,
          ],
          interval: Duration.seconds(300),
          timeout: Duration.seconds(5),
          retries: 2,
          startPeriod: Duration.seconds(10),
        },
        environment: props.environmentVariables,
      }
    );

    // create a new Fargate Service
    this.service = new FargateService(
      this,
      `${props.appName}-${props.serviceName}-service`,
      {
        cluster: this.cluster,
        serviceName: `${props.appName}-${props.serviceName}-service`,
        desiredCount: 1,

        maxHealthyPercent: 100,
        minHealthyPercent: 0,
        taskDefinition: this.taskDefinition,
      }
    );
  }
}
