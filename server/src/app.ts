import express from "express";
import "dotenv/config";
import userRouter from "./modules/customers/routes";

const app = express();
app.use(express.json());

app.use("/user", userRouter);

export default app;