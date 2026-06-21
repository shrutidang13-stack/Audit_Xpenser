const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const source = path.resolve(process.argv[2] || "backend/data/msme-guard.sqlite");
const destination = path.resolve(process.argv[3] || "E:/MSMEGuardBackups/msme-guard-compact-after-cleanup.sqlite");

if (!fs.existsSync(source)) {
  throw new Error(`Source database not found: ${source}`);
}
if (fs.existsSync(destination)) {
  fs.unlinkSync(destination);
}
fs.mkdirSync(path.dirname(destination), { recursive: true });

const db = new Database(source);
try {
  const quotedDestination = `'${destination.replace(/'/g, "''").replace(/\\/g, "/")}'`;
  db.exec(`VACUUM INTO ${quotedDestination};`);
  console.log(destination);
} finally {
  db.close();
}
