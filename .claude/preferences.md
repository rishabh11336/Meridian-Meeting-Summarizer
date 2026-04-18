# User Preferences & Workflow Rules

Claude must follow these preferences at all times in this project.

## Memory Rules
- Keep local memory in `.claude/` folder (NOT in root `CLAUDE.md`)
- Multiple files are allowed and encouraged for organization
- Update `progress.md` after every meaningful step
- Update `project.md` when architecture decisions are finalized

## Code Style
- Use clear, descriptive variable and function names
- Add docstrings/comments for complex logic
- Modularize: separate files for each major concern (transcription, summarization, UI, etc.)
- Handle errors explicitly — never silently fail

## Workflow
- Read all `.claude/` files before starting any session
- Make small, verifiable changes — don't do too much at once
- Confirm tech stack or ambiguous decisions with the user before implementing
- When unsure, ask — don't assume

## Preferred Folder Structure
- `.claude/` — Claude's persistent memory (this folder)
- *(More folders to be added as project is built)*

## Communication Style
- Be concise in responses
- Summarize what was done at the end of each turn
- Flag open questions or decisions that need user input
