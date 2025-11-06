# CONNECTO Architecture & Implementation Plan

This document outlines the step-by-step implementation approach, core code structure, and integration points required to deliver the CONNECTO demo experience on Vercel. Each phase maps to concrete frontend components, backend API routes, and sponsor-technology SDK hooks.

## Tech Overview

- **Framework**: Next.js App Router deployed to Vercel.
- **Language**: TypeScript with strict mode.
- **Styling**: Tailwind CSS with a navy/sky palette to match the OpenAI aesthetic.
- **State Management**: React server components + client components backed by Zustand for UI state that spans pages (e.g., selected contacts).
- **Data Persistence**: MemVerge (user + CRM data), ApertureData (connection profiles), Comet (LLM observability), Telnyx (voice & telephony).

Directory emphasis:

```
app/
  (marketing + authenticated routes)
  api/
    telnyx/
    memverge/
    aperture/
    comet/
components/
lib/
  telnyx/
  memverge/
  aperturedata/
  comet/
  ai/
```

Each integration lives under `lib/<provider>/` with SDK wrappers that expose typed functions for the rest of the application.

### Implementation Roadmap

| Step | Goal | Key Files | Notes |
| --- | --- | --- | --- |
| 1 | Bootstrap auth shell | `app/layout.tsx`, `app/api/auth/[...nextauth]/route.ts` | Enable Google login, seed MemVerge user stub. |
| 2 | Build landing + onboarding scaffold | `app/page.tsx`, `app/onboarding/page.tsx`, `components/voice/*`, `components/onboarding/*` | Voice orb + resume upload with optimistic UI. |
| 3 | Wire Telnyx voice flows | `lib/telnyx/client.ts`, `app/api/telnyx/token/route.ts` | WebRTC token exchange + transcript streaming via SSE. |
| 4 | Persist interview data | `app/api/onboarding/submit/route.ts`, `lib/memverge/*` | Extract structured resume data server-side, upsert into MemVerge. |
| 5 | Request capture & analysis | `app/dashboard/page.tsx`, `components/dashboard/RequestComposer.tsx`, `lib/ai/requestAnalyzer.ts` | Mix text + voice input, convert to structured filters. |
| 6 | Populate ApertureData | `app/api/aperture/sync/route.ts`, `lib/aperturedata/*` | Load mock LinkedIn data, expose search endpoint. |
| 7 | Render review + selection | `app/connections/page.tsx`, `components/connections/*`, `store/useSelectionStore.ts` | Checkbox UX with "Select All" behaviour. |
| 8 | Generate outreach drafts | `app/api/outreach/generate/route.ts`, `lib/ai/outreachGenerator.ts`, `lib/comet/*` | Compose prompts, log to Comet, return experiment ID. |
| 9 | CRM dashboard + metrics | `app/crm/page.tsx`, `components/crm/*` | Tag filters, Comet snapshot component. |
| 10 | Deployment polish | `vercel.json`, `lib/env.ts` | Bind secrets, set Edge runtime where required, configure fallbacks. |

Use this roadmap as the order of implementation. Each step is designed to be testable in isolation, enabling incremental verification before progressing to the next stage.

### Environment Variable Matrix

| Variable | Provider | Usage |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google / NextAuth | OAuth login and calendar API calls. |
| `TELNYX_API_KEY`, `TELNYX_CONN_ID` | Telnyx | Create ephemeral tokens and WebRTC sessions. |
| `MEMVERGE_API_URL`, `MEMVERGE_API_KEY` | MemVerge | Profile CRUD + CRM tagging. |
| `APERTUREDATA_API_URL`, `APERTUREDATA_ADMIN_KEY` | ApertureData | Seeding scraped data and running SQL queries. |
| `COMET_API_KEY`, `COMET_WORKSPACE`, `COMET_PROJECT` | Comet | Log outreach experiments and fetch metrics. |
| `OPENAI_API_KEY` | OpenAI | Request analysis + outreach generation prompts. |
| `GOOGLE_CALENDAR_REDIRECT_URI`, `GOOGLE_CALENDAR_REFRESH_TOKEN` | Google Calendar | Optional auto-scheduling support. |

