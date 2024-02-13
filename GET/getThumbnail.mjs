import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client();
const dynamodb = new AWS.DynamoDB.DocumentClient();

export const getThumbnail = async (event, context) => {
  try {
    // Retrieve the image key from the S3 event
    const srckey = event.Records[0].s3.object.key;

    console.log(srckey);

    const destkey = srckey.split("/")[1];

    console.log(destkey);

    // Retrieve the image from S3
    const imageObject = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: srckey,
      })
    );

    const imageBuffer = await imageObject.Body.transformToByteArray();

    // Resize the image using sharp
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: sharp.fit.outside,
        withoutReduction: false,
      })
      .toFormat("jpeg")
      .toBuffer();

    // Upload the resized image back to S3
    const result = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `thumbnail/${destkey}`, // Change the folder structure as needed
        Body: resizedImageBuffer,
        ContentType: "image/jpeg", // Change the content type as needed
      })
    );

    // Create a record in DynamoDB
    const item = {
      id: uuidv4(),
      key: destkey,
      date: new Date().toISOString(),
    };

    await dynamodb
      .put({
        TableName: process.env.DB_TABLE,
        Item: item,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ item, result }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
