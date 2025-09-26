import { ddbDocClient } from "../utils/dynamoClient.js";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";

const USERS_TABLE = process.env.USERS_TABLE;

export const signUpController = ErrorWrapper(async (req, res) => {
  const { name, email, phone, password, address } = req.body;

  if (!name || !email || !phone || !password || !address) {
    throw new ErrorHandler(401, `Please Enter the details....`);
  }
 
  const emailRegex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
  if (!emailRegex.test(email)) {
    throw new ErrorHandler(401, `Please Enter a Valid Email`);
  }


  // Check Existing User
  const existingUser = await ddbDocClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "EmailIndex", 
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    })
  );

  if (existingUser.Count > 0) {
    throw new ErrorHandler(400, `User Already Exists`);
  }


  // Create new user
  const _id = uuidv4();
  const hashedPassword = await hashPassword(password);

  const newUser = {
    _id,
    name,
    email,
    phone,
    password: hashedPassword,
    address,
    role: "User",
    orderHistory: [],
    refreshToken: "",
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: newUser,
    })
  );

  // Generate tokens
  const accessToken = generateAccessToken(newUser);
  const refreshToken = generateRefreshToken(newUser);

  // Save refresh token
  newUser.refreshToken = refreshToken;
  await ddbDocClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: newUser,
    })
  );

  delete newUser.password;

  res
    .status(201)
    .cookie("AccessToken", accessToken)
    .cookie("RefreshToken", refreshToken)
    .json({
      message: "SignUp Successful",
      user: newUser,
    });
});



export const loginController = ErrorWrapper(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ErrorHandler(401, `Please Enter the Details`);
  }

  // Query DynamoDB using GSI EmailIndex
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "EmailIndex",   // GSI on email
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    throw new ErrorHandler(401, `User Does Not Exist`);
  }

  const user = result.Items[0]; 
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ErrorHandler(400, `Entered Password is not correct`);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Update refreshToken in DynamoDB
  user.refreshToken = refreshToken;
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { _id: user._id }, 
      UpdateExpression: "set refreshToken = :r",
      ExpressionAttributeValues: {
        ":r": refreshToken,
      },
    })
  );

  delete user.password;

  res
    .status(200)
    .cookie("AccessToken", accessToken)
    .cookie("RefreshToken", refreshToken)
    .json({
      message: "Login Successful",
      user: user,
    });
});

