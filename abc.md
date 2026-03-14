# Progress Review, Loose Ends, and AI-Agent Integration Plan

## 1) Current Progress Snapshot

### Platform foundation (strong)
- Monorepo structure is in place (`apps/user`, `apps/admin`, `apps/backend`, shared packages).
- Core backend modules exist for auth, posts, OAuth connections, platform credentials, admin-user management, contacts, templates, and campaigns.
- User dashboard pages for social and email workflows are present.
- Admin app includes a credential-management and admin-management experience.

### What this means
You are past the “scaffold” stage and now in a **feature hardening + production readiness** stage.

---

## 2) Loose Ends and Improvement Opportunities

## A. Security and Access Control (highest priority)

1. **Contacts/Templates routes still use a hardcoded temporary user**
   - `contacts` and `templates` use `getTempUserId()` rather than auth context.
   - Risk: multi-tenant data leakage and inconsistent ownership behavior.
   - Improvement:
     - Add JWT auth middleware to these routes.
     - Replace temp owner with `req.user.id`.

2. **Platform credentials endpoints are not role-protected**
   - Platform app secrets are highly sensitive and should be superadmin-only.
   - Improvement:
     - Add `authenticate + requireSuperAdmin` middleware to create/update/delete routes.
     - Consider masking secrets in GET responses.

3. **Fallback JWT secret in code**
   - Dev fallback is useful locally but dangerous if accidentally deployed.
   - Improvement:
     - Fail-fast at startup when `JWT_SECRET` is missing in non-dev env.

4. **No input validation layer**
   - Most route payloads trust request shape.
   - Improvement:
     - Introduce schema validation (e.g., Zod) and return consistent 400 errors.

## B. Reliability and Operational Readiness

1. **Campaign sending is synchronous in request lifecycle**
   - Large recipient lists will produce long request times and potential retries/duplicates.
   - Improvement:
     - Move send flow to background queue (BullMQ / Redis / worker process).
     - Route should enqueue job and return job/campaign id quickly.

2. **Post scheduling lifecycle is incomplete**
   - Posts can be marked scheduled but no worker/cron process is shown to auto-publish at `scheduledFor`.
   - Improvement:
     - Add scheduler worker to claim due posts and invoke platform publishing.

3. **OAuth token refresh strategy is missing**
   - Refresh tokens are stored, but no refresh routine for expiry/401 flows.
   - Improvement:
     - Add provider-specific refresh handlers and rotate tokens proactively.

4. **No centralized error and request tracing**
   - Console logging exists, but production debugging will be limited.
   - Improvement:
     - Add structured logger (pino/winston), request IDs, and error envelopes.

## C. Product and UX Consistency

1. **Auth model is inconsistent across feature modules**
   - Some modules are user-scoped via JWT; others still MVP-scoped.
   - Improvement:
     - Unify all user data routes under auth.

2. **Configuration hardcoding (`localhost` API URLs in frontend)**
   - Limits deployment flexibility.
   - Improvement:
     - Move to env-based API base URL in both user and admin apps.

3. **State handling and API error UX can be hardened**
   - Many pages use direct fetches without shared client abstraction.
   - Improvement:
     - Introduce API client wrapper + React Query/SWR for retries, caching, and standardized error handling.

## D. Testing and CI Gaps

1. **No visible automated API tests**
   - Improvement:
     - Add route-level integration tests for auth, ownership boundaries, and permission checks.

2. **No e2e flows for critical journeys**
   - Improvement:
     - Add smoke e2e tests for signup/login, create post, connect account (mock), send campaign (mock SMTP).

---

## 3) Prioritized Execution Roadmap (non-AI)

## Phase 1 (Week 1): Security & Data Boundaries
- Protect platform credential routes with superadmin auth.
- Replace temp user ownership in contacts/templates with authenticated user.
- Add payload validation to all write endpoints.
- Add minimal audit logs for admin actions.

## Phase 2 (Week 2): Reliability Backbone
- Introduce queue worker for campaign send jobs.
- Add scheduler worker for post publishing.
- Implement token refresh and expired-token handling.

## Phase 3 (Week 3): Developer Quality
- Add backend integration test suite.
- Add frontend API client abstraction and env-based API URLs.
- Add structured logging and request correlation IDs.

---

## 4) AI-Agent Integration Plan

