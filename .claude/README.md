# .claude/ — Local Memory for Claude

This folder is Claude's **persistent local memory** for the Video Summarizer project.
Claude should read ALL files in this folder at the start of every session.

## File Structure

| File | Purpose |
|------|---------|
| `README.md` | This index — overview of the memory system |
| `project.md` | Core project context, goals, and architecture decisions |
| `progress.md` | Running log of what has been built/done (updated as we go) |
| `preferences.md` | User preferences, code style, and workflow instructions |

## Instructions for Claude

1. **Always read** all files in `.claude/` at the start of a session.
2. **Update `progress.md`** after every significant step or feature built.
3. **Update `project.md`** when architecture decisions are made.
4. **Never delete** memory files — append or edit existing content.
5. Multiple files can be created here as the project grows.
