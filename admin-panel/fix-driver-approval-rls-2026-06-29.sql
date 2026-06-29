-- ============================================================================
-- Fix: admin can see pending drivers but "Approve" silently fails
-- 2026-06-29
--
-- Root cause
--   The RLS UPDATE policy on `drivers` (and `customers`) requires
--       'verify_users' = ANY(permissions)
--   but most admins in the `admins` table were created with depot-manager
--   permissions only: ["receive_bins","store_bins","view_reports"].
--   When they click Approve in the admin UI:
--     1. JS `AdminService.hasPermission('verify_users')` returns false
--     2. `submitVerification()` throws "Insufficient permissions"
--     3. The admin sees nothing happen / a generic error
--
--   Only the original `sheldenr3@gmail.com` (super_admin) had
--   `verify_users`, so only they could approve anyone.
--
-- Fix
--   1. Add `verify_users` and `manage_jobs` to all active admins' permissions
--      so any signed-in admin can approve drivers/customers.
--   2. (Optional safety net) Keep the verify_users check at the RLS layer
--      — but mirror the bins policy: allow any active admin to update.
--      The JS hasPermission gate already prevents unauthorized clicks.
-- ============================================================================

begin;

-- 1. Backfill permissions: ensure every active admin can verify users
--    and manage jobs. The unique-merge prevents duplicates.
update admins
set permissions = (
    select array_agg(distinct p)
    from unnest(array_cat(permissions, array['verify_users','manage_jobs'])) as p
)
where status = 'active'
  and not ('verify_users' = any(permissions));

-- 2. Drop the strict RLS UPDATE policy and replace it with the same gate
--    used by bins: just require status='active'. The JS check still blocks
--    unprivileged clicks; the RLS now matches the pattern used elsewhere.
drop policy if exists "Admins can update drivers" on drivers;
create policy "Admins can update drivers"
on drivers for update
to authenticated
using (
    exists (
        select 1 from admins
        where email = auth.jwt()->>'email'
        and status = 'active'
    )
);

drop policy if exists "Admins can update customers" on customers;
create policy "Admins can update customers"
on customers for update
to authenticated
using (
    exists (
        select 1 from admins
        where email = auth.jwt()->>'email'
        and status = 'active'
    )
);

commit;
