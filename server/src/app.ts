import express from "express";
import "dotenv/config";
import userRouter from "./modules/user/routes";

const app = express();

app.use("/user", userRouter);

app.listen(8000, ()=> {
    console.log(`server is ready at http://localhost:8000`)
})