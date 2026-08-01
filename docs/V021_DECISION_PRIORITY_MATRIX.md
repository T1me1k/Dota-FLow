# v0.21 decision priority and conflict matrix

Priority is calibrated, not a fixed list: safety/RESET; core protection; short confirmed objective; urgent role duty; lane preparation; normal role; macro; build; informational timer. Confidence, quality, window, blockers and health alter the score.

Explicit conflicts: FARM/FIGHT, FARM/objective, RESET/FIGHT, RESET/objective, HOLD_LANE/ROTATE, PROTECT_CORE or PROTECT_CARRY/MOVE_TO_WISDOM, TAKE_ROSHAN/DEFEND_TOWER, PRESSURE/CONNECT, build/urgent gameplay, and STACK or PULL/PROTECT_CARRY. Losers are suppressed, never co-equal active commands. A compatible build note may remain secondary.

Safety transformations: unknown Roshan vision → PREPARE_ROSHAN; unknown wave → PREPARE_ROTATION; unknown Wisdom route → PREPARE_WISDOM; unknown buyback/cooldowns → HOLD_HIGH_GROUND_SETUP.
