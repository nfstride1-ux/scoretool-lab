# ScoreTool coaching — go-live notes

Nothing in this file is live. Apply it only when Nathe says go live on the coaching pull request.

## What this adds

Plus and Pro archers use the existing My archery › Coach screen. One button, "Share my data with coach", creates a link they send to their coach (the phone's share sheet, or copy). They can stop sharing at any time.

The coach's first link runs one ScoreTool + Archery Calendar sign-up (same Google sign-in), then the add-to-home-screen how-to. Later links go straight in. The archer's name shows under Tools › Coaching.

Tapping the name opens all working analysis (group plot, end by end, heatmap, averages, custom charts, compare), every practice and competition session, every tuning session, and the diary. The coach can add a note to any of those (tuning, blank bale or close target drill, or form or mental). Notes open and shut so the page stays neat. The coach sees everything, including the diary. The archer can't hide it.

When the coach leaves a note, the archer gets an in-app notice and a badge on My archery › Coach, and a dropdown of all notes on the Coach page (dated, newest first). A system push is sent only if the phone has already allowed notifications. This build does not add a new push service.

Goals and training plans are not in this build. League scoring stays free. Lingkana data is not touched. The old hidden demo coach screens (`COACH_ON=false`) stay hidden.

This rework removed the earlier unreleased archer screens: Add my coach / Send this code, Share a round, the one-off share sheet and finished-round footer button, Preview as archer/coach toggles, and the Coach card on Me.

## Preview vs live sync

The preview and the app in this pull request keep coaching data in this phone's storage and in share-link addresses, so the preview works without changing the live database.

When this goes live, apply `supabase/scoretool_coaching.sql` on project `sllsqpfqwckwtljzjxli` (additive tables and RLS only). It does not change `scoretool_entitlements` or any Lingkana table. After that, ongoing coach links can sync between phones.

## Checks

- `python3 tools/coach_feature_test.py`
- `python3 tools/safety_smoke_test.py`
- `python3 tools/privacy_scan.py`
