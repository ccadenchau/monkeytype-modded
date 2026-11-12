# Static Monkeytype glossary

This checkout is a single-user static typing site. Settings are stored in the current browser; it has no account, cloud sync, or server-backed results.

## Pages and loading

**Page**: One view selected by a URL, such as the typing test or settings.

**Test page**: The view where a typing test runs. Leaving it stops the active test.

**Loading page**: A temporary view shown while a page loads or when its required local data fails to load.

**Loading step**: A named part of a page load that contributes to its progress display.

## Typing

**Test mode**: What determines the test's input and ending condition: time, words, quote, zen, or custom.

**Funbox**: An optional modifier that changes word generation, display, or typing behavior.

**Finish**: A test reaches its goal, or the typist ends a zen test.

**Fail**: A test ends because a configured rule was broken, such as minimum speed or accuracy.

**Result**: Statistics and event data produced by a finished or failed test. Results are shown locally and are not uploaded.

**Pace caret**: A second caret that moves at a target speed for the typist to race.

**Focus mode**: Hides surrounding interface elements while typing until the mouse moves.

**Typo hint**: A small character shown under a mistyped letter to explain the mismatch.

**Line jump**: The visible words move up when the active word drops to a new line, keeping the active line at the same height.

**Tape mode**: Words appear on one horizontally scrolling line instead of wrapping.

**Test settings**: Settings captured when a test starts. Changes apply to the next test.

**Restart-required setting**: A setting change that restarts the active test before taking effect.

## Appearance

**Theme attributes**: `data-ui-element`, `data-ui-state`, `data-ui-variant`, and related data attributes used by themes and custom CSS. IDs and class names are implementation details.
