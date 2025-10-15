# Training Log Recorder UX Concept

## Objective

Coaches need a quick way to capture individual exercise sets while working through a gym device plan. The recorder must:

- Surface the latest values to minimise typing effort.
- Keep the interaction lightweight so multiple sets can be logged in sequence.
- Highlight when the last set happened to support pacing and rest decisions.

## Interaction Flow

1. The coach opens a gym and sees each configured device with its exercises.
2. For every exercise a compact card displays:
   - Device metadata, including the tenant and when a set was last logged.
   - A form with numeric fields for each available weight stack and a repetitions input.
   - A selector for the weight unit, defaulting to kilograms while offering pounds for gyms using imperial plates.
   - The most recent set, prefilling the form values on load and after every submission.
   - A short history (latest three entries) to review recent work without leaving the screen.
3. The coach enters the weights, chooses the unit if needed, and fills in the repetitions before submitting the form. The entry is stored together with the chosen unit and a timestamp, then shown immediately in the history list.
4. The last-set indicator on the exercise and device updates to reflect the newly captured timestamp.

## Layout Principles

- **Form grouping:** Inputs align horizontally on wide screens and stack on smaller ones to stay readable.
- **Hierarchy:** The form sits above the history list so the next action is always in view. History entries use subdued colours to avoid drawing focus away from the form.
- **Feedback:** A concise "last set" label appears right above the form. After saving a set, the form keeps the entered values, signalling success without requiring additional indicators.

## Accessibility

- Inputs use explicit `<label>` elements with translated text for German and English.
- Buttons include descriptive text (`Save set` / `Satz speichern`).
- Timestamps rely on locale-aware formatting to respect the active language.

## Offline-First Considerations

All captured sets persist in the existing workspace storage that already syncs to `localStorage`. No network connection is required, and the history remains available across sessions.
