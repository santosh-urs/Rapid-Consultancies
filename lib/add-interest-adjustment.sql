-- Root-cause fix for "interest updates don't survive a refresh":
--
-- calculateDynamicInterest() (lib/loanUtils.ts) always recomputes interest
-- fresh from principal/rate/dates on every load — the stored `interest_due`
-- column is never read back for display anywhere (confirmed across both the
-- website and the app). Three separate features still wrote to it as if it
-- were persisted: the "Accrue Interest" bulk button, "Adjust Loan -> Accrue",
-- and the Edit Customer "Interest Amount" field. All three appeared to work
-- (local state updated immediately) but were silently discarded on next load.
--
-- This adds a real column for manual interest adjustments that the display
-- layer actually adds on top of the calculated interest, so staff-entered
-- adjustments persist. `interest_due` is left in place but unused going
-- forward (existing values in it are stale/inflated from the broken bulk
-- accrual button running repeatedly — do not migrate them forward).

ALTER TABLE loans ADD COLUMN IF NOT EXISTS interest_adjustment NUMERIC DEFAULT 0;
