import { APIGatewayProxyHandler, S3Event } from "aws-lambda";
import { S3, DynamoDB } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
// Make sure to install sharp: `npm install sharp @types/sharp`
import sharp from "sharp";

const s3 = new S3();
const dynamo = new DynamoDB.DocumentClient();

export const upload: APIGatewayProxyHandler = async (event) => {
    if (!event.body) return { statusCode: 400, body: "Bad Request" };

    const id = uuidv4();
    const data = Buffer.from(event.body, "base64");

    await s3.putObject({
        Bucket: "YOUR_ORIGINAL_S3_BUCKET_NAME",
        Key: `${id}.jpg`,
        Body: data,
    }).promise();

    await dynamo.put({
        TableName: "Photos",
        Item: {
            id,
            originalPath: `https://${process.env.AWS_REGION}.amazonaws.com/YOUR_ORIGINAL_S3_BUCKET_NAME/${id}.jpg`
        }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ id }) };
};

export const processImage = async (event: S3Event) => {
    for (const record of event.Records) {
        const key = record.s3.object.key;
        const originalImage = await s3.getObject({
            Bucket: "YOUR_ORIGINAL_S3_BUCKET_NAME",
            Key: key,
        }).promise();

        const compressedImage = await sharp(originalImage.Body as Buffer)
            .resize(800)
            .jpeg({ quality: 80 })
            .toBuffer();

        await s3.putObject({
            Bucket: "YOUR_COMPRESSED_S3_BUCKET_NAME",
            Key: key,
            Body: compressedImage,
        }).promise();
    }
};

export const getCompressedPhoto: APIGatewayProxyHandler = async (event) => {
    const { id } = event.pathParameters || {};

    if (!id) return { statusCode: 400, body: "Bad Request" };

    try {
        const result = await dynamo.get({
            TableName: "Photos",
            Key: { id }
        }).promise();

        const imagePath = result.Item?.originalPath.replace("YOUR_ORIGINAL_S3_BUCKET_NAME", "YOUR_COMPRESSED_S3_BUCKET_NAME");
        if (imagePath) {
            return {
                statusCode: 200,
                body: JSON.stringify({ path: imagePath }),
            };
        } else {
            return { statusCode: 404, body: "Not Found" };
        }
    } catch (error) {
        return { statusCode: 500, body: "Internal Server Error" };
    }
};
