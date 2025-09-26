import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/dynamoClient.js"; 
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

export const listProduct = ErrorWrapper(async (req, res, next) => {
  try {
    const result = await ddbDocClient.send(
      new ScanCommand({ TableName: PRODUCTS_TABLE })
    );

    
    res.status(200).json({
      message: "Product Fetched Successfully",
      product: result.Items || [],
    });
  } catch (error) {
    throw new ErrorHandler(501, `Error in fetching the Product List`);
  }
});