Mirror this matrix in Vercel project settings and create a local `.env.local` with the same keys for development parity.

---

## Phase 1 – User Onboarding & Profile Creation

### Flow Summary
1. User authenticates via Google OAuth (NextAuth.js).
2. Immediately redirected to `/onboarding` with a split layout: voice agent sphere on the left, form & upload controls on the right.
3. Telnyx-powered conversational interview collects goals, current role, target industries.
4. PDF resume upload, parsed via server action.
5. Data persisted to MemVerge as part of an evolving user profile.

### Step-by-step Implementation
1. **Guard authenticated routes** – wrap `app/layout.tsx` with `<SessionProvider>` and protect `/onboarding`, `/dashboard`, `/connections`, and `/crm` using `redirect()` when `!session`.
2. **Provision Telnyx connection** – create `/app/api/telnyx/token/route.ts` that exchanges the stored `TELNYX_API_KEY` for an ephemeral login token scoped to the user ID and meeting room.
3. **Render the voice orb** – in `components/voice/VoiceInterview.tsx`, instantiate the Telnyx WebRTC client inside a `useEffect`, subscribe to `client.on('message')` for transcripts, and maintain transcript state in a reducer.
4. **Capture audio** – tie the microphone button to `client.answer()` / `client.hangup()` flows so the interview runs as half-duplex push-to-talk (reliable in the browser without auto-play quirks).
5. **Parse transcripts + resume** – send transcripts incrementally to `/api/onboarding/submit` via `fetch` POST (debounced) and use a server-side PDF parser (e.g., `pdf-parse`) to extract text and metadata before persisting to MemVerge.
6. **Persist to MemVerge** – call `memverge.upsertUserProfile` with merged Google profile, transcript insights, resume JSON, and front-end preference toggles.

### Key Components & Files
- `app/layout.tsx` – wraps the app with `<SessionProvider>` and `<ThemeProvider>`.
- `app/page.tsx` – marketing landing page linking to `/dashboard` (auth-guarded).
- `app/onboarding/page.tsx` – orchestrates onboarding; renders `<VoiceInterview />` and `<ResumeUpload />`.
- `components/voice/VoiceInterview.tsx` – client component bridging Telnyx WebRTC events.
- `components/onboarding/ResumeUpload.tsx` – dropzone accepting PDFs only.
- `app/api/onboarding/submit/route.ts` – server route to persist collected data.

### API Integration

#### Authentication (NextAuth + Google)
```ts
// app/api/auth/[...nextauth]/route.ts
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      await memverge.ensureUserProfile(user);
      return true;
    },
  },
});
```

#### Telnyx Voice Interview
```ts
// lib/telnyx/client.ts
import { TelnyxRTC } from "@telnyx/webrtc";

export function createVoiceSession(token: string) {
  const client = new TelnyxRTC({ login_token: token });
  client.on("message", handleTranscript);
  return client;
}
```
- `app/api/telnyx/token/route.ts` obtains an ephemeral connection token using Telnyx API for the logged-in user.
- `components/voice/VoiceInterview.tsx` fetches token, establishes the WebRTC session, streams microphone audio, and displays transcripts in real-time via Telnyx events.

#### Resume Parsing & MemVerge Storage
```ts
// lib/memverge/client.ts
export async function upsertUserProfile({ userId, resume, transcript, preferences }: ProfileInput) {
  const payload = {
    userId,
    resume,
    interviewTranscript: transcript,
    preferences,
    updatedAt: new Date().toISOString(),
  };
  return fetch(`${process.env.MEMVERGE_API_URL}/profiles`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}
```
- `app/api/onboarding/submit/route.ts` receives JSON, calls OpenAI (optional) to extract structured info from the resume, and persists to MemVerge.

---

## Phase 2 – Connection Request

