# Agentenrichtlinie für mygym

Für jede Änderung am Quellcode dieser Repository gilt:

- Schreibe automatisierte Tests, die die geänderte oder neue Funktionalität abdecken.
- Stelle sicher, dass alle bestehenden und neuen Tests erfolgreich ausgeführt werden.
- Aktualisiere Tests nur, wenn sich die Funktionalität bewusst ändert.
- Führe vor jedem Commit den Linter aus und behebe alle Meldungen.
- Achte auf gute Wartbarkeit (Law of Demeter, sinnvolle Faktorisierung, klare Verantwortlichkeiten).
- Erfülle gängige CI/CD-Anforderungen, damit der Code jederzeit auslieferbar bleibt.
- Stelle sicher, dass jeglicher UI-Text ausschließlich über die Internationalisierungsschicht bereitgestellt wird.
- Pflege mindestens englische und deutsche Übersetzungen in separaten Ressourcen-Dateien und füge neue Texte immer in beiden Sprachen hinzu.
- Plane und implementiere Funktionalität grundsätzlich offline-first: Alle Daten müssen auf dem Smartphone persistent in einem geeigneten lokalen Speicher oder einer passenden Datenbank abgelegt werden, sodass die App auch ohne Backend-Anbindung voll funktionsfähig bleibt.
- Berücksichtige eine zukünftige Backend-Integration bereits bei der Konzeption, ohne sie zu implementieren, damit die späteren Schnittstellen vorbereitet werden können.
- Bei Änderungen am Datenmodell sind Migrationen und Kompatibilität sicherzustellen, damit neue Releases stets mit bereits vorhandenen Daten der Nutzer kompatibel bleiben.
