export function formatDateTime(value, locale) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  try {
    const formatter = new Intl.DateTimeFormat(locale ?? undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });

    return formatter.format(date);
  } catch {
    return date.toLocaleString(locale ?? undefined);
  }
}