### Flow Summary
1. Authenticated users reach `/dashboard` featuring a chat-like text area and the Telnyx voice orb.
2. User request captured either via text (submit handler) or voice (Telnyx transcription).
3. Request dispatched to `/api/requests/analyze` to interpret intent and required filters.
4. MemVerge queried to enrich with stored user preferences (e.g., alma mater, industries).

### Step-by-step Implementation
1. **Hydrate dashboard data** – load `profileSummary` via a server action that calls `memverge.fetchProfile` (use `cache()` with `revalidateTag('profile')`).
2. **Unify text + voice input** – `RequestComposer` stores the current prompt in local state; when voice transcripts arrive, append to the prompt and show an editing surface before submission.
3. **Submit structured payload** – on send, POST `{ prompt, userId, context: profileSummary }` to `app/api/requests/analyze/route.ts`.
4. **Analyze with LLM** – within the API handler, call `analyzeRequest(prompt, profileSummary)` (OpenAI) to convert to `ProfileFilters` (`industries`, `locations`, `seniority`, `tone`).
5. **Persist search intents** – store the latest filters back to MemVerge as part of the user's preferences so subsequent requests auto-suggest prior filters.

### Key Components & Files
- `app/dashboard/page.tsx` – server component loading user snapshot from MemVerge.
- `components/dashboard/RequestComposer.tsx` – chat-style composer with speech toggle.
- `components/voice/VoiceOrb.tsx` – animated sphere and push-to-talk button.
- `lib/ai/requestAnalyzer.ts` – uses OpenAI to turn free-form text into structured search criteria.

### API Integration
```ts
// app/api/requests/analyze/route.ts
const handler = async (req: NextRequest) => {
  const { prompt, userId } = await req.json();
  const profile = await memverge.fetchProfile(userId);
  const analysis = await analyzeRequest(prompt, profile);
  return NextResponse.json(analysis);
};
```
- Analysis output example:
```json
{
  "industries": ["Healthcare Consulting"],
  "locations": ["San Francisco Bay Area"],
  "education": ["UC Berkeley"],
  "tone": "student-like"
}
```

---

## Phase 3 – Sourcing & Analysis

### Flow Summary
1. Background worker (Edge Function or Server Action) scrapes LinkedIn/event site (mocked dataset for demo).
2. Scraped profiles normalized and ingested into ApertureData via REST/GraphQL API.
3. `/api/connections/search` performs a query combining user intent filters with database constraints.
4. For each result, an LLM generates a short insight referencing both the target profile and the user’s background.

### Step-by-step Implementation
1. **Create ingestion endpoint** – `app/api/aperture/sync/route.ts` accepts POSTed arrays of profile objects and calls `aperture.bulkUpsert(profiles)`.
2. **Normalize schema** – define `ProfileRecord` (name, title, company, education, tags, mutualConnections, sourceUrl) in `types/aperture.ts` so both mock scraper and Aperture client share typing.
3. **Seed demo data** – during development, hit `/api/aperture/sync` from a script (`npm run seed:aperture`) that uploads hackathon host data prior to demo.
4. **Expose search API** – `app/api/connections/search/route.ts` takes `filters`, composes SQL using `buildApertureQuery(filters)`, and returns matches with pagination + highlight metadata.
5. **Generate insights** – run `lib/ai/profileInsight.ts` per profile (batched) to create the "Potential insight" string, caching results in MemVerge to avoid recomputation.

### Key Components & Files
- `app/api/aperture/sync/route.ts` – accepts scraped data payload and writes to ApertureData.
- `lib/aperturedata/client.ts`
```ts
export async function queryProfiles(filters: ProfileFilters) {
  const query = buildApertureQuery(filters);
  const response = await fetch(`${API_URL}/query`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  });
  return response.json();
}
```
- `lib/ai/profileInsight.ts` – wraps OpenAI call to produce the "Potential insight" string.

### ApertureData Query Example
```sql
SELECT name, title, company, education, mutualConnections
FROM profiles
WHERE industry IN (:industries)
  AND location IN (:locations)
  AND education && :educationPreferences
LIMIT 25;
```

