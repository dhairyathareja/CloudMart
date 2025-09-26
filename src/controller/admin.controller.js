import { PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/dynamoClient.js";
import { v4 as uuidv4 } from "uuid";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import { uploadToS3 } from "../utils/s3Upload.js";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

export const addProduct = ErrorWrapper(async (req, res, next) => {
  const { productName, price, qty } = req.body;
  const file = req.file;

  if (!productName || !price || !qty) {
    throw new ErrorHandler(401, `Please enter all the details`);
  }

  if (!file) throw new ErrorHandler(401, `Image is required`);
  
  try {
    // Upload image to S3
    const imgUrl = await uploadToS3(file);

    const newProduct = {
      _id: uuidv4(), 
      productName,
      qty: Number(qty),
      price: Number(price),
      imgUrl, 
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: newProduct,
      })
    );

    res.status(200).json({
      message: "Product Added Successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler(501, `An Error Occurred, Contact Admin`);
  }
});

export const deleteProduct = ErrorWrapper(async (req, res, next) => {
  const { pId } = req.params;

  if (!pId) {
    throw new ErrorHandler(401, `An error occurred, contact Admin`);
  }

  try {
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: PRODUCTS_TABLE,
        Key: { _id: pId },
      })
    );

    res.status(200).json({
      message: "Product deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    throw new ErrorHandler(501, `An Error Occurred, Contact Admin`);
  }
});
