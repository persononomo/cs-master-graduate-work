#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { PortalEc2Stack } from '../lib/portal-ec2-stack';
import { DatabaseEc2Stack } from '../lib/database-ec2-stack';

const env = { account: process.env.account, region: 'eu-central-1' }
const app = new cdk.App();
let vpcStack = new VpcStack(app, 'vpc-stack', {
  env,
});
let portalEc2Stack = new PortalEc2Stack(app, 'portal-ec2-stack', {
  env,
  vpc: vpcStack.vpc,
});
portalEc2Stack.addDependency(vpcStack);

let databaseEc2Stack = new DatabaseEc2Stack(app, 'database-ec2-stack', {
  env,
  vpc: vpcStack.vpc,
});
databaseEc2Stack.addDependency(vpcStack);