---

## Phase 4 – Review & Selection

### Flow Summary
1. `/connections` route displays search results with cards.
2. Cards show name, title, mutual connections, AI-generated insight, and checkbox.
3. State managed in Zustand store `useSelectionStore`.
4. "Select All" toggles all entries; selections persisted until outreach step.

### Step-by-step Implementation
1. **Server render results** – use `searchParams` to pull `intentId`, call `/api/connections/search`, and pass results to the `ConnectionList` client component.
2. **Persist selection** – `useSelectionStore` holds a `Set<string>` of profile IDs; `Select All` simply toggles the full ID set returned from the server.
3. **Surface context** – each `ConnectionCard` shows key facts (company, mutuals, tags) and renders the `insight` string with fallback skeletons while loading.
4. **CTA wiring** – "Continue to outreach" button pushes `/outreach?ids=...`, storing the ID list in query params plus Zustand for resilience.

### Key Components & Files
- `app/connections/page.tsx`
- `components/connections/ConnectionList.tsx`
- `components/connections/ConnectionCard.tsx`
- `store/useSelectionStore.ts`

---

## Phase 5 – Automated Outreach

### Flow Summary
1. User triggers outreach via CTA.
2. `app/api/outreach/generate/route.ts` receives `selectedProfileIds`, user `tone`/template, and optional Calendly link.
3. Route fetches:
   - User profile from MemVerge.
   - Target profiles from ApertureData.
4. Assembles prompt for LLM (OpenAI) to draft personalized emails/notes.
5. Results persisted back to MemVerge CRM and logged to Comet for observability.
6. Comet experiment ID returned to frontend for UI display.

### Step-by-step Implementation
1. **Collect data** – server handler loads `userProfile`, `contacts`, and merges tone/template overrides into a `PromptContext` object.
2. **Prompt engineering** – `outreachPrompt` injects the user summary, contact bullet points, and `calendarLink`. Provide a per-contact system prompt and let OpenAI stream completions (Edge-friendly `ReadableStream`).
3. **Persist results** – write outreach drafts to `memverge.saveMessages(userId, messages)` referencing the Aperture contact IDs for traceability.
4. **Log to Comet** – call `logOutreachRun` with personalization metadata (tokens, tone, template) and store the returned experiment key alongside each message.
5. **Return payload** – respond with `{ messages, cometExperimentKey }`; frontend stores the key to render success UI and to fetch Comet analytics.

### Key Components & Files
- `lib/ai/outreachGenerator.ts`
```ts
export async function generateOutreach({ userProfile, contacts, tone, calendarLink }: Args) {
  const prompt = outreachPrompt({ userProfile, contacts, tone, calendarLink });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
  });
  return completion.choices[0].message?.content;
}
```

### Comet Logging
```ts
// lib/comet/client.ts
import { Comet } from "@comet-ml/experiment";

export async function logOutreachRun({ userId, contacts, messages, template }: LogArgs) {
  const experiment = await Comet.init({ apiKey: process.env.COMET_API_KEY!, projectName: "connecto-outreach" });
  experiment.logParameters({ userId, contactCount: contacts.length, template });
  experiment.logMetric("personalization_tokens", messages.length);
  messages.forEach((message, idx) => {
    experiment.logText(`message_${idx}`, message.body);
  });
  return experiment.getExperimentKey();
}
```
- `app/api/outreach/generate/route.ts` logs message payloads and returns experiment key.

### Google Calendar Integration
- During onboarding, user can store either a Google Calendar availability link or Calendly URL (MemVerge `preferences.calendarLink`).
- Outreach prompt template injects the link into each generated message.
- Optional: use Google Calendar API to create events when replies are received (future extension).

---

## Phase 6 – Connection Management (CRM)

