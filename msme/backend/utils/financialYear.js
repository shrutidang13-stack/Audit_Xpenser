function text(value) {
  return String(value || "").trim();
}

function normalizeCompactDate(value) {
  const raw = text(value).replace(/-/g, "");
  return /^\d{8}$/.test(raw) ? raw : "";
}

function fiscalYearForDate(value) {
  const compact = normalizeCompactDate(value);
  if (!compact) return "";
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function fiscalYearDates(fiscalYear) {
  const match = text(fiscalYear).match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const startYear = Number(match[1]);
  return {
    financialYear: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
    fyStartDate: `${startYear}0401`,
    fyEndDate: `${startYear + 1}0331`,
  };
}

function minCompactDate(...values) {
  return values.map(normalizeCompactDate).filter(Boolean).sort()[0] || "";
}

function maxCompactDate(...values) {
  const dates = values.map(normalizeCompactDate).filter(Boolean).sort();
  return dates[dates.length - 1] || "";
}

function splitIntoFinancialYearPeriods({ fromDate, toDate, asOnDate, capToAsOn = true }) {
  const from = normalizeCompactDate(fromDate);
  const selectedTo = normalizeCompactDate(toDate);
  const asOn = normalizeCompactDate(asOnDate);
  if (!from || !selectedTo || from > selectedTo) return [];

  const periods = [];
  let startYear = Number(fiscalYearForDate(from).slice(0, 4));
  const endYear = Number(fiscalYearForDate(selectedTo).slice(0, 4));
  while (startYear <= endYear) {
    const fiscalYear = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
    const dates = fiscalYearDates(fiscalYear);
    const reportFromDate = maxCompactDate(from, dates.fyStartDate);
    const uncappedToDate = minCompactDate(selectedTo, dates.fyEndDate);
    const reportToDate = capToAsOn && asOn ? minCompactDate(uncappedToDate, asOn) : uncappedToDate;
    if (reportFromDate && reportToDate && reportFromDate <= reportToDate) {
      periods.push({
        financialYear: fiscalYear,
        fyStartDate: dates.fyStartDate,
        fyEndDate: dates.fyEndDate,
        reportFromDate,
        reportToDate,
        asOnDate: asOn,
        cappedByAsOn: Boolean(capToAsOn && asOn && asOn < uncappedToDate),
      });
    }
    startYear += 1;
  }
  return periods;
}

function periodForVoucherDate(date, periods = []) {
  const compact = normalizeCompactDate(date);
  return periods.find((period) => compact >= period.reportFromDate && compact <= period.reportToDate) || null;
}

function displayDate(value) {
  const compact = normalizeCompactDate(value);
  if (!compact) return "";
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

module.exports = {
  normalizeCompactDate,
  fiscalYearForDate,
  fiscalYearDates,
  splitIntoFinancialYearPeriods,
  periodForVoucherDate,
  displayDate,
};
