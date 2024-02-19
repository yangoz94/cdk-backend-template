#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/BackendStack';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME || "CDKBackendTemplate";

// Parent stack (not a nested stack)
const parentStack = new cdk.Stack(app, `${APP_NAME}Stack`, {
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});

// Nested stack - 1: InfrastructureStack
const infrastructureStack = new InfrastructureStack(parentStack, `InfrastructureStack`, {
  appName: APP_NAME,
});

// Nested stack - 2: BackendStack
const backendStack = new BackendStack(parentStack, `BackendStack`, {
  appName: APP_NAME,
  vpc: infrastructureStack.vpc, // Constructed VPC passed as a prop
  tableName:infrastructureStack.table.tableName,
  domainName: process.env.DOMAIN_NAME as string,
  apiGwApiKey: process.env.API_GATEWAY_API_KEY,
});
