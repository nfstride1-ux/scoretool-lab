# ScoreTool coaching — go-live notes

Nothing in this file is live. Apply it only when Nathe says go live on the coaching pull request.

## What this adds

Plus and Pro archers can:

1. Send a one-off share link (scores, plots, analysis and that day's diary). The coach opens it with no account.
2. Send a coach code. The coach's first code runs one ScoreTool + Archery Calendar sign-up (same Google sign-in), then the add-to-home-screen how-to. Later codes go straight into the Archers list. The archer can remove the coach at any time.
3. The coach gets an Archers list, the same analysis with a layout saved for the coach only, custom charts, and a side-by-side compare.
4. The coach can pin notes on a round, end or diary entry: tuning (the archer logs the change), blank bale or close target drill (diary tick-off), or form or mental. The coach sees everything, including the diary. The archer can't hide it.

Goals and training plans are not in this build. League scoring stays free. Lingkana data is not touched. The old hidden demo coach screens (`COACH_ON=false`) stay hidden.

## Preview vs live sync

The preview and the app in this pull request keep coaching data in this phone's storage and in one-off link addresses, so the preview works without changing the live database.

When this goes live, apply `supabase/scoretool_coaching.sql` on project `sllsqpfqwckwtljzjxli` (additive tables and RLS only). It does not change `scoretool_entitlements` or any Lingkana table. After that, ongoing coach links can sync between phones. One-off share links already work across phones from the link itself.

## Checks

- `python3 tools/coach_feature_test.py`
- `python3 tools/safety_smoke_test.py`
- `python3 tools/privacy_scan.py`