### Flow Summary
1. `/crm` route lists all saved connections with tags, last-contact dates, and conversation snippets.
2. Users can filter by tags or search for names.
3. Bulk actions (e.g., "send update to #GettingIntoYC") trigger `app/api/outreach/bulk/route.ts`.
4. MemVerge serves as the source of truth for connection records and tags.
5. Comet metrics (reply rates, A/B tests) rendered within a dashboard component.

### Step-by-step Implementation
1. **Server render CRM table** – `app/crm/page.tsx` fetches the user's full MemVerge record and passes to `ConnectionTable`.
2. **Tag filtering** – `TagFilter` updates a URL search param; `ConnectionTable` recomputes filtered rows client-side for responsiveness.
3. **Bulk outreach hooks** – `app/api/outreach/bulk/route.ts` reuses `generateOutreach` for each selected tag group, logging a separate Comet experiment per campaign.
4. **Comet dashboard** – `components/crm/CometDashboard.tsx` fetches `experiments/list` from Comet, aggregates reply metrics (mocked for demo), and displays charts via a lightweight visualization (e.g., `radix-ui` + simple bars).
5. **Follow-up scheduler** – store `followUpAt` timestamps in MemVerge; CRON (or Vercel scheduled functions) polls and triggers reminder drafts using the same outreach pipeline.

### Key Components & Files
- `app/crm/page.tsx`
- `components/crm/ConnectionTable.tsx`
- `components/crm/TagFilter.tsx`
- `components/crm/CometDashboard.tsx` – consumes experiment summaries via Comet REST API.

### MemVerge Data Model
```json
{
  "userId": "google-oauth-id",
  "profile": {
    "name": "Ada Lovelace",
    "role": "Product Manager",
    "goals": ["Break into healthcare AI"],
    "resume": { "text": "..." },
    "preferences": {
      "tone": "student-like",
      "calendarLink": "https://cal.com/ada"
    }
  },
  "connections": [
    {
      "id": "host-001",
      "source": "hackathon",
      "tags": ["Hackathon", "Host"],
      "notes": "Met during demo day",
      "messages": [
        { "type": "outreach", "body": "...", "cometExperiment": "ABC123" }
      ],
      "lastContactedAt": "2024-06-14T09:00:00Z"
    }
  ]
}
```

---

## Demo Script Implementation Checklist

1. **Landing Page** – Provide entry point with sponsor logos and CTA to sign in.
2. **Onboarding** – Voice interview (Telnyx) + resume upload; MemVerge persistence.
3. **Request** – Voice request captured; request analyzer uses profile context.
4. **Sourcing** – Mock scraper seeds ApertureData; query returns hackathon hosts.
5. **Review** – Selection UI with checkboxes and "Select All".
6. **Outreach** – Personalized drafts referencing user and host data; includes calendar link; Comet experiment key displayed.
7. **Monitoring** – Comet dashboard card showing metrics for the generated outreach.

Each step should be scriptable for a Vercel-hosted demo, with fallbacks (mock data) to ensure reliability even if external APIs are unreachable during the presentation.

---

## Deployment to Vercel

- Configure environment variables in Vercel project for all provider keys.
- Use `vercel.json` to ensure Edge runtime for low-latency voice token endpoints (`runtime: "edge"`).
- Set build command `npm run build` and output directory `.next`.
- Provide mock data seeds during preview deployments via `app/api/dev/seed` (protected route).
- Create two environments (`Preview`, `Production`) so Comet + MemVerge logs do not mix; point previews to sandbox API keys.
- Add a Vercel cron job (daily) hitting `/api/outreach/follow-up` to demonstrate automated follow-up drafting.
- Enable the Vercel Analytics dashboard to capture end-to-end latency for Telnyx token retrieval and Aperture queries (useful talking points during the demo).

---

## Monitoring & Future Enhancements

- Extend Comet logging with reply tracking via webhook ingestion.
- Add Telnyx call-back events to capture call quality metrics.
- Introduce ApertureData vector search for semantic profile matching.
- Automate MemVerge schema migrations with CI job.
- Implement caching layer for repeated MemVerge profile reads (Next.js `revalidateTag`).

