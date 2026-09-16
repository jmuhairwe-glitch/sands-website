# SANDS database checkpoint

Created on 16 September 2026 following James's approval.

- Project: SANDS Fishfarm
- Project ref: duyvrewbttmgdvkcqrdb
- Organisation: AHAVA Records (`gggtzhhduvksdrvqxlkv`)
- Region: eu-central-1
- Project creation quote: USD 0 monthly
- Status at creation: ACTIVE_HEALTHY
- Applied hosted migration: `create_private_feeding_records` (the contents of `feeding.sql`)
- Supabase security advisors after migration: no findings
- Feeding data: empty; no accounts or test feeding records created

Do not apply `feeding.sql` again to this project. Next: configure Auth URLs and email delivery, add publishable environment values to `sands-website`, complete real authentication/browser verification, establish the verified owner account, and publish. GitHub branch creation for `sands-website` returned 403 because the installed connection lacks write access to that repository; user is enabling it. No changes were made to the AHAVA database or the SANDS mail service.
