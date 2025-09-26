import { GetCommand } from "@aws-sdk/lib-dynamodb";
import ErrorHandler from "../utils/ErrorHandler.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import jwt from "jsonwebtoken";
import { ddbDocClient } from "../utils/dynamoClient.js";

export const verifyAdmin=ErrorWrapper(async function (req,res,next){
    const USERS_TABLE = process.env.USERS_TABLE;
    try {

        const incomingAccessToken=req.cookies.AccessToken;
        const incomingRefreshToken=req.cookies.RefreshToken;  
        

        if(incomingAccessToken === undefined || incomingRefreshToken === undefined){
            throw new ErrorHandler(401,`You are not Authorised to Access, Kindly Login First`);
        }

        if(!incomingAccessToken || !incomingRefreshToken){
            throw new ErrorHandler(401,`You are not Authorised to Access, Kindly Login First`);
        }
        

        let userInfo=jwt.verify(incomingAccessToken, process.env.ACCESS_TOKEN_KEY);        
        let _id=userInfo.userId;
        
        const result = await ddbDocClient.send(
            new GetCommand({
            TableName: USERS_TABLE,
            Key: { _id },  
            })
        );
        
        const user=result.Item;
        
        if(user.role != "Admin"){
            throw new ErrorHandler(401,`You are not Authorised to Access`);
        }
        
        if(user.refreshToken !== incomingRefreshToken){
            throw new ErrorHandler(401,`You are not Authorised to Access, Kindly Login First`);
        }

        req.user=user;
        
        next();
    } catch (error) {
        if (error) throw new ErrorHandler(error.status,error.message);
        throw new ErrorHandler(501,`Server Error While Logging, Contact Admin`);
    }
})