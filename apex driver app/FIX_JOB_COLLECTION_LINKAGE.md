# Fix: driver jobs and collections not populating

Deployment handoff. Everything below has been applied to the working tree except
the SQL, which must be run manually against Supabase.

---

## The bug in one sentence

`oil_collections.job_id` had a foreign key pointing at `oil_collection_jobs(id)`,
but every real job lives in `jobs(id)` — so every collection insert failed the
foreign key, and the app's error handler silently re-saved the row with
`job_id` and `driver_id` stripped out.

Result: collections saved as orphaned rows. The driver's My Jobs screen showed
0 collections / 0.0L / R0.00, no earnings were ever calculated, and the admin
panel kept showing the job as PENDING because nothing linked it to the
completed collection.

---

## DEPLOY ORDER — the SQL must run first

Deploying the code without the migration will make collections **fail loudly**
instead of saving silently-broken rows. That is safer, but drivers will be
blocked. Run the SQL first.

### Step 1 — database migration (run manually)

File: `database/fix_oil_collections_linkage.sql`

Take a database backup first. Run it in the Supabase SQL editor. It:

1. Drops the wrong foreign key on `oil_collections.job_id` and recreates it
   against `jobs(id)` with `ON DELETE SET NULL` (was `CASCADE` — deleting a job
   must never destroy compliance evidence).
2. Recovers `job_id` on existing orphaned rows. The original IDs were written
   into the `notes` column by the old fallback code, so **no data was lost**.
3. Recovers `driver_id`, preferring `jobs.driver_id`, falling back to mapping
   the stored auth user id to `drivers.id` by email.
4. Marks jobs completed where a linked collection proves the work was done.
5. Prints a report of anything it could not recover.

The script is wrapped in a transaction and is safe to re-run. Review the
preview SELECT in Step 4 before committing.

### Step 2 — deploy the code

Static files, no build step. Deploy as normal.

---

## Code changes

### `js/oil-collection-service.js`

**Removed the silent orphan-save fallback** (was ~line 396). On a foreign key
error it used to delete `job_id` and `driver_id`, write them into `notes`, and
re-insert. The driver saw a success message for a record no screen could find.
It now throws.

**`validateJobExists()` now checks `jobs` only.** It previously checked
`oil_collection_jobs` first and accepted a match in `jobs` as a fallback — which
meant validation passed and the insert then failed the foreign key.

**`job_id` and `driver_id` are now mandatory.** Previously, if either failed
validation the record was saved without them. Both are now required, with
driver-specific error messages the driver can act on. The driver id falls back
to an email lookup when an auth user id is passed instead of a `drivers.id`.

### `oil-collection.html`

**Deleted `createJobUUID()`, `ensureValidUUID()` and `generateUUID()`.** When a
job id was not UUID-shaped, these **generated a random UUID**. The collection was
then written against a job that does not exist, and the `jobs` status update
matched zero rows — so the job was never marked complete. Replaced with
`resolveJobId()`, which returns null and aborts the save with a clear message.

**Added `resolveDriverId()`.** The old code passed `currentUser.id` — the
**auth user id** — as `driver_id`. `jobs.driver_id` and
`oil_collections.driver_id` both reference `drivers.id`, which is a different
value. It now looks up `drivers.id` by email.

**Removed the second FK fallback** in `saveCollectionData()`, which stripped
`jobId` on constraint errors.

**Job completion is now verified.** The update stamps `driver_id` as well as
status, uses `.select()` to confirm a row actually matched, and alerts the
driver to notify the office if it did not. Failures were previously swallowed
with `console.warn`.

### `my-jobs.html`

**"Jobs In Progress" now queries `status IN ('accepted','in_progress')`.** It
only queried `in_progress`, but `acceptJob()` writes `'accepted'` — so an
accepted job could never appear, and "Active Jobs" was permanently 0.

Cards now show an ACCEPTED badge (amber) vs IN PROGRESS (orange), and fall back
to `accepted_at` for the timestamp since `started_at` is null until the driver
starts the collection.

### `jobs.html`

The `acceptedJob` object cached in localStorage recorded `status:'in_progress'`
when the database says `'accepted'`. It now mirrors the database response, and
takes `id` from the returned row so the job id handed to the collection screen
is always the real one.

---

## NOT FIXED — decision pending

### `revertExpiredAccepts()` — `js/apex-driver-service.js:432`

Called on every load of `jobs.html` and `dashboard.html`. It finds **every** job
in the system sitting in `accepted` for more than 2 hours and resets it to
`status:'pending', driver_id: null`.

It is not scoped to the current driver. Any driver opening the app un-accepts
other drivers' jobs. Two hours is shorter than a normal collection round, so
legitimate acceptances are being wiped routinely. This is the most likely reason
the admin panel shows jobs pending for 166–724 hours with no driver attached.

Left in place deliberately, pending a decision. Options:

- Remove the client-side calls. The admin panel already has Reassign and Cancel
  buttons for stale jobs, keeping a human in control.
- Scope it to the current driver only, with a much longer window (24h+).
- Move it server-side as a scheduled job, so it runs once rather than on every
  app load by every driver.

---

## How to verify after deploying

1. Admin panel: create a test job.
2. Driver app: accept it. It must now appear under My Jobs → Jobs In Progress
   with an ACCEPTED badge.
3. Admin panel: the job shows `accepted` with the driver attached.
4. Driver app: complete the collection.
5. Driver app: Total Collections, Total Volume and Total Earnings must all
   increase.
6. Admin panel: the job shows `completed`, and drops off the Stale Jobs list.
7. Database check — this must return zero rows:

```sql
SELECT id, collection_date, collection_address
FROM   oil_collections
WHERE  job_id IS NULL OR driver_id IS NULL;
```

## Known remaining issue

`oil_collection_jobs` is written to by `createOilCollectionJob()` in
`js/apex-driver-service.js:333` but read by nothing. It is a dead parallel table
and the original source of the confusion. Confirm it is empty, then drop it.
Noted at the bottom of the migration file.
