import crypto from 'crypto';
import fs, { read } from 'fs';
import path from 'path';

//function to add environment variable to .env file
const addEnvVariables = (key: string, value: string) => {
    const envFilePath = path.join(__dirname, "../.env");
    const envContent = `${key}=${value}\n`;
    fs.appendFileSync(envFilePath, envContent);
    console.log(`Added ${key} to .env file`);
}

type EnvVariable = {
    type: "SECRET_KEY" | "OTHER";
    key: string;
    defaultValue?: string;
}

//read keys from .env.example and add to .env if not present
function findEnvVariables(): EnvVariable[] {
    // env variables present in .env.example file
    const requiredEnvVariables: EnvVariable[] = [];

    const envExamplePath = path.join(__dirname, "../.env.example");
    if (!fs.existsSync(envExamplePath)) {
        console.warn(".env.example file not found. Skipping environment variable check.");
        return [];
    }

    const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");
    const lines = envExampleContent.split("\n");
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
            const [key, value] = trimmedLine.split("=");
            if (key && !process.env[key]) {
                const variable: EnvVariable = {
                    type: key.includes("SECRET") ? "SECRET_KEY" : "OTHER",
                    key,
                    defaultValue: value,
                }
                requiredEnvVariables.push(variable);
            }
        }
    }

    if (requiredEnvVariables.length > 0) {
        console.log("The following environment variables are required but not set:", requiredEnvVariables);
    }

    return requiredEnvVariables;
}

const readInput = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
        process.stdout.write(prompt);
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim());
        });
    });
}

async function init() {
    const requiredEnvVariables = findEnvVariables();
    if (requiredEnvVariables.length === 0) {
        console.log("All required environment variables are already set. No action needed.");
        process.exit(0);
    }

    console.log("Please provide values for the required environment variables:");

    for (const v of requiredEnvVariables) {
        if (v.type === "SECRET_KEY") {
            v.defaultValue = crypto.randomBytes(32).toString('hex'); // generate a random 256-bit secret key for AES encryption
        }

        const value = await readInput(`Enter value for ${v.key} (default: ${v.defaultValue ?? "none"}): `);
        const valueToSet = value || v.defaultValue;
        addEnvVariables(v.key, valueToSet ?? "");
    }

    process.exit(0);
}

init();