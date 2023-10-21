import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
  service: {
    name: 'photo-upload-service',
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'eu-central-1',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: [
          'arn:aws:s3:::YOUR_ORIGINAL_S3_BUCKET_NAME/*',
          'arn:aws:s3:::YOUR_COMPRESSED_S3_BUCKET_NAME/*',
        ],
      },
      {
        Effect: 'Allow',
        Action: ['dynamodb:*'],
        Resource: '*',
      },
    ],
  },
  functions: {
    upload: {
      handler: 'handler.upload',
      events: [
        {
          http: {
            path: 'photos/upload',
            method: 'post',
            cors: true,
          },
        },
      ],
    },
    processImage: {
      handler: 'handler.processImage',
      events: [
        {
          s3: {
            bucket: 'YOUR_ORIGINAL_S3_BUCKET_NAME',
            event: 's3:ObjectCreated:*',
          },
        },
      ],
    },
    getCompressedPhoto: {
      handler: 'handler.getCompressedPhoto',
      events: [
        {
          http: {
            path: 'photos/compressed/{id}',
            method: 'get',
            cors: true,
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      PhotosDynamoDbTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'Photos',
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
    },
  },
  plugins: ['serverless-webpack'],
  custom: {
    webpack: {
      webpackConfig: 'webpack.config.js',
      includeModules: true,
    },
  },
};

export default serverlessConfiguration;
