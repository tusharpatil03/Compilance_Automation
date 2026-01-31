import express from "express";
import "dotenv/config";
import userRouter from "./modules/customers/routes";
import cors from "cors";
import tenantRoutes from "./modules/tenant/routes";

const app = express();
app.use(express.json());

//cors
const allowedOrigins = ["http://localhost:5173"];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));

app.use("/user", userRouter);
app.use("/tenant", tenantRoutes);

export default app;