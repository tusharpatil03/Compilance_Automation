import fs from 'fs';
import path from 'path';
import { parse } from 'dotenv';

const loadedEnvironments = new Set<string>();

function getEnvironmentName() {
  return (process.env.NODE_ENV || 'development').trim() || 'development';
}

function getEnvironmentFilePaths(environmentName: string) {
  const rootDirectory = process.cwd();

  return [
    '.env',
    '.env.local',
    `.env.${environmentName}`,
    `.env.${environmentName}.local`,
  ].map((fileName) => path.resolve(rootDirectory, fileName));
}

function loadEnvFile(filePath: string, lockedKeys: Set<string>) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = parse(fileContent);

  for (const [key, value] of Object.entries(parsed)) {
    if (lockedKeys.has(key)) {
      continue;
    }

    process.env[key] = value;
  }
}

export function loadEnvironment() {
  const environmentName = getEnvironmentName();

  if (loadedEnvironments.has(environmentName)) {
    return environmentName;
  }

  const lockedKeys = new Set(Object.keys(process.env));

  for (const filePath of getEnvironmentFilePaths(environmentName)) {
    loadEnvFile(filePath, lockedKeys);
  }

  loadedEnvironments.add(environmentName);

  return environmentName;
}
