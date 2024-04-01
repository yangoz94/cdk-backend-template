#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/BackendStack";
import { InfrastructureStack } from "../lib/InfrastructureStack";

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME || "TO_DO_BEFORE_DEPLOYMENT"; // e.g "HelloworldCDK"
const REGION = process.env.AWS_REGION || "TO_DO_BEFORE_DEPLOYMENT"; // e.g. "us-east-1"
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || "TO_DO_BEFORE_DEPLOYMENT"; // e.g. "123456789012"
const DOMAIN_NAME = process.env.DOMAIN_NAME || "TO_DO_BEFORE_DEPLOYMENT"; // e.g. "example.com". Make sure you have a hosted zone in Route 53. Otherwise, you will get an error during cdk synth and/or cdk deploy
const API_GATEWAY_API_KEY = process.env.API_GATEWAY_API_KEY; // optional just for demonstration purposes

// Parent stack
const parentStack = new cdk.Stack(app, `${APP_NAME}Stack`, {
  env: {
    account: ACCOUNT_ID,
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
  vpc: infrastructureStack.vpc,
  ddbTable: infrastructureStack.table,
  domainName: DOMAIN_NAME,
  apiGwApiKey: API_GATEWAY_API_KEY,
});
