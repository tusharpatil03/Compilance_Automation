import crypto from 'crypto';
import fs from 'fs';
import { parse } from 'dotenv';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');
const activeEnvironment =
  (process.env.NODE_ENV || 'development').trim() || 'development';
const envFilePath = path.join(projectRoot, `.env.${activeEnvironment}`);

const serializeEnvValue = (value: string) => JSON.stringify(value);

const upsertEnvVariable = (key: string, value: string) => {
  const envContent = fs.existsSync(envFilePath)
    ? fs.readFileSync(envFilePath, 'utf-8')
    : '';
  const serializedValue = serializeEnvValue(value);
  const nextLine = `${key}=${serializedValue}`;

  const lines = envContent ? envContent.split(/\r?\n/) : [];
  let replaced = false;

  const updatedLines = lines.map((line) => {
    if (new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`).test(line)) {
      replaced = true;
      return nextLine;
    }

    return line;
  });

  if (!replaced) {
    if (
      updatedLines.length > 0 &&
      updatedLines[updatedLines.length - 1] !== ''
    ) {
      updatedLines.push('');
    }

    updatedLines.push(nextLine);
  }

  fs.writeFileSync(envFilePath, `${updatedLines.join('\n')}\n`);
  console.log(`Added ${key} to ${path.relative(projectRoot, envFilePath)}`);
};

const readEnvFileValues = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return parse(fs.readFileSync(filePath, 'utf-8'));
};

type EnvVariable = {
  type: 'SECRET_KEY' | 'OTHER';
  key: string;
  defaultValue?: string;
};

const resolveCurrentEnvValues = () => {
  const baseEnvPath = path.join(projectRoot, '.env');
  const localEnvPath = path.join(projectRoot, '.env.local');
  const environmentSpecificPath = envFilePath;
  const environmentSpecificLocalPath = path.join(
    projectRoot,
    `.env.${activeEnvironment}.local`
  );

  return {
    ...readEnvFileValues(baseEnvPath),
    ...readEnvFileValues(localEnvPath),
    ...readEnvFileValues(environmentSpecificPath),
    ...readEnvFileValues(environmentSpecificLocalPath),
    ...process.env,
  };
};

function findEnvVariables(): EnvVariable[] {
  // env variables present in .env.example file
  const requiredEnvVariables: EnvVariable[] = [];

  const envExamplePath = path.join(projectRoot, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    console.warn(
      '.env.example file not found. Skipping environment variable check.'
    );
    return [];
  }

  const currentEnvValues = resolveCurrentEnvValues();
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  const lines = envExampleContent.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && !currentEnvValues[key]) {
        const variable: EnvVariable = {
          type: key.includes('SECRET') ? 'SECRET_KEY' : 'OTHER',
          key,
          defaultValue: value,
        };
        requiredEnvVariables.push(variable);
      }
    }
  }

  if (requiredEnvVariables.length > 0) {
    console.log(
      'The following environment variables are required but not set:',
      requiredEnvVariables
    );
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
};

async function init() {
  const requiredEnvVariables = findEnvVariables();
  if (requiredEnvVariables.length === 0) {
    console.log(
      'All required environment variables are already set. No action needed.'
    );
    process.exit(0);
  }

  console.log('Please provide values for the required environment variables:');

  for (const v of requiredEnvVariables) {
    if (v.type === 'SECRET_KEY') {
      v.defaultValue = crypto.randomBytes(32).toString('hex'); // generate a random 256-bit secret key for AES encryption
    }

    const value = await readInput(
      `Enter value for ${v.key} (default: ${v.defaultValue ?? 'none'}): `
    );
    const valueToSet = value || v.defaultValue;
    upsertEnvVariable(v.key, valueToSet ?? '');
  }

  process.exit(0);
}

init();
