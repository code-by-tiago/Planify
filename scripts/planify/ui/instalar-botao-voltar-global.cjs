const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const pageShellPath = path.join(root, "src", "components", "PageShell.tsx");

if (!fs.existsSync(pageShellPath)) {
  console.error("ERRO: src/components/PageShell.tsx não encontrado.");
  process.exit(1);
}

let text = fs.readFileSync(pageShellPath, "utf8");

if (!text.includes('from "./BackButton"')) {
  const importAnchor = 'import Link from "next/link";';

  if (text.includes(importAnchor)) {
    text = text.replace(importAnchor, `${importAnchor}\nimport { BackButton } from "./BackButton";`);
  } else {
    text = `import { BackButton } from "./BackButton";\n${text}`;
  }

  console.log("OK: import BackButton adicionado.");
} else {
  console.log("OK: import BackButton já existe.");
}

if (!text.includes("<BackButton")) {
  const logoBlockEnd = `</Link>

          <nav`;

  if (text.includes(logoBlockEnd)) {
    text = text.replace(
      logoBlockEnd,
      `</Link>

          <div className="hidden lg:block">
            <BackButton />
          </div>

          <nav`,
    );
    console.log("OK: BackButton inserido no header desktop.");
  } else {
    console.error("ERRO: não encontrei ponto seguro para inserir BackButton no PageShell.");
    process.exit(1);
  }

  const headerContainerEnd = `</div>
        </div>
      </header>`;

  if (text.includes(headerContainerEnd)) {
    text = text.replace(
      headerContainerEnd,
      `</div>

          <div className="mt-3 flex lg:hidden">
            <BackButton />
          </div>
        </div>
      </header>`,
    );
    console.log("OK: BackButton inserido no header mobile.");
  }
} else {
  console.log("OK: BackButton já estava inserido.");
}

fs.writeFileSync(pageShellPath, text, "utf8");
console.log("Concluído: botão Voltar global aplicado ao PageShell.");
