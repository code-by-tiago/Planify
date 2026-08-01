const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function parseEnvFile(file) {
  const env = {};

  if (!fs.existsSync(file)) {
    return env;
  }

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    env[key] = value;
  }

  return env;
}

async function main() {
  const env = {
    ...parseEnvFile(path.join(root, ".env.local")),
    ...process.env,
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("");
  console.log("Planify | Marketplace Supabase Probe");
  console.log("");

  if (!url || !serviceRole) {
    console.log("[ERRO] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.");
    process.exit(1);
  }

  let createClient;

  try {
    ({ createClient } = require("@supabase/supabase-js"));
  } catch {
    console.log("[ERRO] @supabase/supabase-js não encontrado.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const candidateTables = [
    "marketplace_materials",
    "marketplace_items",
    "marketplace_posts",
    "teacher_materials",
    "shared_materials",
  ];

  console.log("Tabelas candidatas:");

  for (const table of candidateTables) {
    const { data, error, count } = await supabase
      .from(table)
      .select("*", { count: "exact" })
      .limit(3);

    if (error) {
      console.log(`[NAO ENCONTRADA] ${table}: ${error.message}`);
    } else {
      console.log(`[OK] ${table}: registros aproximados ${count ?? data?.length ?? 0}`);

      if (data && data.length > 0) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  console.log("");
  console.log("Buckets:");

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.log(`[ERRO] ${error.message}`);
    return;
  }

  for (const bucket of buckets || []) {
    const marker = /marketplace|materiais-professores|teacher|shared/i.test(bucket.name)
      ? "[POSSIVEL MARKETPLACE]"
      : "[bucket]";

    console.log(`${marker} ${bucket.name} | public=${bucket.public}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
