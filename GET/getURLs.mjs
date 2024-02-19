import AWS from "aws-sdk";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

export const getURLs = async (event) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const tableDB = process.env.DB_TABLE;
  const domainCFD = process.env.CFD_DOMAIN;
  const privateKey = process.env.CFD_KEY;
  const keyPairId = process.env.CFD_KEY_ID;

  const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000; // Two days in milliseconds
  const currentDate = new Date();
  const expirationDate = new Date(currentDate.getTime() + TWO_DAYS_IN_MS);

  const dateLessThan = "2024-04-04";

  try {
    const dynamoParams = {
      TableName: tableDB,
    };

    // Fetch objects from DynamoDB
    const dynamoResult = await dynamodb.scan(dynamoParams).promise();

    console.log(dynamoResult);

    // Extract object keys from DynamoDB result
    const objectKeys = dynamoResult.Items.map((item) => item.key);

    console.log(objectKeys);

    // Map over the array of object keys to generate pre-signed URLs for each object
    const urls = await Promise.all(
      objectKeys.map(async (objectKey) => {
        const url = `${domainCFD}/thumbnail/${objectKey}`;
        console.log(url);
        const signedUrl = getSignedUrl({
          url,
          keyPairId,
          dateLessThan,
          privateKey,
        });

        return { signedUrl };
      })
    );

    const urlsOri = await Promise.all(
      objectKeys.map(async (objectKey) => {
        const urlOri = `${domainCFD}/uploads/${objectKey}`;
        console.log(urlOri);
        const signedUrlOri = getSignedUrl({
          url: urlOri,
          keyPairId,
          dateLessThan,
          privateKey,
        });

        return { signedUrlOri };
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls, urlsOri, objectKeys }),
    };
  } catch (error) {
    console.error(
      "Error fetching DynamoDB items or generating pre-signed URLs:",
      error
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
