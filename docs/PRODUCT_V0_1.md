# Product definition — Dota Flow 0.1

## User promise

During a live Dota 2 match, show one concise macro recommendation:

- FARM
- CONNECT
- FIGHT
- PRESSURE
- RESET

The recommendation must include no more than three explainable reasons.

## Initial target user

Position 1 players in normal or ranked All Pick matches.

## First supported heroes

1. Luna
2. Juggernaut
3. Sven

## Overlay rules

- one compact card;
- no permanent animation;
- do not cover the minimap, inventory, abilities, health, or shop;
- recommendation changes must be rate-limited;
- urgent RESET warnings can bypass the normal hold period;
- user can disable or hide the overlay instantly.

## Success metrics for the probe

Technical:

- 95%+ of expected gold/GPM/time events correctly represented;
- no stale state carried into the next match;
- fewer than two decision changes per minute;
- no noticeable FPS impact in the test environment;
- JSONL recording survives alt-tab, death, reconnection, and match end.

Product:

- at least 60% of test recommendations marked useful or directionally correct;
- fewer than 15% marked clearly wrong;
- fewer than 20% marked too late;
- average overlay reading time below two seconds.

## Not in 0.1

- machine learning;
- LLM calls;
- minimap routes;
- enemy inventory prediction;
- hidden information;
- all heroes and roles;
- subscriptions;
- public accounts;
- cloud backend.
