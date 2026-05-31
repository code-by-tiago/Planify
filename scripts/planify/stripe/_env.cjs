const fs = require("node:fs");
const path = require("node:path");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");

    if (index <= 0) {
      continue;
    }

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadPlanifyEnv(projectRoot) {
  parseEnvFile(path.join(projectRoot, ".env.local"));
  parseEnvFile(path.join(projectRoot, ".env"));
}

function getArg(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] || null;
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável ${name} não encontrada no .env.local.`);
  }

  return value;
}

module.exports = {
  getArg,
  loadPlanifyEnv,
  requireEnv,
};
