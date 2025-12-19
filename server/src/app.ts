import express from "express";
import "dotenv/config";
import { db } from "./db/connection";
import { Users } from "./models/User";


const app = express();