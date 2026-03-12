---
description: Daily task workflow for ThreatMatrix AI development
---

# Daily Task Workflow

Follow this workflow at the start of each development day.

## Morning Standup (5 min)

1. Open `DAILY_LOG.md` and locate today's date entry
2. Review yesterday's completed items — move any unfinished items to today
3. Confirm today's focus area from the daily log

## Before Writing Code

4. Open `GLOBAL_CONTEXT.md` — verify current sprint and phase
5. If starting a new chat session with an AI model, paste `GLOBAL_CONTEXT.md` as the first message
6. Reference the relevant Master Doc Part for detailed specs:
   - Backend/API/DB → `docs/MASTER_DOC_PART2_ARCHITECTURE.md`
   - UI/Components → `docs/MASTER_DOC_PART3_MODULES.md`
   - ML/LLM → `docs/MASTER_DOC_PART4_ML_LLM.md`
   - Timeline/Deploy → `docs/MASTER_DOC_PART5_TIMELINE.md`

## During Development

// turbo-all

7. Run the dev stack to verify changes:

   ```
   docker compose -f docker-compose.dev.yml up -d
   ```

8. For backend development, run the FastAPI dev server:

   ```
   cd backend && uvicorn app.main:app --reload --port 8000
   ```

9. For frontend development, run the Next.js dev server:

   ```
   cd frontend && npm run dev
   ```

10. Commit frequently with descriptive messages:
    ```
    git add -A && git commit -m "feat(module): description"
    ```

## End of Day

11. Update `DAILY_LOG.md`:
    - Check off completed items
    - Note any blockers or decisions made
    - Move incomplete items to tomorrow

12. Update `GLOBAL_CONTEXT.md` Section 10 (Current Sprint) if any task statuses changed

13. Push to remote:
    ```
    git push origin develop
    ```

## Commit Message Format

```
feat(scope): add new feature
fix(scope): fix bug description
docs(scope): update documentation
refactor(scope): refactor without behavior change
style(scope): CSS/formatting changes
test(scope): add or update tests
chore(scope): tooling, deps, config
```

Scopes: `backend`, `frontend`, `capture`, `ml`, `llm`, `auth`, `db`, `docker`, `ui`, `war-room`, `alerts`, `intel`, `hunt`, `ai-analyst`, `forensics`, `ml-ops`, `reports`, `admin`
