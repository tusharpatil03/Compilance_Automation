import http from "http";
import app from "./app";
import dotenv from "dotenv";
import { initEventRuntime, shutdownEventRuntime } from "./Event/runtime";

dotenv.config();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

async function startServer() {
    await initEventRuntime();

    server.listen(PORT, () => {
        console.log(`server is ready at http://localhost:${PORT}`)
    });
}

async function shutdown(signal: string) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        await shutdownEventRuntime();
        process.exit(0);
    });
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});


void startServer();