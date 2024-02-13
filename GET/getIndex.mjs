import AWS from 'aws-sdk';

export const getIndex = async (event) => {
  const dynamodb = new AWS.DynamoDB.DocumentClient();

  try {
    const params = {
      TableName: "galleryTable",
    };

    const result = await dynamodb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error('Error scanning DynamoDB table:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
