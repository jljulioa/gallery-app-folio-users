import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const uniqueFilename = () => {
  const shortUuid = uuidv4().substring(0, 6); // Adjust the length as needed
  return `WallAI-${shortUuid}`;
};

export const uploadWallpaper = async (event) => {
  // Initialize the S3 client
  const s3Client = new S3Client();

  // Object key may have spaces or unicode non-ASCII characters
  const srcKey = decodeURIComponent(
    event.queryStringParameters.filename.replace(/\+/g, " ")
  );

  console.log(srcKey);

  // Infer the image type from the file suffix
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    console.log("Could not determine the image type.");
    return;
  }

  // Check that the image type is supported
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpg" && imageType != "png") {
    console.log(`Unsupported image type: ${imageType}`);
    return;
  }

  const fileName = uniqueFilename() + `.${imageType}`;

  console.log(fileName);

  // Generate a unique object key (path) for the uploaded file
  const objectKey = `uploads/${fileName}`;

  console.log(objectKey);

  // Set the expiration time for the pre-signed URL (in seconds)
  const expirationSeconds = 120; // Adjust the expiration time as needed

  // Create an instance of the PutObjectCommand to generate the pre-signed URL for upload
  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: objectKey,
    ContentTypeType: `image/${imageType}`,
  });

  try {
    // Generate the pre-signed URL for uploading
    const url = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: expirationSeconds,
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-amz-meta-alt-ename", // Include other headers if needed
      },
      body: JSON.stringify({ url, fileName }),
    };
  } catch (error) {
    console.error("Error generating pre-signed URL for upload:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
