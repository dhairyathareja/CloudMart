import { GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../utils/dynamoClient.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import { v4 as uuidv4 } from "uuid";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const EMAIL_INDEX = "EmailIndex"; // your GSI name

export const purchaseProduct = ErrorWrapper(async (req, res, next) => {
  const { pId, email } = req.body;
  if (!pId || !email) throw new ErrorHandler(401, "Missing pId or email");

  const today = new Date();
  const billDate = today.toLocaleDateString("en-CA");

  let productBeforeUpdate = null;
  try {
    // 1) Fetch product by PK (_id)
    const prodResp = await ddbDocClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { _id: pId },
      })
    );

    if (!prodResp.Item) throw new ErrorHandler(404, "Product not found");
    productBeforeUpdate = prodResp.Item;

   
    const updateProdResp = await ddbDocClient.send(
      new UpdateCommand({
        TableName: PRODUCTS_TABLE,
        Key: { _id: pId },
        UpdateExpression: "SET qty = qty - :one",
        ConditionExpression: "qty >= :one",
        ExpressionAttributeValues: {
          ":one": 1,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    const updatedProduct = updateProdResp.Attributes || productBeforeUpdate;

    
    const newOrder = {
      orderId: uuidv4(),
      items: {
        name: updatedProduct.productName,
        price: updatedProduct.price,
        imgUrl: updatedProduct.imgUrl,
      },
      tototalAmt: updatedProduct.price, // kept original name
      billDate,
    };

    
    const userQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: EMAIL_INDEX,
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
        Limit: 1,
      })
    );

    if (!userQuery.Items || userQuery.Items.length === 0) {
      
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: PRODUCTS_TABLE,
          Key: { _id: pId },
          UpdateExpression: "SET qty = qty + :one",
          ExpressionAttributeValues: { ":one": 1 },
        })
      );
      throw new ErrorHandler(404, "User not found");
    }

    const user = userQuery.Items[0];

    
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { _id: user._id }, 
        UpdateExpression:
          "SET orderHistory = list_append(:newOrder, if_not_exists(orderHistory, :empty))",
        ExpressionAttributeValues: {
          ":newOrder": [newOrder],
          ":empty": [],
        },
        ReturnValues: "UPDATED_NEW",
      })
    );

    
    res.status(200).json({
      message: "Order Purchased Successfully",
      order: newOrder,
    });
  } catch (err) {
    
    if (err.name === "ConditionalCheckFailedException") {
      throw new ErrorHandler(400, "Product out of stock");
    }

    
    if (productBeforeUpdate) {
      try {
    
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { _id: pId },
            UpdateExpression: "SET qty = qty + :one",
            ExpressionAttributeValues: { ":one": 1 },
          })
        );
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    console.error(err);
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(501, "Error in purchasing product contact admin");
  }
});

export const viewHistory = ErrorWrapper(async (req, res, next) => {
  const { userEmail } = req.params;
  if (!userEmail) throw new ErrorHandler(401, "Missing userEmail param");

  try {
   
    const userQuery = await ddbDocClient.send(
      new QueryCommand({
        TableName: USERS_TABLE,
        IndexName: EMAIL_INDEX,
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": userEmail,
        },
        Limit: 1,
      })
    );

    if (!userQuery.Items || userQuery.Items.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }

    const user = userQuery.Items[0];

    res.status(200).json({
      message: "Order History Fetched Successfully",
      prevOrders: user.orderHistory || [],
    });
  } catch (err) {
    console.error(err);
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(501, "Error in fetching purchase history contact admin");
  }
});
