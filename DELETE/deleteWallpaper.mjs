import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client();

export const deleteWallpaper = async (event, context) => {
  try {
    // Retrieve the image key from the S3 event
    const srckey = event.queryStringParameters.filename;

    console.log(srckey);

    const deleteKey = `uploads/${srckey}`;

    console.log(deleteKey);

    const command = new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: deleteKey,
    });

    const response = await s3.send(command);
    //-------------------------------------------------------------//

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-amz-meta-alt-ename", // Include other headers if needed
      },
      body: JSON.stringify(`{The key file ${deleteKey} was deleted}`, response),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
