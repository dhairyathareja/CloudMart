import express from "express";
import { purchaseProduct, viewHistory } from "../controller/user.controller.js";

const route=express.Router();

route.post('/purchase',purchaseProduct);
route.get('/orderHistory/:userEmail',viewHistory);

export default route;