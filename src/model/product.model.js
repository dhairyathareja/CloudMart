import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

const productSchema = new Schema({
    productName:String,
    price:Number,
    qty:Number,
    imgUrl:String
})


const Product = new model('Product',productSchema);
export default Product;