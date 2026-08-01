const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const loginClientPath = path.join(root, "src", "app", "login", "LoginClient.tsx");

if (!fs.existsSync(loginClientPath)) {
  console.error("ERRO: src/app/login/LoginClient.tsx não encontrado.");
  process.exit(1);
}

let text = fs.readFileSync(loginClientPath, "utf8");

if (!text.includes('sessionStorage.setItem("planify_admin_tab_unlocked"')) {
  text = text.replace(
    "await createAdminSession(result.accessToken);",
    `await createAdminSession(result.accessToken);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("planify_admin_tab_unlocked", "true");
        }`,
  );

  fs.writeFileSync(loginClientPath, text, "utf8");
  console.log("OK: Login admin agora cria trava de sessão por aba.");
} else {
  console.log("OK: Login admin já tinha trava por aba.");
}
