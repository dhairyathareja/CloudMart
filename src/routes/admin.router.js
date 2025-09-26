import express, { Router } from "express";
import { addProduct, deleteProduct } from "../controller/admin.controller.js";
import {upload} from "../utils/multer.js";

const route=Router();

route.post('/addProduct',upload.single('imgUrl'),addProduct);
route.get('/deleteProduct/:pId',deleteProduct);

export default route;