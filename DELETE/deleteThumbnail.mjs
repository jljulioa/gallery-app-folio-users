import AWS from "aws-sdk";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const s3 = new S3Client();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const client = new DynamoDBClient();

export const deleteThumbnail = async (event, context) => {
  try {
    // Retrieve the image key from the S3 event
    const srckey = event.Records[0].s3.object.key;

    console.log(srckey);

    const destkey = srckey.split("/")[1];

    const thumbnailKey = `thumbnail/${destkey}`;

    console.log(thumbnailKey);

    const command = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: thumbnailKey,
    });

    const response = await s3.send(command);
    //-------------------------------------------------------------//

    const dynamoParams = {
      TableName: process.env.DB_TABLE,
    };

    // Fetch objects from DynamoDB
    const dynamoResult = await dynamodb.scan(dynamoParams).promise();

    const desID = dynamoResult.Items.find((item) => item.key === destkey)?.id;

    const params = {
      TableName: process.env.DB_TABLE,
      Key: {
        id: { S: desID },
        key: { S: destkey },
      },
    };

    console.log(desID);

    console.log(dynamoResult);

    const deleteInput = new DeleteItemCommand(params);

    await client.send(deleteInput);

    return {
      statusCode: 200,
      body: JSON.stringify(
        `{The key file ${destkey} was deleted from thumbnail folder and DynamoDB}`
      ),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
