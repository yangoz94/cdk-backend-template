#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/BackendStack';
import { InfrastructureStack } from '../lib/InfrastructureStack';

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME as string || "CDKBackendTemplate";


const infrastructureStack = new InfrastructureStack(app, 'InfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  appName: APP_NAME,
});

new BackendStack(app, 'BackendStack', {
  qualifier: process.env.ENVIRONMENT as string,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  appName: APP_NAME,
  vpc: infrastructureStack.vpc, //Constructed VPC passed as a prop
});