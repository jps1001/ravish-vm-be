import 'express-async-errors'
import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from 'cors';
import router from "./routes/router";
import startServer from "./server";
import { handleErrorMiddleware } from "./middleware/errorHandler";

// Loading environment file based on the development environment
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env`;
dotenv.config({ path: path.resolve(__dirname, `../${envFile}`) });

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.options('*', cors());

app.use('/api/v1/uploads', express.static(path.resolve(__dirname, '../public/uploads')));


app.use(express.json())

app.use("/api", router)
app.use(handleErrorMiddleware)

startServer(app, port, nodeEnv)
