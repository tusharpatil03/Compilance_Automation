import express from "express";
import "dotenv/config";
import userRouter from "./modules/customer/routes";
import cors from "cors";
import tenantRoutes from "./modules/tenant/routes";
import eventTestRoutes from "./Event/testRoute";
import Arena from "bull-arena";
import { FlowProducer, Queue } from "bullmq";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());

//cors
const allowedOrigins = ["http://localhost:4000"];
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS Origin:", origin); // Debugging log
      // allow requests with no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
          const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
          return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

//cookie parser
app.use(cookieParser());

app.use("/user", userRouter);
app.use("/tenant", tenantRoutes);
app.use("/event", eventTestRoutes);

//bullmq arena

// Arena config
const arenaConfig = Arena(
  {
    BullMQ: Queue,
    FlowBullMQ: FlowProducer,
    queues: [
      {
        name: "domain-events",
        hostId: "domain-events-queue",
        type: "bullmq",
        redis: {
          host: process.env.REDIS_HOST ?? "localhost",
          port: Number(process.env.REDIS_PORT ?? "6379"),
        },
      },
    ],
  },
  {
    basePath: "/arena",
    disableListen: true,
  },
);

app.use("/", arenaConfig);

export default app;
