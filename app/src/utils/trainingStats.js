import { formatDateTime } from "./datetime.js";

function isValidTimestamp(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  const time = Date.parse(value);
  return !Number.isNaN(time);
}

function normaliseWeightStackCount(count) {
  return count === 2 ? 2 : 1;
}

function entryTotalLoad(entry) {
  if (!entry || !Array.isArray(entry.loads)) {
    return Number.NEGATIVE_INFINITY;
  }

  let total = 0;
  let hasValue = false;

  for (const value of entry.loads) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
      hasValue = true;
    }
  }

  return hasValue ? total : Number.NEGATIVE_INFINITY;
}

function findPersonalBestEntry(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  let bestEntry = entries[0];
  let bestTotal = entryTotalLoad(bestEntry);

  for (let index = 1; index < entries.length; index += 1) {
    const candidate = entries[index];
    const total = entryTotalLoad(candidate);

    if (total > bestTotal) {
      bestEntry = candidate;
      bestTotal = total;
    }
  }

  return bestEntry;
}

export function createExerciseKey(gymId, deviceId, exerciseId) {
  return `${gymId}::${deviceId}::${exerciseId}`;
}

function getUserEntries(exercise, tenantId, userId) {
  if (!exercise || typeof exercise !== "object") {
    return [];
  }

  const tenantLog = exercise.trainingLog?.[tenantId];
  if (!tenantLog || typeof tenantLog !== "object") {
    return [];
  }

  const entries = tenantLog[userId];
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter((entry) => isValidTimestamp(entry?.performedAt));
}

export function collectUserExerciseSummaries(gyms, userId) {
  if (!Array.isArray(gyms) || !userId) {
    return [];
  }

  const summaries = [];

  for (const gym of gyms) {
    if (!gym || typeof gym !== "object") {
      continue;
    }

    for (const device of gym.devices ?? []) {
      const tenantId = device?.tenantId ?? "tenant-default";
      const exercises = Array.isArray(device?.exercises) ? device.exercises : [];

      for (const exercise of exercises) {
        const entries = getUserEntries(exercise, tenantId, userId);

        if (entries.length === 0) {
          continue;
        }

        const lastEntry = entries[0];
        const lastPerformedAt = isValidTimestamp(lastEntry?.performedAt)
          ? lastEntry.performedAt
          : null;

        if (!lastPerformedAt) {
          continue;
        }

        summaries.push({
          key: createExerciseKey(gym.id, device.id, exercise.id),
          gymId: gym.id,
          gymName: gym.name,
          deviceId: device.id,
          deviceName: device.name,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          entries,
          lastPerformedAt,
          weightStackCount: normaliseWeightStackCount(device.weightStackCount),
          tenantId,
          personalBestEntry: findPersonalBestEntry(entries)
        });
      }
    }
  }

  summaries.sort((left, right) => {
    const leftTime = Date.parse(left.lastPerformedAt);
    const rightTime = Date.parse(right.lastPerformedAt);

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }

    if (Number.isNaN(leftTime)) {
      return 1;
    }

    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return rightTime - leftTime;
  });

  return summaries;
}

export function deriveGymActivity(summaries) {
  const activity = {};

  for (const summary of summaries) {
    if (!summary?.gymId || !isValidTimestamp(summary.lastPerformedAt)) {
      continue;
    }

    const timestamp = Date.parse(summary.lastPerformedAt);

    if (Number.isNaN(timestamp)) {
      continue;
    }

    const existing = activity[summary.gymId];

    if (!existing || existing.timestamp < timestamp) {
      activity[summary.gymId] = {
        timestamp,
        lastPerformedAt: summary.lastPerformedAt
      };
    }
  }

  return activity;
}

export function formatLoads(loads, language) {
  if (!Array.isArray(loads) || loads.length === 0) {
    return "";
  }

  return loads
    .map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? value.toLocaleString(language, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : ""
    )
    .filter((label) => label.length > 0)
    .join(" / ");
}

export function describeEntry(entry, language, t, unitAbbreviationMap) {
  if (!entry || !isValidTimestamp(entry.performedAt)) {
    return null;
  }

  const timestampLabel = formatDateTime(entry.performedAt, language);
  const loadsLabel = formatLoads(entry.loads, language);
  const unit = entry.unit === "lb" ? "lb" : "kg";
  const unitLabel = unitAbbreviationMap[unit] ?? unitAbbreviationMap.kg;

  return t("userOverview.detail.historyEntry", {
    timestamp: timestampLabel,
    repetitions: entry.repetitions,
    weights: loadsLabel,
    unit: unitLabel
  });
}
