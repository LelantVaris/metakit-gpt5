### Analyzer Integration TODO (Content Audit Agent V4)

- [x] Define integration plan and UI/UX requirements (stream logs in panel; buttons: Apply Fixes, View Audit)
- [ ] Backend: FastAPI wrapper for `content_audit_agent_v4.py`
  - [ ] Add `article-optimizer/server.py` with `/audit` SSE endpoint
  - [ ] Support inputs: `{ content?: string, url?: string, fix?: boolean, web_search?: boolean }`
  - [ ] Stream granular logs and send final `result` event with `{ report_markdown, fixed_content? }`
  - [ ] Update `article-optimizer/requirements.txt` with `fastapi`, `uvicorn` (and pin versions later)
- [ ] UI Proxy (Next.js)
  - [ ] Add `content-audit-ui/app/api/analyzer/audit/route.ts` (Node runtime)
  - [ ] Proxy SSE from `process.env.ANALYZER_URL + "/audit"` to browser
  - [ ] Fallback (if no `ANALYZER_URL`): respond 503 with guidance
- [ ] Editor wiring
  - [ ] Change audit call to `/api/analyzer/audit` (keep streaming logs)
  - [ ] Change Apply Fixes to call `/api/analyzer/audit` with `fix: true`; use `fixed_content`
  - [ ] Accept both `reportMarkdown` and `report_markdown` in results
  - [ ] Optionally: add "Export Report (.md)"
- [ ] Config & Docs
  - [ ] Add `ANALYZER_URL` to `.env.local.example` and README
  - [ ] Document running analyzer locally: `uvicorn server:app --reload --port 8001`
- [ ] Deployment (post-local)
  - [ ] Deploy FastAPI on Render/Fly/Cloud Run (keep OpenAI keys in Python env)
  - [ ] Point `ANALYZER_URL` to deployed URL and validate end-to-end

Notes
- Keep current deterministic TS audit as dev fallback until Python is online.
- Ensure streaming stays smooth; prefer Node runtime for proxy route.

