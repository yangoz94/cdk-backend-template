#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/BackendStack";
import { InfrastructureStack } from "../lib/InfrastructureStack";

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME || "CDKBackendTemplate";
const REGION = process.env.AWS_REGION || "us-east-1";

// Parent stack
const parentStack = new cdk.Stack(app, `${APP_NAME}Stack`, {
  env: {
    account: process.env.AWS_ACCOUNT_ID, //  || "YOUR_AWS_ACCOUNT_ID" if you want to make sure cdk synth works locally
    region: REGION,
  },
});

// Nested stack - 1: InfrastructureStack
const infrastructureStack = new InfrastructureStack(
  parentStack,
  `InfrastructureStack`,
  {
    appName: APP_NAME,
    region: REGION,
  }
);

// Nested stack - 2: BackendStack
const backendStack = new BackendStack(parentStack, `BackendStack`, {
  appName: APP_NAME,
  vpc: infrastructureStack.vpc, // Constructed VPC passed as a prop
  ddbTable: infrastructureStack.table,
  domainName: process.env.DOMAIN_NAME || "oguzhanyangoz.com",
  apiGwApiKey: process.env.API_GATEWAY_API_KEY,
});
