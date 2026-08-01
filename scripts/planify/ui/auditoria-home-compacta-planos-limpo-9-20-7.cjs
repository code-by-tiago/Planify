const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
let failures=0,warnings=0;const report=[];
function ok(m){report.push(`[OK] ${m}`)}function warn(m){warnings++;report.push(`[AVISO] ${m}`)}function fail(m){failures++;report.push(`[ERRO] ${m}`)}
function read(p){try{return fs.readFileSync(path.join(root,p),"utf8")}catch{return ""}}
function walk(dir,files=[]){if(!fs.existsSync(dir))return files;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f,files);if(e.isFile())files.push(f)}return files}
const page=read("src/app/page.tsx"), css=read("src/app/globals.css");
if(page.includes("planify-landing--compact")&&page.includes("Planeje, crie e edite aulas em minutos"))ok("Home compacta 9.20.7 aplicada.");else fail("Home compacta 9.20.7 não encontrada.");
if(css.includes("PLANIFY_COMPACT_HOME_9_20_7_START"))ok("CSS compacto 9.20.7 presente.");else fail("CSS compacto 9.20.7 ausente.");
const planosFiles=walk(path.join(root,"src","app","planos")).filter(f=>/\.(tsx|ts|jsx|js)$/.test(f));const joined=planosFiles.map(f=>fs.readFileSync(f,"utf8")).join("\n");
for(const term of ["Checkout criado no servidor","A chave secreta do Stripe","/api/stripe/checkout"]){if(joined.includes(term))warn(`Texto técnico ainda encontrado em /planos: ${term}`);else ok(`Texto técnico removido/ausente: ${term}`)}
ok("Escopo esperado: home, CSS visual e textos de /planos. Não altera APIs, banco, Stripe, DOCX ou lógica premium.");
const outDir=path.join(root,"docs","auditorias");fs.mkdirSync(outDir,{recursive:true});const file=path.join(outDir,`auditoria-home-compacta-planos-limpo-9-20-7-${new Date().toISOString().replace(/[:.]/g,"-")}.md`);
const header=["# Planify — Auditoria 9.20.7 — Home compacta e planos limpo","",`Data: ${new Date().toLocaleString("pt-BR")}`,"",failures>0?`[ERRO] ${failures} falha(s).`:warnings>0?`[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`:"[OK] Ajustes aplicados.",""];
fs.writeFileSync(file,`${[...header,...report].join("\n")}\n`,"utf8");
console.log("\n===============================================\nPlanify | Auditoria 9.20.7\n===============================================\n");console.log(failures>0?`Resultado: FALHAS (${failures}) E AVISOS (${warnings})`:warnings>0?`Resultado: OK COM AVISOS (${warnings})`:"Resultado: OK");console.log(`\nRelatório salvo em: ${file}\n`);if(failures>0)process.exitCode=1;
