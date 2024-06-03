#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MainStack } from "../lib/MainStack";

const app = new cdk.App();

// Main stack that will hold all the nested stacks and pass down the declared props
const mainStack = new MainStack(app, `${process.env.APP_NAME}MainStack`, {
  env: {
    account: process.env.AWS_ACCOUNT_ID || "", // e.g. "123456789012"
    region: process.env.AWS_REGION || "", // e.g. "us-east-1",
  },
  appName: process.env.APP_NAME || "", // e.g "HelloworldCDK",
  domainName: process.env.DOMAIN_NAME || "", // e.g. "example.com". Make sure you have a hosted zone in Route 53. Otherwise, you will get an error during cdk synth and/or cdk deploy
});
