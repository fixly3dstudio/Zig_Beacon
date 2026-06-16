# Zig Beacon Portal Access Guide

This guide explains how engineers and reviewers can access the Zig Beacon portal, configure App Store Connect, and understand the main modules.

## Portal URL

Production portal:

```text
https://portal-eight-omega-90.vercel.app
```

## Login

Use the portal login page.

```text
Username: admin
Password: retrieve from the approved secure channel / password manager
```

Do not store the production password in source control, docs, screenshots, tickets, or chat history.

## App Store Connect Setup

After logging in:

1. Open `Settings`.
2. Go to `App store integrations`.
3. Fill in the `App Store Connect` fields.
4. Click `Connect & verify`.
5. Click `Sync now` from `App Reviews` to pull the latest review data.

Use these App Store Connect identifiers:

```text
App ID: 954951647
Key ID: F7C97CUSHD
Issuer ID: 69a6de72-b958-47e3-e053-5b8c7c11a4d1
Private key: retrieve from the approved secure channel / password manager
```

The private key must be pasted exactly as a `.p8` key, including:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

Do not commit the private key to GitHub or documentation.

## Google Play Setup

Android / Google Play integration will be updated later.

Expected fields when available:

```text
Package name
Service account JSON
```

## Module Overview

| Module | What it is used for |
| --- | --- |
| Dashboard | High-level portal snapshot and product priorities. |
| Competitors | Compares Zig features against Grab, TADA, Gojek, Ryde, and other market players. |
| Global Mobility | Shows regional mobility patterns and benchmark details by city or operating model. |
| Innovation Watch | Tracks mobility product ideas, market signals, and near-term innovation bets. |
| App Reviews | Pulls App Store / Play Store reviews, filters by sentiment, rating, store, module, and date. |
| Complaints | Groups customer complaints by source, module, severity, trend, and recommended fix. |
| Complaint Reports | Lets users download individual module reports with volume, severity, issues, and fixes. |
| Product Health | Converts review and complaint data into clear product health indicators. |
| Beacon Score | Scores product features and experiences based on signals and review evidence. |
| Opportunity Hub | Prioritizes product opportunities with development spend and expected revenue impact. |
| AI Coach | Gives product guidance and next steps based on portal signals. |
| Visual Review | Uploads UI screens or flows for AI-assisted product and UX review. |
| Transport News | Shows Singapore and international transport news from source publications. |
| Settings | Manages integrations, feedback, credentials, and portal operations. |

## Recommended Access Checklist

Before a review session:

1. Confirm the Vercel production URL loads.
2. Log in with the approved credentials.
3. Verify App Store Connect under `Settings`.
4. Open `App Reviews` and run `Sync now`.
5. Check `Complaints` and `Product Health` after syncing.
6. Download any needed complaint reports from the `Reports` tab.

## Security Notes

- Keep portal passwords and API private keys in a secure password manager.
- Do not paste production secrets into GitHub commits, shared docs, screenshots, or issue comments.
- If a key is exposed, rotate it in App Store Connect immediately and update the secure store.
- Production environment variables should be managed in Vercel, not committed `.env` files.
