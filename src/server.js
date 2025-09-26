import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

// import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';


import authRouter from './routes/auth.router.js';
import productRouter from "./routes/product.router.js";

import {verifyAdmin} from "./middleware/verifyAdmin.js";
import adminRouter from "./routes/admin.router.js";

import userRouter from "./routes/user.router.js";
import { verifyJWT } from "./middleware/verifyJWT.js";

const app = express();
const PORT= process.env.PORT;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "5kb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// build path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.join(__dirname, '../public/build');
app.use(express.static(buildPath));



app.use('/auth', authRouter); 

app.use('/admin',verifyAdmin,adminRouter);

app.use('/user',verifyJWT,userRouter);

app.use('/product',productRouter);



app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});



app.listen(PORT);