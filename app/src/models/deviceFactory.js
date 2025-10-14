import { generateId } from "../utils/id.js";

export function createDeviceTemplate(name, exerciseName, tenantId) {
  const deviceId = generateId("device");
  const exerciseId = generateId("exercise");

  return {
    id: deviceId,
    name,
    tenantId,
    published: false,
    settingsDefinitions: [],
    exercises: [
      {
        id: exerciseId,
        name: exerciseName
      }
    ]
  };
}

export function instantiateDevice(template) {
  return {
    id: generateId("assignment"),
    name: template.name,
    libraryDeviceId: template.id,
    tenantId: template.tenantId,
    published: Boolean(template.published),
    settingsLocked: false,
    settingsDefinitions: template.settingsDefinitions.map((definition) => ({ ...definition })),
    exercises:
      template.exercises.length > 0
        ? template.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            settingsValues: {}
          }))
        : [
            {
              id: generateId("exercise"),
              name: template.name,
              settingsValues: {}
            }
          ]
  };
}

export function hasRecordedSettings(device, userId) {
  return device.exercises.some((exercise) => {
    const values = exercise.settingsValues?.[userId];

    if (!values) {
      return false;
    }

    return Object.values(values).some((value) => value.trim().length > 0);
  });
}
