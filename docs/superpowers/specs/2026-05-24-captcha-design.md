# Captcha on Submission Form

**Date:** 2026-05-24  
**Status:** Approved

## Goal

Add Cloudflare Turnstile captcha to the logo submission form to block automated bot submissions. Turnstile is usually invisible to real users and requires no image puzzles.

## Architecture

The Turnstile widget renders inside `SubmissionForm.tsx`. When Cloudflare validates the visitor it fires an `onSuccess` callback with a short-lived token string. The form stores that token in React state and passes it to the existing `createSubmission` server action. The server action verifies the token with Cloudflare's siteverify API before any storage upload or DB insert. If verification fails the submission is rejected immediately.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `@marsidev/react-turnstile` |
| `.env.local` | Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` |
| `components/SubmissionForm.tsx` | Render `<Turnstile>` widget; store token in state; pass token to server action; disable submit until token present |
| `app/actions.ts` | Accept `captchaToken` in payload; verify with Cloudflare API; return error on failure |

## Detailed Behaviour

### SubmissionForm.tsx

- Import `Turnstile` from `@marsidev/react-turnstile`
- Add `captchaToken` state (`string | null`, initially `null`)
- Render `<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={(token) => setCaptchaToken(token)} onExpire={() => setCaptchaToken(null)} />` between the file drop zone and the submit button
- Submit button is disabled when `captchaToken` is `null` (in addition to existing `!submissionsOpen` guard)
- `onExpire` resets `captchaToken` to `null`, re-disabling submit until Turnstile issues a fresh token automatically
- Pass `captchaToken` to `createSubmission`

### app/actions.ts — createSubmission

1. Accept `captchaToken: string` in the input payload
2. POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with:
   - `secret`: `process.env.TURNSTILE_SECRET_KEY`
   - `response`: `captchaToken`
3. If `success` is `false` in the JSON response, return `{ error: 'Captcha verification failed. Please try again.' }`
4. Otherwise proceed with the existing storage upload and DB insert logic unchanged

## Error Handling

| Scenario | Response |
|----------|----------|
| Token missing on submit | Client-side: submit button disabled; never reaches server |
| Token invalid or expired | Server returns `{ error: 'Captcha verification failed. Please try again.' }` — displayed in existing error UI |
| Cloudflare API unreachable | Return same generic error; do not allow submission to proceed |

## Environment Variables

| Variable | Visibility | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public (browser) | Identifies the site to Cloudflare's widget script |
| `TURNSTILE_SECRET_KEY` | Server-only | Used to verify tokens server-side; never exposed to client |

Both keys are obtained from the Cloudflare dashboard after creating a Turnstile site (free, no billing required). Use the "Managed" challenge mode for the site key to minimise friction for real users.

## No DB Changes

The captcha token is verified and discarded server-side. Nothing is stored in the database.

## Out of Scope

- Per-email submission limits
- Rate limiting at the network/edge level
- Admin bypass for captcha
