import { useCallback } from "react";
import { createDeviceTemplate, instantiateDevice, hasRecordedSettings } from "../models/deviceFactory.js";
import { generateId } from "../utils/id.js";

export function useWorkspaceActions(setWorkspace, defaultTenantId) {
  const selectGym = useCallback(
    (gymId) => {
      setWorkspace((previous) => ({ ...previous, selectedGymId: gymId }));
    },
    [setWorkspace]
  );

  const addGym = useCallback(
    (name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      setWorkspace((previous) => {
        const newGym = { id: generateId("gym"), name: trimmed, devices: [] };
        const gyms = [...previous.gyms, newGym];

        return {
          ...previous,
          gyms,
          selectedGymId: newGym.id
        };
      });
    },
    [setWorkspace]
  );

  const renameGym = useCallback(
    (gymId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      setWorkspace((previous) => ({
        ...previous,
        gyms: previous.gyms.map((gym) => (gym.id === gymId ? { ...gym, name: trimmed } : gym))
      }));
    },
    [setWorkspace]
  );

  const removeGym = useCallback(
    (gymId) => {
      setWorkspace((previous) => {
        const targetGym = previous.gyms.find((gym) => gym.id === gymId);

        if (!targetGym || targetGym.devices.length > 0) {
          return previous;
        }

        const gyms = previous.gyms.filter((gym) => gym.id !== gymId);
        const nextSelected = previous.selectedGymId === gymId ? gyms[0]?.id ?? null : previous.selectedGymId;

        return {
          ...previous,
          gyms,
          selectedGymId: nextSelected
        };
      });
    },
    [setWorkspace]
  );

  const createDevice = useCallback(
    (gymId, name, exerciseName) => {
      const trimmedName = name.trim();
      const trimmedExercise = exerciseName.trim();

      if (!trimmedName || !trimmedExercise) {
        return;
      }

      const template = createDeviceTemplate(trimmedName, trimmedExercise, defaultTenantId);
      const assignment = instantiateDevice(template);

      setWorkspace((previous) => ({
        ...previous,
        gyms: previous.gyms.map((gym) =>
          gym.id === gymId ? { ...gym, devices: [...gym.devices, assignment] } : gym
        ),
        deviceLibrary: [...previous.deviceLibrary, template]
      }));
    },
    [defaultTenantId, setWorkspace]
  );

  const adoptDeviceFromLibrary = useCallback(
    (gymId, templateId) => {
      if (!templateId) {
        return;
      }

      setWorkspace((previous) => {
        const template = previous.deviceLibrary.find((device) => device.id === templateId);

        if (!template) {
          return previous;
        }

        const assignment = instantiateDevice(template);

        return {
          ...previous,
          gyms: previous.gyms.map((gym) =>
            gym.id === gymId ? { ...gym, devices: [...gym.devices, assignment] } : gym
          )
        };
      });
    },
    [setWorkspace]
  );

  const updateDevice = useCallback(
    (gymId, deviceId, updater) => {
      setWorkspace((previous) => {
        let updatedDevice;

        const gymsWithUpdate = previous.gyms.map((gym) => {
          if (gym.id !== gymId) {
            return gym;
          }

          const updatedDevices = gym.devices.map((device) => {
            if (device.id !== deviceId) {
              return device;
            }

            const nextDevice = updater(device);
            updatedDevice = nextDevice;
            return nextDevice;
          });

          return { ...gym, devices: updatedDevices };
        });

        if (!updatedDevice) {
          return previous;
        }

        const updatedLibrary = previous.deviceLibrary.map((libraryDevice) => {
          if (libraryDevice.id !== updatedDevice.libraryDeviceId) {
            return libraryDevice;
          }

          return {
            ...libraryDevice,
            name: updatedDevice.name,
            tenantId: updatedDevice.tenantId,
            published: updatedDevice.published,
            settingsDefinitions: updatedDevice.settingsDefinitions.map((definition) => ({
              id: definition.id,
              name: definition.name
            })),
            exercises: updatedDevice.exercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.name
            }))
          };
        });

        return { ...previous, gyms: gymsWithUpdate, deviceLibrary: updatedLibrary };
      });
    },
    [setWorkspace]
  );

  const renameDevice = useCallback(
    (gymId, deviceId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      updateDevice(gymId, deviceId, (device) => ({ ...device, name: trimmed }));
    },
    [updateDevice]
  );

  const publishDevice = useCallback(
    (gymId, deviceId) => {
      updateDevice(gymId, deviceId, (device) => ({ ...device, published: true }));
    },
    [updateDevice]
  );

  const addSetting = useCallback(
    (gymId, deviceId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      updateDevice(gymId, deviceId, (device) => ({
        ...device,
        settingsDefinitions: [...device.settingsDefinitions, { id: generateId("setting"), name: trimmed }]
      }));
    },
    [updateDevice]
  );

  const renameSetting = useCallback(
    (gymId, deviceId, settingId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      updateDevice(gymId, deviceId, (device) => ({
        ...device,
        settingsDefinitions: device.settingsDefinitions.map((definition) =>
          definition.id === settingId ? { ...definition, name: trimmed } : definition
        )
      }));
    },
    [updateDevice]
  );

  const removeSetting = useCallback(
    (gymId, deviceId, settingId) => {
      updateDevice(gymId, deviceId, (device) => ({
        ...device,
        settingsDefinitions: device.settingsDefinitions.filter((definition) => definition.id !== settingId)
      }));
    },
    [updateDevice]
  );

  const addExercise = useCallback(
    (gymId, deviceId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      updateDevice(gymId, deviceId, (device) => ({
        ...device,
        exercises: [
          ...device.exercises,
          {
            id: generateId("exercise"),
            name: trimmed,
            settingsValues: {}
          }
        ]
      }));
    },
    [updateDevice]
  );

  const renameExercise = useCallback(
    (gymId, deviceId, exerciseId, name) => {
      const trimmed = name.trim();

      if (!trimmed) {
        return;
      }

      updateDevice(gymId, deviceId, (device) => ({
        ...device,
        exercises: device.exercises.map((exercise) =>
          exercise.id === exerciseId ? { ...exercise, name: trimmed } : exercise
        )
      }));
    },
    [updateDevice]
  );

  const removeExercise = useCallback(
    (gymId, deviceId, exerciseId) => {
      updateDevice(gymId, deviceId, (device) => {
        if (device.exercises.length <= 1) {
          return device;
        }

        return {
          ...device,
          exercises: device.exercises.filter((exercise) => exercise.id !== exerciseId)
        };
      });
    },
    [updateDevice]
  );

  const updateSettingValue = useCallback(
    (gymId, deviceId, exerciseId, settingId, value, userId) => {
      updateDevice(gymId, deviceId, (device) => {
        const exercises = device.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) {
            return exercise;
          }

          const values = exercise.settingsValues ?? {};
          const userValues = values[userId] ?? {};
          const nextUserValues = { ...userValues };
          const trimmed = value.trim();

          if (trimmed.length === 0) {
            delete nextUserValues[settingId];
          } else {
            nextUserValues[settingId] = value;
          }

          const nextValues = { ...values };

          if (Object.keys(nextUserValues).length === 0) {
            delete nextValues[userId];
          } else {
            nextValues[userId] = nextUserValues;
          }

          return { ...exercise, settingsValues: nextValues };
        });

        const shouldLock = device.settingsLocked || hasRecordedSettings({ ...device, exercises }, userId);

        return {
          ...device,
          exercises,
          settingsLocked: shouldLock
        };
      });
    },
    [updateDevice]
  );

  return {
    selectGym,
    addGym,
    renameGym,
    removeGym,
    createDevice,
    adoptDeviceFromLibrary,
    renameDevice,
    publishDevice,
    addSetting,
    renameSetting,
    removeSetting,
    addExercise,
    renameExercise,
    removeExercise,
    updateSettingValue
  };
}
