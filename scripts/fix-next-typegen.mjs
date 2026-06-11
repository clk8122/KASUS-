import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const routesJsPath = resolve(".next", "types", "routes.js");

await mkdir(dirname(routesJsPath), { recursive: true });
await writeFile(routesJsPath, "export {};\n", "utf8");
