# UX Navigation Concept

This document summarises the navigation concept that guides the new UI structure.

## Goals

- Provide a clear entry point that lets coaches choose where they want to work before they see detailed data.
- Keep training-focused tasks separate from structural management so that day-to-day recording stays uncluttered.
- Ensure destructive actions like deleting a gym are only available with the right context and safeguards.

## Flow Overview

1. **Start page (Gym selection)**
   - Lists all gyms as cards with device counts and highlights the most recently used gym.
   - Provides a prominent form to add new gyms without leaving the page.
   - Selecting a gym moves the coach directly into the training overview for that location.

2. **Gym overview**
   - Shows the selected gym name with a quick summary of prepared devices.
   - Presents the training journal where coaches capture settings per exercise without configuration noise.
   - Offers a single entry point to open the management area when structural changes are needed.

3. **Gym management**
   - Focuses on administrative tasks: renaming, deleting (only when safe), and configuring devices.
   - Reuses the existing device management board, but only appears after the coach deliberately opens the management menu from the overview.
   - Provides clear navigation to return to the training overview after changes.

This separation keeps routine logging streamlined while still making configuration powerful and discoverable.
