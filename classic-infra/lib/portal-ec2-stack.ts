import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface PortalEc2StackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}
export class PortalEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PortalEc2StackProps) {
    super(scope, id, props);

    // Security group for our EC2 instance to allow SSH and any other necessary ports
    const securityGroup = new ec2.SecurityGroup(this, 'EC2Sg', {
      vpc: props.vpc,
      description: 'Allow SSH access and Client access',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'allow HTTP access for everyone');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH');

    // EC2 instance
    const instance = new ec2.Instance(this, 'EC2Instance', {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: securityGroup,
      keyName: "classic-ec2-key",
      userData: ec2.UserData.custom(`
        #!/bin/bash
        yum update -y
        yum install -y docker
        service docker start
      `),
    });

    new cdk.CfnOutput(this, 'InstancePublicIp', {value: instance.instancePublicIp});
  }
}