## Goal
Use AI agents to improve **content quality, scheduling outcomes, support speed, and operational productivity** without compromising security.

## A. Agent Architecture (recommended)

### 1. Agent Orchestrator service
- A backend module (or separate service) responsible for:
  - Tool invocation policies
  - Prompt templates
  - Rate limiting and cost controls
  - Per-tenant context resolution
  - Human-in-the-loop approvals

### 2. Tool Layer (strictly scoped)
Expose only narrow internal tools to agents:
- `get_user_brand_profile(userId)`
- `get_recent_post_performance(userId, platform)`
- `draft_post(content_brief, platform_constraints)`
- `create_post_record(...)`
- `suggest_send_time(...)`
- `segment_contacts(...)`
- `create_email_template_variant(...)`

### 3. Memory and Context
- Short-term session memory for active drafting tasks.
- Long-term tenant memory for brand voice, banned topics, CTA preferences.
- Store memory as explicit structured settings, not free-form hidden logs.

### 4. Safety Controls
- Prompt injection defenses for imported external text.
- PII and secret redaction before LLM calls.
- Approval gates for actions with side effects (publish/send/delete).

## B. Initial Agent Set (practical rollout)

1. **Content Copilot Agent**
   - Rewrites and drafts social posts per platform constraints.
   - Produces multiple variants with tone controls.

2. **Scheduling Optimizer Agent**
   - Recommends best posting windows using historical engagement data.
   - Optionally auto-schedules when confidence threshold is met.

3. **Email Campaign Assistant Agent**
   - Generates subject lines, preview text, and CTA alternatives.
   - Produces A/B variants and expected rationale.

4. **Support Triage Agent (internal/admin)**
   - Summarizes user-reported issues and proposes likely root causes.

5. **Ops Guardrail Agent (internal)**
   - Watches failures (OAuth token errors, publish failures, SMTP bounces).
   - Suggests remediation playbooks and can draft incident summaries.

## C. Integration Milestones

## Milestone 0: Foundations (1 week)
- Choose model providers and fallback policy.
- Implement AI gateway module with:
  - provider abstraction
  - tracing
  - token/cost accounting
  - policy checks

## Milestone 1: Draft-only features (2 weeks)
- Add “Generate with AI” in post composer and email template editor.
- No autonomous actions.
- Capture explicit user feedback thumbs up/down.

## Milestone 2: Recommendations (2 weeks)
- Add send-time recommendations and subject-line scoring.
- Show rationale and confidence, never auto-publish yet.

## Milestone 3: Controlled autonomy (2–3 weeks)
- Enable optional auto-scheduling under user-approved rules.
- Require human approval for publish/send initially.

## Milestone 4: Continuous optimization (ongoing)
- Closed-loop evaluation from engagement outcomes.
- Periodic prompt/tool tuning and regression checks.

## D. Data, Governance, and Compliance Requirements

- Tenant data isolation in prompts and tools.
- Configurable “do not use my data for model training” posture.
- Retention policy for prompt/response logs.
- Explainability notes for agent recommendations.
- Audit trail for every side-effectful AI action.

## E. KPI Framework for AI rollout

Product KPIs:
- Draft-to-publish conversion rate
- Time-to-first-draft
- Campaign creation time
- CTR/open-rate lift from AI-assisted variants

Reliability KPIs:
- Agent error rate
- Hallucination/invalid-action rate
- % actions requiring human override

Cost KPIs:
- Cost per generated draft
- Cost per AI-assisted published post/campaign

---

## 5) Suggested Next 10 Working Tickets

1. Secure `platform-credentials` routes with role middleware.
2. Migrate contacts/templates to authenticated ownership.
3. Add validation schemas for auth/posts/campaign writes.
4. Introduce backend error envelope + request ID middleware.
5. Add queue worker for campaign sends.
6. Add post scheduler worker for `scheduled` posts.
7. Implement OAuth token refresh service and retry path.
8. Replace hardcoded frontend API base URLs with env config.
9. Add integration tests for ownership and role boundaries.
10. Build AI gateway module and Content Copilot draft endpoint.

---

## 6) Delivery Strategy

- **Now:** close security and ownership loose ends first.
- **Then:** make asynchronous reliability upgrades.
- **Then:** ship AI as assistive drafting/recommendation before autonomy.
- **Always:** keep human approval and auditability for outbound side effects.