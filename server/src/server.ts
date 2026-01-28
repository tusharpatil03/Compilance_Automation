import http from "http";
import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

function startServer() {
    server.listen(PORT, ()=> {
        console.log(`server is ready at http://localhost:${PORT}`)
    });
}

startServer();