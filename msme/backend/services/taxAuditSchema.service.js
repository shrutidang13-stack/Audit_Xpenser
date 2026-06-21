const fs = require("fs");
const path = require("path");

const SCHEMA_DIR = path.resolve(process.cwd(), "backend/schemas/tax-audit");
const FORM_CONFIG = {
  "3CA": { file: "schema_3CA.json", root: "FORM3CA", body: "F3CA", formName: "Form 3CA-3CD" },
  "3CB": { file: "schema_3CB.json", root: "FORM3CB", body: "F3CB", formName: "Form 3CB-3CD" },
};

const schemaCache = new Map();

function normalizeFormType(formType) {
  const normalized = String(formType || "").toUpperCase();
  if (!FORM_CONFIG[normalized]) throw new Error("formType must be 3CA or 3CB");
  return normalized;
}

function loadSchema(formType) {
  const normalized = normalizeFormType(formType);
  if (!schemaCache.has(normalized)) {
    const schemaPath = path.join(SCHEMA_DIR, FORM_CONFIG[normalized].file);
    schemaCache.set(normalized, JSON.parse(fs.readFileSync(schemaPath, "utf8")));
  }
  return schemaCache.get(normalized);
}

function resolveRef(schema, ref) {
  if (!ref || !ref.startsWith("#/definitions/")) return null;
  const key = ref.replace("#/definitions/", "");
  return schema.definitions?.[key] || null;
}

function deref(schema, node) {
  if (!node || typeof node !== "object") return node;
  return node.$ref ? resolveRef(schema, node.$ref) || node : node;
}

function collectRequiredMap(formType) {
  const schema = loadSchema(formType);
  const out = {};
  function walk(node, currentPath) {
    const resolved = deref(schema, node);
    if (!resolved || typeof resolved !== "object") return;
    if (Array.isArray(resolved.required)) out[currentPath || "<root>"] = resolved.required;
    for (const [key, child] of Object.entries(resolved.properties || {})) {
      walk(child, currentPath ? `${currentPath}.${key}` : key);
    }
  }
  walk(schema, "");
  return out;
}

function allowedFieldsFor(formType) {
  const schema = loadSchema(formType);
  const config = FORM_CONFIG[normalizeFormType(formType)];
  const body = schema.definitions?.[config.body] || {};
  return {
    root: Object.keys(schema.properties || {}),
    reportBody: Object.keys(body.properties || {}),
  };
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function matchesType(value, type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((item) => {
    if (item === "integer") return Number.isInteger(value);
    if (item === "number") return typeof value === "number" && Number.isFinite(value);
    if (item === "array") return Array.isArray(value);
    if (item === "object") return value && typeof value === "object" && !Array.isArray(value);
    return typeof value === item;
  });
}

function validateNode(schema, node, value, schemaPath, errors) {
  const resolved = deref(schema, node);
  if (!resolved || typeof resolved !== "object") return;

  if (resolved.type && value !== undefined && !matchesType(value, resolved.type)) {
    errors.push({
      path: schemaPath,
      message: `Expected ${resolved.type}, received ${valueType(value)}`,
      code: "SCHEMA_TYPE",
    });
    return;
  }

  if (resolved.enum && value !== undefined && !resolved.enum.includes(value)) {
    errors.push({ path: schemaPath, message: `Value is not in enum: ${resolved.enum.join(", ")}`, code: "SCHEMA_ENUM" });
  }

  if (resolved.type === "object" || resolved.properties) {
    const objectValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    for (const key of resolved.required || []) {
      if (objectValue[key] === undefined || objectValue[key] === null || objectValue[key] === "") {
        errors.push({ path: `${schemaPath}.${key}`, message: `${key} is required`, code: "SCHEMA_REQUIRED" });
      }
    }
    if (resolved.additionalProperties === false) {
      const allowed = new Set(Object.keys(resolved.properties || {}));
      for (const key of Object.keys(objectValue)) {
        if (!allowed.has(key)) {
          errors.push({ path: `${schemaPath}.${key}`, message: `${key} is not allowed by official schema`, code: "SCHEMA_UNKNOWN_FIELD" });
        }
      }
    }
    for (const [key, child] of Object.entries(resolved.properties || {})) {
      if (objectValue[key] !== undefined) validateNode(schema, child, objectValue[key], `${schemaPath}.${key}`, errors);
    }
  }

  if (resolved.type === "array" && Array.isArray(value)) {
    value.forEach((item, index) => validateNode(schema, resolved.items || {}, item, `${schemaPath}[${index}]`, errors));
  }
}

function validateJson(formType, payload) {
  const schema = loadSchema(formType);
  const errors = [];
  validateNode(schema, schema, payload, "$", errors);
  return { valid: errors.length === 0, errors };
}

function metadata(formType) {
  const normalized = normalizeFormType(formType);
  const schema = loadSchema(normalized);
  return {
    formType: normalized,
    rootKey: FORM_CONFIG[normalized].root,
    bodyKey: FORM_CONFIG[normalized].body,
    schemaVersion: schema.definitions?.Form_Details?.properties?.SchemaVer?.enum?.[0] || "2.5",
    formVersion: schema.definitions?.Form_Details?.properties?.FormVer?.enum?.[0] || "1",
    requiredMap: collectRequiredMap(normalized),
    allowedFields: allowedFieldsFor(normalized),
  };
}

module.exports = {
  normalizeFormType,
  loadSchema,
  metadata,
  allowedFieldsFor,
  collectRequiredMap,
  validateJson,
};
