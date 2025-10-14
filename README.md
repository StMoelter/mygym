# MyGym React Starter

Diese Repository enthält eine moderne React-Anwendung als Ausgangspunkt für deine individuelle MyGym-App. Sie ist
optimiert für Continuous Integration, testgetriebene Entwicklung und mobile Nutzung.

## Features

- ⚛️ React 18 mit Vite-Bundler für schnelle Entwicklungszyklen
- 🏋️‍♀️ Gym-Portfolio-Management (CRUD) für mehrere Trainingsstandorte
- 💾 Persistente Gym-Daten per Local Storage, optimiert für wiederkehrende Smartphone-Sessions
- 🧪 Vitest & Testing Library mit Beispieltests und Coverage-Setup
- 🧹 ESLint-Konfiguration (inkl. React Hooks und Accessibility-Regeln)
- 🔁 CI-Workflow (GitHub Actions) zum automatischen Ausführen von Tests und Linting bei jedem Commit und Pull-Request
- 📱 Sportliches, responsives UI-Design, optimiert für Smartphone-Ansichten
- 🌐 Internationalisierung mit i18next (Deutsch als aktuelle App-Sprache, englische Fallback-Übersetzungen)

## Entwicklung starten

```bash
cd app
npm install
npm run dev
```

Die App ist anschließend unter <http://localhost:5173> erreichbar. Mit `npm run test` startest du die Tests im
Watch-Modus, `npm run lint` prüft den Code-Stil.

## Internationalisierung

- Alle UI-Texte werden über `react-i18next` aus JSON-Ressourcen geladen (`app/src/i18n/resources`).
- Neue Features müssen sowohl eine englische als auch eine deutsche Übersetzung erhalten; Deutsch ist aktuell die aktive App-Sprache.
- Tests stellen sicher, dass der englische Fallback funktioniert und dass nur Deutsch zur Auswahl steht, bis weitere Sprachen ergänzt werden.

## Weitere Empfehlungen für professionelle Vibe-Coding-Workflows

- **Architektur & Wartbarkeit**
  - Nutze das [Law of Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter), indem Komponenten nur über klar
definierte Schnittstellen kommunizieren.
  - Führe regelmäßige Refactorings durch (Extract Component/Hook, Utility-Funktionen), um Duplikate zu vermeiden und
    Verantwortlichkeiten zu schärfen.
  - Dokumentiere Architekturentscheidungen in ADRs (Architecture Decision Records).

- **Qualitätssicherung**
  - Ergänze Integrationstests (z. B. mit Playwright) für kritische Userflows.
  - Messe und überwache Test-Coverage, um Regressionen schnell zu erkennen.
  - Automatisiere Dependency-Updates (Renovate, Dependabot) mit verpflichtenden Checks.

- **DevEx & Automatisierung**
  - Richte Pre-Commit-Hooks (z. B. mit Husky & lint-staged) ein, um Tests/Linting vor jedem Commit lokal auszuführen.
  - Nutze Storybook oder Ladle, um UI-Komponenten isoliert zu entwickeln und visualisieren.
  - Erweitere den CI-Prozess um automatisierte Deployments (z. B. zu Vercel oder GitHub Pages) und Security-Scans.

Mit diesen Praktiken bleibt deine Codebasis stabil, wartbar und bereit für schnelle Iterationen im Sinne von Vibe Coding.
