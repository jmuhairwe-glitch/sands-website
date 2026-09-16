# SANDS private feeding records

This change is prepared for the existing `sands-website` Vercel project. The public homepage is unchanged except for a footer link. Do not deploy as an operational log until the database and email setup below are complete. The app shows a setup notice when its environment variables are missing.

## Database and authentication

1. Create a **separate SANDS Fish Farm Supabase project**, after the owner chooses the organization and confirms its quoted cost. Do not apply this SQL to AHAVA Marketplace.
2. Run `database/feeding.sql` once in its SQL editor. Keep `sands_private` out of Data API exposed schemas. Run Supabase security advisors.
3. Enable email/password authentication with **Confirm email enabled**, minimum password length 12, and anonymous sign-in disabled. Configure custom SMTP for real external recipients: Supabase's default email service is not suitable for farm staff/investor invitations. Preserve existing SANDS mail services and DNS.
4. Set Auth Site URL to `https://sands.co.ug` and allow `https://sands.co.ug/feeding` as a redirect. For preview testing, add the exact trusted preview URL temporarily. Keep Auth rate limits enabled.
5. The provisioned project's browser-safe URL and publishable key are in `lib/feeding-public-config.ts`. No Vercel secrets are needed for this client-only integration. Optional `NEXT_PUBLIC_SANDS_SUPABASE_URL` and `NEXT_PUBLIC_SANDS_SUPABASE_PUBLISHABLE_KEY` environment values override them for a test project. Never use a service-role key. Rebuild after changing public configuration.
6. James registers, confirms ownership of `james@sands.co.ug`, signs in and requests access. From the SQL editor, check the matching confirmed Auth user and promote only that user with:

```sql
update public.feeding_members m set role = 'admin'
from auth.users u
where m.user_id = u.id
  and lower(u.email) = 'james@sands.co.ug'
  and u.email_confirmed_at is not null
returning m.user_id, m.email, m.role;
```

Require exactly one returned row. There is no public or first-signup owner bootstrap.

7. James shares `/feeding` with approved candidates. They register, confirm their email and request access. Only James sees all requests and grants viewer/editor access. No emails are sent by installing or testing this change. Removing access is enforced on the next database request, without waiting for token expiry; an already downloaded file cannot be recalled.

## Verify before release

- `npm ci && npm run build`
- `node tests/feeding-security.mjs` runs the actual schema and RLS against isolated PGlite PostgreSQL with simulated Supabase Auth claims. It never touches hosted data.
- In the configured project, verify real signup/confirmation/reset email delivery, owner approval, editor save, viewer visibility from a second browser, revoked access, and CSV/print with an explicitly approved test account. Recheck the live domain and leave mail DNS alone.
- Do not treat local database tests or a Vercel build as proof that SMTP, hosted Auth or real multi-device persistence works.

Records use daily total kg per tank, including explicit zero. Dates begin 14 September 2026; the default chart ends 14 October 2026. The selected range is limited to 31 days, at most 310 entries, below the API row cap. Amounts retain three decimal places. Corrections replace a daily total, increment a revision, and append protected history. Optimistic updates prevent silently overwriting another saved revision. All record reads and writes are protected by database RLS, not just hidden controls.

The private role lookup is narrowly scoped to `auth.uid()` and is intentionally security-definer to avoid recursive membership policies. The private audit trigger writes append-only history. Neither function is exposed as a public RPC. No service-role key is used in the app.

Sources consulted: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/changelog.md.
