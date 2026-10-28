# DateRangeFilter hook-order fix — validation notes

The reported route `/?from_webdev=1` was reloaded after moving the `weeks` memoization above the empty-data early return in `DateRangeFilter`. The application rendered its existing dashboard without the reported React hook-order error, and the browser console was clean immediately after reload.

TypeScript checking and the production build also pass. The S2 period button was selected successfully, the dashboard recalculated to 244 filtered rows, the weekly comment remained visible, and the browser console stayed clean. The initial empty-data render is covered by the hook-order correction: both memoized values now run before the empty-data return.
