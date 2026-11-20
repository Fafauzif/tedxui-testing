# Remove a letter from circulation

The project owner grants the designated staff member suitable access to the correct Supabase project. Staff changes visibility in Dashboard. The public site exposes a report form and no administrative credentials or moderation screen.

1. Open **Table Editor**, select `public.letter_reports`, and filter `status` to `open`.
2. Read the reason and copy `letter_id`. Use that exact ID to locate the row in `public.letters`. Review the salutation, paragraphs and signoff. Reports refer to community letters.
3. Change `status` from `visible` to `hidden` and save. Keep the `id` and publication time intact. Save the visibility change before marking the report resolved.
4. In a fresh browser tab, open `/?letter=<id>`. It should say **This letter is unavailable**. Refresh Community letters and confirm the entry has gone. **Read another** should no longer return it. Inspect page source to confirm the title and description expose no removed text.
5. Return to the report row, set `status` to `resolved`, and save. Resolve related reports for the same letter as appropriate.

The SQL equivalent, in the correct project and using the exact ID, is

```sql
update public.letters set status = 'hidden' where id = 'THE-EXACT-ID';
update public.letter_reports set status = 'resolved' where letter_id = 'THE-EXACT-ID';
```

Restoring a reviewed letter means changing its status back to `visible`. Its original URL still works. Never republish by inserting a replacement ID. Re-running the editorial seed preserves staff decisions.

Site API and HTML responses use `no-store` and check visibility on fresh reads. Content already visible in another tab, external preview caches, copied text and saved Story PNGs may persist. Hiding a letter cannot revoke copies already saved by readers or force third-party caches to refresh.
