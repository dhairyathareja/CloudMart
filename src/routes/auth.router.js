
import express from "express";
import { loginController, signUpController } from "../controller/auth.controller.js";
const Router = express.Router();

Router.post('/signup',signUpController);
Router.post('/login',loginController);

export default Router;