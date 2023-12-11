#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/BackendStack';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME as string || "CDKBackendTemplate";

// Create the parent stack
const parentStack = new cdk.Stack(app, `${APP_NAME}Stack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

//nested stack - 1
const infrastructureStack = new InfrastructureStack(parentStack, 'InfrastructureStack', {
  appName: APP_NAME,
});

//nested stack - 2
const backendStack  = new BackendStack(parentStack, 'BackendStack', {
  qualifier: process.env.ENVIRONMENT as string,
  appName: APP_NAME,
  vpc: infrastructureStack.vpc, //Constructed VPC passed as a prop
  apiGwApiKey: process.env.API_GATEWAY_API_KEY,
});
