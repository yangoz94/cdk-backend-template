#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkBackendStack } from '../lib/cdk-backend-template-stack';

const app = new cdk.App();
new CdkBackendStack(app, 'CdkBackendStack', {
  appName: 'cdk-backend',
  qualifier: `${process.env.ENVIRONMENT}`,
  env: {
    account: process.env.AWS_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});