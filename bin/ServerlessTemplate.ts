#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MainStack } from "../lib/MainStack";

const app = new cdk.App();
const APP_NAME = process.env.APP_NAME || ""; // e.g "HelloworldCDK"
const REGION = process.env.AWS_REGION || ""; // e.g. "us-east-1"
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || ""; // e.g. "123456789012"
const DOMAIN_NAME = process.env.DOMAIN_NAME || ""; // e.g. "example.com". Make sure you have a hosted zone in Route 53. Otherwise, you will get an error during cdk synth and/or cdk deploy

// Parent/Main stack
const mainStack = new MainStack(app, `MainStack`, {
  env: {
    account: ACCOUNT_ID,
    region: REGION,
  },
  appName: APP_NAME,
  region: REGION,
  accountId: ACCOUNT_ID,
  domainName: DOMAIN_NAME,
});
