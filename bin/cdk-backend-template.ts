#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkBackendStack } from '../lib/cdk-backend-template-stack';

const app = new cdk.App();
new CdkBackendStack(app, 'CdkBackendStack', {
  qualifier: process.env.ENVIRONMENT as string,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT , // bootsTrapping through CI/CD requires CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION to be set 
    region: process.env.CDK_DEFAULT_REGION, // after the stack is created, you can replace these env variables with AWS_ACCOUNT and AWS_REGION
  },
});