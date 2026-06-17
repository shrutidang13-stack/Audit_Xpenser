const CATEGORY_ORDER = [
  "expense-ledger",
  "bills",
  "tds-data",
  "gst-data",
  "supporting-documents"
];

export function selectLatestUploadFilesByCategory(files = []) {
  const groups = new Map();
  for (const file of files || []) {
    const category = file.category || "uncategorised";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(file);
  }

  const selected = [];
  for (const group of groups.values()) {
    const ordered = [...group].sort(compareUploadedDesc);
    const latestSessionId = ordered.find((file) => file.upload_session_id)?.upload_session_id;
    if (latestSessionId) {
      selected.push(...ordered.filter((file) => file.upload_session_id === latestSessionId));
    } else {
      selected.push(...ordered);
    }
  }

  return selected.sort(compareForDisplay);
}

export function selectLatestUploadFileIdsByCategory(files = []) {
  return selectLatestUploadFilesByCategory(files)
    .map((file) => Number(file.id))
    .filter((id) => Number.isFinite(id));
}

function compareForDisplay(a, b) {
  const categoryDiff = categoryRank(a.category) - categoryRank(b.category);
  if (categoryDiff !== 0) return categoryDiff;
  return compareUploadedDesc(a, b);
}

function categoryRank(category) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function compareUploadedDesc(a, b) {
  const timeDiff = timestamp(b.created_at) - timestamp(a.created_at);
  if (timeDiff !== 0) return timeDiff;
  return Number(b.id || 0) - Number(a.id || 0);
}

function timestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}
