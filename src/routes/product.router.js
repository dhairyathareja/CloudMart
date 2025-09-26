import express from "express";
import { listProduct } from "../controller/product.controller.js";

const route=express.Router();

route.get('/list',listProduct);

export default route;