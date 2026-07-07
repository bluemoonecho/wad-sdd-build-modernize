---
published: true
type: workshop
title: "Spec-Driven Development: Building & Modernizing with Agentic AI"
short_title: "SDD: Build & Modernize with Agentic AI"
description: A hands-on, full-day lab on Spec-Driven Development (SDD) for building new software and modernizing existing code. Guided hands-on with GitHub Copilot, the GitHub Copilot CLI and Claude Code.
level: intermediate
authors:
  - Julia Kordick
contacts:
  - "@jkordick"
duration_minutes: 420
tags: GitHub, Copilot, Claude Code, AI, Agents, Spec-Driven Development, SDD, Modernization, TypeScript, Node, CLI
navigation_levels: 3
navigation_numbering: true
---

# Spec-Driven Development: Building & Modernizing with Agentic AI

*WeAreDevelopers Full-Day Hands-On Lab — 2026 Edition*

Welcome! This full-day, hands-on lab is about **Spec-Driven Development (SDD)**: a discipline for making the *specification*, not the *vibe*, drive what an agentic AI builds. We look at SDD both for **greenfield builds** and for **modernizing existing code**.

This lab is **open at the agentic-AI-tool level**, but will cover hands-on instructions and exercises for the three currently dominant surfaces:

- **GitHub Copilot in VS Code**
- **GitHub Copilot CLI**
- **Claude Code**

Wherever the tools differ in name, path or invocation, you will see a **parallel callout** for each one so you can follow along on whichever surface is available to you. If you want to bring your own agentic coding tool, this workshop expects you to be able to adapt it. The SDD workflow and app modernization approach described in this workshop is tool-agnostic.

Agenda:

1. **Getting Started with Agentic Coding** (optional): a single broad chapter for anyone who has never (or barely) used an agentic AI coding tool. Covers completions, chat, agent mode, terminal agents, project-level instructions, reusable prompts / commands, custom agents / subagents, skills and MCP. (est. 10-20min, only to read through or as reference)
2. **Spec-Driven Development (SDD)**: You learn how to make specifications drive what the agent builds, end-to-end, on a small TypeScript/Node feature.
3. **[spec-kit](https://github.com/github/spec-kit)** as a toolkit that formalizes the SDD loop across many agentic coding tools (Copilot, Claude, Cursor, Codex, …).
4. **SDD for app modernization**: a full lab on how to use SDD to modernize legacy apps.

<div class="info" data-title="Who is this for?">

> Developers, tech leads and architects who want to bring their agentic AI skills to the next level — for both greenfield work and modernization. Prior experience with any agentic coding tool is highly recommended. Chapter 1 exists for reference.

</div>

<div class="warning" data-title="Heads up">

> Agentic AI tooling evolves quickly. UI labels, menu locations and CLI flags shift between releases. If something looks slightly different, search the Command Palette / your CLI's `/help` — the feature is almost certainly still there.

</div>

---

## Pre-requisites

You need the following before starting:

|                                 |                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------ |
| A GitHub account                | [Create free GitHub account](https://github.com/join)                          |
| Node.js 20+ and npm             | [Install](https://nodejs.org)                                                  |
| A terminal                      | Any modern shell (bash, zsh, pwsh)                                             |
| GitHub Copilot access           | Free, Pro, Business or Enterprise — see below                                  |
| Visual Studio Code              | [Download](https://code.visualstudio.com/)                                     |
| GitHub Copilot extension(s)     | [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) and [Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat) |
| ***OR*** Claude Code access | [Install `@anthropic-ai/claude-code`](https://docs.claude.com/en/docs/claude-code/overview) — requires an Anthropic account with Claude Code access |
| GitHub CLI                      | [Install](https://cli.github.com/)                                             |
| GitHub Copilot CLI              | [Install](https://github.com/github/copilot-cli)                               |
| A fork of this repo             | [Fork this repo](https://github.com/jkordick/wad-sdd-build-modernize/fork) and clone your fork locally — you will need the `user-stories/` files for the hands-on exercises |

![Fork repository](assets/fork.png)

### Getting agent access

We can provide you GitHub Copilot access.

- **GitHub Copilot (Individual Free/Pro):** sign up at [github.com/github-copilot/signup](https://github.com/github-copilot/signup). Through your organization: [github.com/settings/copilot](https://github.com/settings/copilot).
- **Claude Code:** requires an Anthropic account with Claude Code entitlement (via Claude Pro/Max, an API key with billing, or an enterprise plan). See the [Claude Code setup docs](https://docs.claude.com/en/docs/claude-code/setup).

<div class="info" data-title="Enterprise organization check">

> Some features in this lab (models, MCP, the Copilot CLI, spec-kit, Claude Code) may be restricted by your organization's policy if you are using a device managed by your organization. Every chapter is **independently useful**; skip what you cannot use, and pick whichever agent surface you *can* use.

</div>

---

# Chapter 1 — Getting Started with Agentic Coding

> If you have never (or only barely) used an agentic AI coding tool, **start here**. This chapter is intentionally broad. Skip (parts of) it if you are already familiar and comfortable.

The three surfaces you will meet in this chapter:

| Surface | Where it lives | Primary strength |
| --- | --- | --- |
| **GitHub Copilot in VS Code** | IDE extension | Best editor integration (inline completions, inline chat, side-panel Chat) |
| **GitHub Copilot CLI** | Terminal (`copilot`) | Same Copilot power in the terminal / CI |
| **Claude Code** | Terminal (`claude`) + IDE plugins | Terminal-first agentic loop with strong long-horizon reasoning |

For every feature we introduce below, look for the two callouts:

- 💻 *"In the Copilot CLI: …"* — how it works in `copilot`.
- 🤖 *"In Claude Code: …"* — how it works in `claude`.

## 1.1 Copilot in VS Code

Open any folder in VS Code with the Copilot extensions installed. You will use four surfaces:

### Inline completions

Start typing and Copilot suggests grey inline completions. Accept with `Tab`, dismiss with `Esc`, cycle alternatives with `Alt/Option + ]` / `Alt/Option + [`

> Tip: Check your configured shortcuts under `Ctrl + Shift + P` or `Cmd + Shift + P` -> `Open Keyboard Shortcuts`.

**Try it.** Create `hello.ts` and type:

```ts
// returns the nth Fibonacci number
function fib(n: number): number {
```

Let Copilot complete the body. Now add a second comment `// returns the nth prime` above a new function and watch how *prior context in the file* is guiding the suggestion.

<div class="info" data-title="Claude Code and inline completions">

> Claude Code does **not** provide inline grey-text completions in the editor. It is an agentic tool: you talk to it and it edits files for you. If you want inline completions alongside Claude Code, keep GitHub Copilot's inline completions enabled — the two coexist fine.

</div>

### Inline chat (`Cmd/Ctrl + I`)

Select code, press `Cmd/Ctrl + I`, and ask for a transformation: *"add input validation and JSDoc"*, *"convert to async/await"*, *"write a unit test for this"*.

### Chat view (`Cmd/Ctrl+Alt+I`)

The Chat side panel in "Ask" mode is for conversation about your code. Use `#` to attach context (files, symbols, selection) and `/` for built-in commands (`/explain`, `/fix`, `/tests`, `/new`).

```text
#file:src/auth.ts /explain why does login() throw on empty passwords?
```

> 💻 **In the Copilot CLI:** attach files with `@` (not `#`) and just ask in plain language — there is no `/explain` or `/fix`. Slash commands in the CLI are for the session itself (`/agent`, `/mcp`, `/context`, `/compact`, `/usage`, `/resume`, `/cwd`, `/add-dir`). Prefix a line with `!` to run a raw shell command without invoking the model.

> 🤖 **In Claude Code:** launch with `claude` in your repo root. Attach files with `@` (e.g. `@src/auth.ts why does login() throw on empty passwords?`). Slash commands are session commands (`/help`, `/agents`, `/mcp`, `/context`, `/compact`, `/cost`, `/resume`, `/model`, `/init`). Prefix a line with `!` to shell out without invoking the model, and `#` to add a note to memory. Claude Code has no "Ask" vs "Agent" toggle either — it is always agentic.

### Agent mode

In the Chat view, switch the mode picker from **Ask** to **Agent**. Agent mode can read, create and edit files across your workspace, run commands (with your approval) and iterate until a task is done. This is the surface you will lean on most in Chapter 2.

<div class="tip" data-title="Pick the right mode">

> - **Ask** — questions, explanations, information gathering
> - **Agent** — autonomous task execution, coding, execution

</div>

> 💻 **In the Copilot CLI:** there is no Ask/Agent toggle — the CLI is always agentic. Cycle into *plan mode* with `Shift+Tab` to design before changes are made, and use `--allow-all` (or `--yolo`) for unattended runs where you accept the risk of skipping approval prompts.

> 🤖 **In Claude Code:** also always agentic. Cycle into **plan mode** with `Shift+Tab` (same shortcut). For unattended runs use `claude --dangerously-skip-permissions` — the flag is verbose on purpose. In interactive sessions you can also switch modes via `/permissions`.

## 1.2 Agentic AI on the command line
![GitHub Copilot CLI](assets/cli.png)

Both GitHub Copilot and Claude Code are IDE-independent and available as terminal agents. They give you an agent setup right in your shell — great for CI, remote boxes, or just staying in the terminal.

**Try it — GitHub Copilot CLI.** After installation, open a terminal, navigate to any folder or repo, run `copilot --banner` and ask *"what is this repository about?"*

**Try it — Claude Code.** After installation, open a terminal, navigate to any folder or repo, run `claude` and ask *"what is this repository about?"* On first launch you will be walked through auth and model selection.

<div class="warning" data-title="Command line tool execution">

> Especially when a terminal agent proposes to run shell commands, **always review the execution before accepting**. Neither `copilot` nor `claude` should be trusted to run arbitrary commands unchecked. Use plan mode when in doubt. Save `--allow-all` / `--dangerously-skip-permissions` for **isolated, disposable environments** only (containers, ephemeral VMs).

</div>

<div class="tip" data-title="Same repo, two agents">

> Feel free to run both `copilot` and `claude` against the same repository in different terminals — they don't conflict. It's a great way to compare how each agent decomposes the same task.

</div>

## 1.3 Project-level instructions

Every major agentic coding tool now reads **project-level instructions** from files checked into the repo. The *files* differ per tool; the *idea* is the same: a short, always-loaded document telling the agent how this project works.

**GitHub Copilot** reads project-level instructions from `.github/copilot-instructions.md`. There is always only one `copilot-instructions.md` per repository and it needs to be located exactly at `.github/`. You can create more specific instructions in `.github/instructions/*.instructions.md` (e.g. a `documentation.instructions.md`); the scoped files use a frontmatter `applyTo` glob to limit themselves to matching paths. GHCP also interacts with `AGENTS.md` files. You can have multiple of these in your repo. Instructions from `AGENTS.md` files are merged from the repository root downwards to the closest one (e.g. `frontend/AGENTS.md`, `backend/AGENTS.md`). The file always needs to be named exactly `AGENTS.md`.

Two things to keep in mind for both `copilot-instructions.md` and `AGENTS.md`:
1) the information in them should be relevant in *every* context the agent will operate in (because every interaction will load them), and
2) write them so they are verifiable. Avoid vague statements like *"write good code"* or *"follow best practices"*. Stick to rules that can be checked by a CI job (e.g. "tests must be runnable via `pytest`"); plus concrete paths to files and folders the agent should or should not touch.

This repo ships with an example `.github/copilot-instructions.md` you can inspect. Notice it is short, declarative and project-scoped.

> 💻 **In the Copilot CLI:** the same files are picked up automatically — `.github/copilot-instructions.md`, `.github/instructions/**/*.instructions.md` and `AGENTS.md` — when you launch `copilot` inside the repo. No additional configuration needed.

> 🤖 **In Claude Code:** the primary project-level instructions file is **`CLAUDE.md`** at the repo root (create it with `/init` inside `claude`). Claude Code also honors `AGENTS.md` in the same nested-merge way as Copilot, so keeping shared rules in `AGENTS.md` and tool-specific overrides in `CLAUDE.md` / `.github/copilot-instructions.md` works well. Personal-scope memory lives at `~/.claude/CLAUDE.md`. The same "concrete, verifiable, project-scoped" rules of thumb apply.

<div class="tip" data-title="Rule of thumb for multi-tool repos">

> Put rules that apply to **every** agent in `AGENTS.md`. Put tool-specific tweaks in `.github/copilot-instructions.md` (Copilot) and `CLAUDE.md` (Claude Code). Anything in all three files should be identical — otherwise agents will disagree.

</div>

## 1.4 Reusable prompts / slash commands

Both ecosystems support checking **reusable prompts** into the repo, exposed as slash commands in the agent surface.

**GitHub Copilot: prompt files.** Prompt files (`*.prompt.md`) are reusable prompts stored in your repo. They show up in Chat as runnable commands.

Create `.github/prompts/add-test.prompt.md`:

<div class="tip" data-title="Tip">

> You can either create it manually or `CTRL/CMD + Shift + P` -> New Prompt File...

</div>

```markdown
---
mode: agent
description: Add unit tests
---
Look at the source I provide. Write unit tests that cover the main exported functions. Place tests next to the source as `<filename>.test.ts` and run them with `vitest`.
```

Run it from Chat with `/add-test`. Prompt files are the *primitive* you will build SDD on top of in Chapter 2.

> 💻 **In the Copilot CLI:** `.prompt.md` files are a VS Code Chat feature and are not exposed as slash commands in the CLI. For reusable workflows in the CLI, reach for custom agents (1.5) or skills (1.6) instead — or just paste the prompt body into your session.

> 🤖 **In Claude Code:** the equivalent primitive is **custom slash commands**. Drop a Markdown file in `.claude/commands/` (project) or `~/.claude/commands/` (personal). The file name (minus `.md`) becomes the command. Example — save the exact same prompt body as `.claude/commands/add-test.md`, and run it in a Claude Code session with `/add-test`. Arguments passed after the command are available as `$ARGUMENTS` inside the file. This means a repo can ship *both* `.github/prompts/*.prompt.md` (for Copilot in VS Code) and `.claude/commands/*.md` (for Claude Code) with the same prompt body — a two-file duplication is a small price for tool coverage.

## 1.5 Custom agents / subagents

**GitHub Copilot custom agents** (`*.agent.md`) let you create specialized Copilot personas with tailored expertise, tool access and instructions. Store them in `.github/agents/` at the repo level. They are available in VS Code, on github.com and in the Copilot CLI.

Create `.github/agents/test-specialist.agent.md`:

<div class="tip" data-title="Tip">

> Same trick available like above. With `CTRL/CMD + Shift + P`-> Create new agent...

</div>

```markdown
---
name: test-specialist
description: Focuses on test coverage and quality without modifying production code
tools: ["codebase", "search", "editFiles", "runCommands"]
---
You are a testing specialist focused on improving code quality through comprehensive testing. Analyze existing tests, identify coverage gaps, and write unit, integration, and end-to-end tests. Focus only on test
files — avoid modifying production code unless specifically requested.
```

Pick the agent from the mode dropdown in VS Code Chat, or use it in the Copilot CLI with the `/agent` command. See [Creating custom agents](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents) for full configuration options.

> 💻 **In the Copilot CLI:** same files (`.github/agents/` for the repo, `~/.copilot/agents/` for personal). Pick one interactively with `/agent`, mention it in a prompt (*"use the test-specialist agent to…"*), or launch it directly: `copilot --agent=test-specialist --prompt "…"`. The CLI also ships built-in agents (Explore, Task, General purpose, Code review, Research, Rubber duck).

> 🤖 **In Claude Code:** the equivalent concept is **subagents**. Store them as Markdown files in `.claude/agents/` (project) or `~/.claude/agents/` (personal). The frontmatter uses the same *idea* but slightly different keys — `name`, `description`, and `tools` (a comma-separated list of tool names the subagent may use). Example:
>
> ```markdown
> ---
> name: test-specialist
> description: Focuses on test coverage and quality without modifying production code
> tools: Read, Write, Edit, Bash, Grep, Glob
> ---
> You are a testing specialist ... (same body as above)
> ```
>
> List them with `/agents` and invoke them by mentioning them in a prompt (*"use the test-specialist subagent to add tests for src/auth.ts"*). Claude Code will delegate to a fresh, isolated context window per subagent invocation — great for keeping the main session lean.

## 1.6 Agent skills

If you know what you want to do (e.g. converting a svg to a png) you can just tell the agent "how to do it" with the help of a skill.

Skills are an [open standard](https://agentskills.io/) — they work across VS Code, the Copilot CLI, Claude Code and any other agentic AI that supports the spec.

**GitHub Copilot:** skills live in `.github/skills/` (project) or `~/.copilot/skills/` (personal). Create one with `Cmd/Ctrl+Shift+P` → *Generate Skill…* or type `/create-skill` in Chat.

This repo ships with three example skills you can copy into your project:

| Skill | What it does |
| --- | --- |
| `run-tests` | Runs `npm test`, reads failures, fixes the code (not the test), re-runs until green. |
| `lint-and-typecheck` | Runs `tsc --noEmit` then `eslint`, fixes issues in the right order. |
| `convert-svg-to-png` | Wraps a shell script that converts SVG → PNG using whichever tool is available. Shows how a skill can include **scripts** alongside instructions. |

Each skill is a folder containing a `SKILL.md` (the instructions) and optional supporting scripts / assets — that's it.

Copilot auto-loads a matching skill when it detects a relevant task, or you invoke it explicitly with `/run-tests`.

> 💻 **In the Copilot CLI:** the same `.github/skills/` and `~/.copilot/skills/` locations are honored — no per-tool config required.

> 🤖 **In Claude Code:** same open standard. Project-scoped skills live in `.claude/skills/`, personal ones in `~/.claude/skills/`. A skill is a folder with a `SKILL.md` whose frontmatter (`name`, `description`) tells Claude when to auto-load it. Because the format is shared, you can copy this repo's `run-tests`/`lint-and-typecheck`/`convert-svg-to-png` skill folders straight into `.claude/skills/` and they will work — or symlink them from a single source location if you want to avoid duplication.

## 1.7 MCP servers

The [Model Context Protocol](https://modelcontextprotocol.io) lets agentic AI tools connect to external tools — issue trackers, databases, browsers, your own services and knowledge bases. Both Copilot and Claude Code are MCP clients.

**GitHub Copilot in VS Code:** open the `Extensions` tab and type `@mcp` to see all available MCP servers.

Configure custom MCP servers per workspace in `.vscode/mcp.json`, e.g.:

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

> 💻 **In the Copilot CLI:** the GitHub MCP server is preconfigured. Add more with `/mcp add` (interactive form, save with `Ctrl+S`). The CLI does not read `.vscode/mcp.json` — server definitions live in `~/.copilot/mcp-config.json` (or wherever `COPILOT_HOME` points).

> 🤖 **In Claude Code:** manage MCP servers with the `claude mcp` subcommands, e.g. `claude mcp add github --transport http https://api.githubcopilot.com/mcp/`, or interactively from a session with `/mcp`. Project-scoped servers can be committed to `.mcp.json` at the repo root — Claude Code will offer to load them on first use in that repo. Personal servers live in `~/.claude.json`. Servers configured this way appear as tools alongside your subagents.

Once connected, the agent can call those tools by name.

<div class="info" data-title="Enterprise organization check">

> MCP servers may be governed by allow-lists both for GitHub Copilot and for Claude Code. Check with your platform engineering team before trying to add new ones.

</div>

<div class="tip" data-title="Tip">

> For SDD, an MCP server pointing at your issue tracker is gold: your agent can read the original ticket, write the spec, and link the PR back — regardless of which agent you use.

</div>

## 1.8 Quick mental model

| Surface / concept | GitHub Copilot in VS Code | GitHub Copilot CLI | Claude Code |
| --- | --- | --- | --- |
| Inline completion | ✅ | — | — |
| Inline / targeted chat | ✅ (`Cmd/Ctrl+I`) | via prompts | via prompts |
| Ask (Q&A) | ✅ (Chat "Ask") | Just ask | Just ask |
| Agent (autonomous) | ✅ (Chat "Agent") | Always | Always |
| Plan mode | — | `Shift+Tab` | `Shift+Tab` |
| Project instructions | `.github/copilot-instructions.md` + `AGENTS.md` | same as VS Code | `CLAUDE.md` + `AGENTS.md` |
| Scoped instructions | `.github/instructions/*.instructions.md` (`applyTo` glob) | same as VS Code | nested `AGENTS.md` / `CLAUDE.md` per folder |
| Reusable prompts | `.github/prompts/*.prompt.md` | (use agents/skills) | `.claude/commands/*.md` |
| Custom agents / subagents | `.github/agents/*.agent.md` | same, plus built-ins | `.claude/agents/*.md` |
| Skills | `.github/skills/**/SKILL.md` (agentskills.io) | same as VS Code | `.claude/skills/**/SKILL.md` (same standard) |
| MCP config | `.vscode/mcp.json` | `~/.copilot/mcp-config.json` | `.mcp.json` (project) / `~/.claude.json` (personal), or `claude mcp add` |
| Unattended mode flag | — | `--allow-all` / `--yolo` | `--dangerously-skip-permissions` |

You now have the full toolbox on all three surfaces. The rest of the lab is about **using it**.

---

# Chapter 2 — Spec-Driven Development

## 2.1 Why spec-driven?

A lot of people use agentic coding tools like this:

> *"build me a REST API for managing tasks"*

…and then spend the next hour wrestling with what the agent assumed. This is **vibe coding**: you ship intent, the agent ships interpretation, and the gap between them becomes technical debt and security risks.

**Spec-Driven Development (SDD)** tightly structures the agentic workflow:

Spec  →  Plan  →  Tasks  →  Implement

The spec describes the **what**, derived from the user stories. The plan describes the technical **how**. The tasks are a todo list based on the spec and the plan. In the implementation, the task list is executed.

You gain three things:

1. **Reviewability.** A precise spec & plan is something a human (or a second AI agent) can review. 800 lines of generated code distributed between multiple files is not.
2. **Control.** The 3 planning steps create a "contract" between your intent and the execution by an agentic AI.
3. **A structured way of working & better outcomes.** With the help of divide and conquer, you can get to more complex, multi-file, multi-iteration features that are still manageable and maintainable.

<div class="tip" data-title="Important">

> If you struggle to break down the task at hand into a reasonably sized spec, you probably need to break the task at hand into smaller pieces. SDD is not a silver bullet for complexity — it is a discipline that helps you manage it, but it does not replace good judgment in scope definition.

</div>

<div class="info" data-title="Tool-agnostic on purpose">

> This chapter is written for GitHub Copilot's prompt-file syntax, because it gives us the cleanest hands-on experience with `${input:...}` placeholders. Every step also works in the Copilot CLI (just paste the prompt body into your session) and in Claude Code (use `.claude/commands/*.md`). If you prefer, you can complete the entire chapter in Claude Code.

</div>

## 2.2 Hands-on: build The Rubber Duck Emporium with SDD

You will build a small e-commerce application for **The Rubber Duck Emporium** — a shop that sells specialty rubber ducks for every possible occasion: Debugging Ducks, Philosopher Ducks, Maritime Ducks, Wellness Ducks, and Limited Editions.

The user stories live in the [`user-stories/`](../user-stories/) folder of this repo. **Read [`user-stories/README.md`](../user-stories/README.md) first** — it describes the product, personas (Quincy Quacker the customer, Dr. Mallard the curator), shared constraints, and the dependency graph between stories.

There are 9 stories. A realistic ~90-120 minute run completes the full application.

### 2.2.1 Scaffold

```bash
mkdir duck-emporium && cd duck-emporium
npm init -y
npm i -D typescript tsx vitest @types/node
npx tsc --init
mkdir -p src specs
git init && git add -A && git commit -m "scaffold project"
```

Add a minimal `AGENTS.md` in the `duck-emporium/` folder:

```markdown
# Project: duck-emporium
- Language: TypeScript (ES modules), Node 20+.
- Use `node:`-prefixed built-ins.
- Tests live next to source as `*.test.ts`, run with `vitest`.
- User stories live in `../user-stories/`. Specs go in `specs/<story-id>/`.
- Never edit `user-stories/**`.
- Only edit files under `specs/**` when invoked through an `sdd-*` prompt.
- Follow the workflow in `.github/prompts/sdd-*.prompt.md`.
- Payments are MOCKED. Never integrate a real payment provider.
```

Because both GitHub Copilot and Claude Code honor `AGENTS.md`, this single file is enough for both — no duplication needed.

### 2.2.2 Add the SDD prompt files

All prompts assume you run them from inside the `duck-emporium/` folder; paths are relative to that working directory. They use a `${input:storyId}` placeholder, so VS Code will prompt you for the story id when you invoke them.

<div class="tip" data-title="Remember!">

> You can create the prompt files manually or `CTRL/CMD + Shift + P` → *New Prompt File…* and copy-paste the content below.

</div>

Create `.github/prompts/sdd-spec.prompt.md`:

```markdown
---
name: sdd-spec
description: Turn a user story into a reviewable spec.
---
Goal: produce `specs/${input:storyId}/spec.md` from `../user-stories/${input:storyId}.md`.

Rules:
- Read the user story file first. Treat it as raw input, not as a spec.
- Ask clarifying questions ONE at a time. Use the "Open questions" section of the user story as a starting point but go beyond it.
- Do not write code or any file other than `specs/${input:storyId}/spec.md`.
- When you have enough information, write the spec using this outline:
  Problem, Users, Scope (in/out), Functional requirements,
  Non-functional requirements, Acceptance criteria, Open questions.
- Stop after writing the spec and wait for approval.
```

Now create three more prompt files in `.github/prompts/`, each consuming the previous artifact and producing exactly one new one:

`sdd-plan.prompt.md`:

```markdown
---
description: Turn an approved spec into a technical plan.
---
Goal: produce `specs/${input:storyId}/plan.md` from `specs/${input:storyId}/spec.md`.

Rules:
- Read the spec first. If it has unresolved "Open questions", stop and ask.
- Do not write code. Do not modify the spec.
- The plan covers: data model, module/file layout, public interfaces,
  external dependencies, testing strategy, risks.
- Stop after writing the plan and wait for approval.
```

`sdd-tasks.prompt.md`:

```markdown
---
description: Break an approved plan into an ordered task list.
---
Goal: produce `specs/${input:storyId}/tasks.md` from `specs/${input:storyId}/plan.md`.

Rules:
- Each task is independently committable and has a clear acceptance check
  (e.g. "`vitest` for X passes").
- Number tasks sequentially. Note dependencies between them.
- Do not write code. Do not modify the spec or the plan.
- Stop after writing tasks.md and wait for approval.
```

`sdd-implement.prompt.md`:

```markdown
---
description: Implement a single numbered task from the task list.
---
Goal: implement task `${input:taskNumber}` from `specs/${input:storyId}/tasks.md`.

Rules:
- Read spec.md, plan.md and tasks.md before touching any code.
- Implement ONLY the named task. Do not start the next one.
- Add or update tests for the task. Run `vitest` and ensure it is green.
- If a test fails, fix the code (not the test) until it passes.
- Stop after the task is green and wait for approval to commit.
```

> 🤖 **In Claude Code:** duplicate each of these four prompts into `.claude/commands/` with a small adjustment: Claude Code's slash commands substitute arguments via `$ARGUMENTS` (a single positional string), not `${input:...}`. The cleanest port is one command per SDD phase that takes the story id (and, for `sdd-implement`, the task number) as its argument:
>
> `.claude/commands/sdd-spec.md`:
>
> ```markdown
> ---
> description: Turn a user story into a reviewable spec.
> ---
> Story id: $ARGUMENTS
>
> Goal: produce `specs/$ARGUMENTS/spec.md` from `../user-stories/$ARGUMENTS.md`.
>
> Rules:
> - Read the user story file first. Treat it as raw input, not as a spec.
> - Ask clarifying questions ONE at a time. Use the "Open questions" section of the user story as a starting point but go beyond it.
> - Do not write code or any file other than `specs/$ARGUMENTS/spec.md`.
> - When you have enough information, write the spec using this outline:
>   Problem, Users, Scope (in/out), Functional requirements,
>   Non-functional requirements, Acceptance criteria, Open questions.
> - Stop after writing the spec and wait for approval.
> ```
>
> Run it in a `claude` session as `/sdd-spec browse-catalog`. Do the analogous ports for `sdd-plan.md`, `sdd-tasks.md` and `sdd-implement.md` (for `sdd-implement`, take two args and split `$ARGUMENTS` on whitespace, or use two commands — `/sdd-implement-task browse-catalog 3`).
>
> If you want the smallest possible footprint, you can also skip files entirely and just paste the prompt body into the session — but committing them into `.claude/commands/` means every teammate on any tool gets the same workflow.

### 2.2.3 Run the loop, story by story

Pick story 1 (`browse-catalog`). In Chat (Agent mode), invoke the prompt. VS Code will ask you for the `storyId` input:

```text
/sdd-spec
```

When prompted, enter `browse-catalog`. Then answer the clarifying questions. Expect to make a foundational decision here that will affect every later story — e.g., *"is this a JSON API or a server-rendered web app?"*, *"what fields does a `Duck` have?"*. Review `specs/browse-catalog/spec.md`. Iterate until you are happy.

Then run the next prompts in the loop (each will prompt for `storyId`, and `sdd-implement` will also ask for `taskNumber`):

```text
/sdd-plan
/sdd-tasks
/sdd-implement
```

> 🤖 **In Claude Code:** the same loop, just with inline arguments:
>
> ```text
> /sdd-spec browse-catalog
> /sdd-plan browse-catalog
> /sdd-tasks browse-catalog
> /sdd-implement browse-catalog 1
> ```

<div class="tip" data-title="Tip">

> **Commit after every passing task.**

</div>

When the story is done, move on to story 2 (`duck-detail`), which builds on story 1's foundation.

<div class="tip" data-title="Tip">

> Of course spec driven development can potentially take all user stories at once, but we recommend doing it one by one for the first few times until you get the hang of it. If you want to experience the all-in-one-go experience, check out the spec-kit chapter in this workshop.

</div>

### 2.2.4 What you should notice

- During story 1's spec, you make decisions (Duck shape, storage, transport) that *prevent* whole categories of confusion in stories 2–9.
- The agent stops asking *"what did you mean by…?"* mid-implementation, because you front-loaded that in the spec.
- When a test fails, the fix is local to one task, not a sprawling rewrite.
- If you change your mind, you edit the spec and re-run from `/sdd-plan`. The plan, tasks and code regenerate cleanly.
- A teammate can review `spec.md` + `tasks.md` in 5 minutes and know exactly what shipped.
- The user story files are *never* edited by the agent. They are the immutable source of truth for "what the customer asked for".
- **Same discipline, any tool.** Whether you drove the loop from VS Code Chat, the Copilot CLI, or Claude Code, the artifacts on disk look identical. That is the point of SDD — the workflow is defined by the files, not by the tool.

<div class="tip" data-title="Do this now">

> Even outside the lab, try this on the next ticket in your real backlog: copy the ticket text into a `user-stories/` file, then run `/sdd-spec` against it (with context friendly adjustments). Time-box to 20 minutes. The clarity gain is the win. Code is a bonus.

</div>

## 2.3 SDD across all three surfaces

Everything above works in all three agent surfaces. Same instructions on disk, same artifacts — just invoked differently:

- **VS Code (Copilot Chat, Agent mode):** `/sdd-spec` → VS Code prompts for `storyId`.
- **GitHub Copilot CLI:** paste the prompt body into a `copilot` session, or (for repeatable use) wrap it in a custom agent under `.github/agents/`.
- **Claude Code:** `/sdd-spec browse-catalog` in a `claude` session, using the `.claude/commands/` ports from 2.2.2.

Pick the tool that fits the moment. Switch mid-story if you want to.

---

# Chapter 3 — spec-kit by GitHub

[spec-kit](https://github.com/github/spec-kit) is an open-source toolkit by the GitHub team that formalizes and extends the loop you just did by hand. As it is an open-source project it can not only be used in combination with GitHub Copilot but [many more agentic AIs for coding](https://github.github.io/spec-kit/reference/integrations.html) — including **Claude Code**, Cursor, Codex and others. So if you now want to give it a try with Claude, Cursor or Codex, this is the moment.

<div class="info" data-title="If you want to learn more">

> https://developer.microsoft.com/blog/spec-driven-development-ai-native-engineering

</div>

It ships a `specify` CLI that scaffolds the `specs/` layout, prompt files and chatmodes for you, and integrates with several AI agents.

<div class="warning" data-title="Enterprise organization check">

> Some organizations restrict which CLIs developers can install (`uv`, `uvx`, `npx`, etc.). If `specify` is not allowed in your environment, you have already learned the underlying workflow in Chapter 2.

</div>

## 3.1 Install & initialize the project

Follow the installation instructions in the [spec-kit README.md](https://github.com/github/spec-kit#-get-started).

In the root of the project, pick the integration that matches the agent you want to drive spec-kit with:

```bash
# GitHub Copilot integration
specify init duck-emporium --integration copilot
# or Claude Code integration
specify init duck-emporium --integration claude
## choose your fate between bash or powershell
cd duck-emporium
```

<div class="warning" data-title="Workaround">

> `specify init duck-emporium` creates a nested layout (a `duck-emporium/` folder containing `.specify/`, `.github/` and/or `.claude/`, scripts, etc.). For the agent to pick up the slash commands and templates in this workshop's setup, cut those folders out of `duck-emporium/` and paste them at the repository root, so they are easily accessible. Alternatively, run `specify init .` from inside an empty target folder to avoid the nesting entirely.

</div>

This creates a structured layout with the SDD phases (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` and some additional steps) pre-wired as slash commands.

## 3.2 Run the same loop, but guided

In GitHub Copilot Chat (or a `claude` session — the slash commands are identical):

```text
/speckit.specify checkout #user-stories and create a specification out of them
```

<div class="tip" data-title="Branching">

> When spec-kit starts working it creates a dedicated working branch.

</div>

Compare what spec-kit does and what it generates against the hand-rolled prompts from Chapter 2. You will recognize every step, spec-kit just removes the boilerplate.

## 3.3 Cross-tool takeaway

Chapter 2 taught you the *pattern*; Chapter 3 gave you an *implementation* of that pattern that is portable across most major agent surfaces. The value of spec-kit is not that it is smarter than your hand-rolled prompts — it is that a whole team can share one canonical scaffold, regardless of which agent each teammate prefers.

---

# Chapter 4 — SDD for App Modernization

Chapter 2 used SDD to build something new. This chapter uses the same discipline in the opposite direction: taking an **existing** code base — usually one nobody fully understands anymore — and modernizing it without losing the business rules baked into it over the years.

Modernization is where agentic AI actually earns its keep. A human alone can rewrite a legacy service, but the tedious parts — reading every controller, every stored procedure, every XML config, every home-grown utility — are exactly what the agent is good at, *if* you give it a framework to work in. That framework is SDD, applied backwards: first you use the agent to **rediscover** the spec that the code implicitly encodes, then you use SDD forward again to plan and rebuild against that spec.

<div class="info" data-title="Same discipline, different starting point">

> In Chapter 2 the input was a user story and the output was code. In Chapter 4 the input is code and in multiple SDD iterations the output is (first) a spec, then a plan, then new code. The Spec → Plan → Tasks → Implement loop is the same, we just "misuse" it.

</div>

## 4.1 Why divide and conquer matters even more here

A greenfield project has one thing legacy code doesn't: a bounded scope. You know what you are building because you just wrote the story. In a legacy system, scope is whatever accumulated over 5–20 years of tickets, hotfixes, integrations and "temporary" workarounds. Trying to modernize it in one pass — even with the best agent — reliably produces two outcomes:

1. **Silent behavior loss.** Edge cases that were load-bearing for one specific customer disappear because nobody documented them and the agent had no reason to preserve them.
2. **Context collapse.** The agent's context window fills up with legacy code before it gets to reason about the target architecture, and quality drops sharply.

The fix is the same discipline you already learned: **break the work into phases, each producing a reviewable artifact, each committable on its own.** We use four phases for modernization:

| Phase | Input | Output | Question it answers |
| --- | --- | --- | --- |
| **1. Rediscovery** | Legacy source, docs, tickets | Reverse engineered business logic + curated `AGENTS.md` | *What does this system actually do?* |
| **2. Substitution audit** | Legacy sources, rediscovered business logic | Substitution map | *What in here is no longer needed or state of the art?* |
| **3a. Re-architecture** | Reverse engineered business logic + substitution map | Target architecture plan | *What should the new shape look like?* |
| **3b. Re-write** | Target plan + reverse engineered business logic + substitution map | New implementation + tests (you can also apply Test Driven Development here) | *How do we rebuild the business logic without losing it?* |
| **4. Deploy (optional)** | Working new build | CI/CD pipeline + running environment | *How does this ship, repeatably?* |

<div class="warning" data-title="Agentic AI is non-deterministic">

> Especially for the reverse engineering in phase 1, agentic AI is not the magic solution. In real world scenarios you will always need a combination of agentic power, human oversight and deterministic tooling to ensure that the rediscovered business logic is correct. No one with a reputation would ever promise you a one-click solution. Only believe what you can validate!

</div>

## 4.2 Phase 1 — Rediscovery/Reverse engineering

The goal of phase 1 is to produce, from the code itself, existing tests, documentation - whatever is available — a reviewable reverse engineered list of business rules, data models, and integrations. 

You point the agent at the repository (or, more often, a *module* of it — see below) and ask it to produce artifacts like:

- **A list of business rules** — what the system does, in plain English, with examples. This is the most important artifact: it is what you will use to validate that the new implementation preserves the old behavior.
- **A data model summary** — entities, relationships, invariants (including the ones only enforced by DB triggers or defensive `if`s scattered across services).
- **An integration inventory** — every external system this module talks to: databases, message queues, third-party APIs, filesystem paths, hard-coded IPs.
- **A behavior open-questions list** — anything the agent could not resolve from the code alone. This becomes the interview list for the humans who still remember.

<div class="tip" data-title="Curate an AGENTS.md before you go deep">

> AGENTS.mds can also be very handy in agentic modernization scenarios. Even before the start of the rediscovery phase a curated AGENTS.md can help the agent to understand the context of the legacy system and its dependencies easier and avoid making wrong assumptions. 

</div>

<div class="info" data-title="Rediscovery is where humans still lead">

> The agent is fast at reading code. It is not fast at knowing which of the 40 branches in the pricing engine is actually used in production. Treat phase 1 as *agent-assisted archaeology*: the agent produces drafts, humans who know the system correct them, and the corrections get folded back into the results.

</div>

At the end of phase 1 you have something the original codebase probably never had: a human and agentic reviewable document. That alone is often worth the exercise, even if you never proceed to phase 2. (e.g. if you want to keep a certain technology stack for a while longer, like a mainframe)

## 4.3 Phase 2 — Substitution audit

Phase 1 tells you *what* the system does. Phase 2 asks: *of the things it does, which ones should not be done that way anymore?*

The pattern here is a walk through the rediscovery spec, flagging each element against today's ecosystem:

- **Home-grown code that is now a library.** Custom retry loops, hand-rolled JSON parsers, bespoke connection pools, in-house auth — anything that has become a well-supported dependency (or a platform primitive) since the code was written.
- **Integrations that have moved on.** SOAP endpoints that now offer REST/GraphQL, on-prem message brokers with managed equivalents, batch file drops that could be event streams, custom SFTP scripts that could be a managed connector.
- **Data stores that no longer fit.** A single monolithic RDBMS holding data with wildly different access patterns; a NoSQL choice that was trendy in 2015 but has no operator today; a schema shaped around a UI that no longer exists.
- **Runtimes and frameworks past their sell-by date.** End-of-life language versions, EOL frameworks, container base images with unpatched CVEs, servers nobody ships new versions of.
- **Operational assumptions that don't survive contact with the cloud.** Local filesystem state, background threads that must survive across requests, singleton in-memory caches, "just SSH in and restart it" runbooks.

The output is a table (or a set of them) with rows like *"custom JWT verification in `src/auth/` → replace with framework middleware, reason: CVE surface + team no longer maintains it"* or *"nightly cron pushing CSVs to partner FTP → replace with event-driven pipeline, reason: latency + observability"*. Each row is a candidate change with an explicit trade-off, which is exactly what phase 3 needs to make architectural decisions.

<div class="info" data-title="Not everything gets substituted">

> A perfectly good substitution map has "keep as-is" rows. If a piece of the legacy system is stable, well-understood and cheap to run, leaving it alone is a legitimate outcome. Modernization is not a synonym for rewriting everything.

</div>

## 4.4 Phase 3 — Re-architect and re-write

Phase 3 is where you go from *understanding* the legacy system to *replacing* it. It splits cleanly in two, and the split matters because they answer different questions and are reviewed by different people.

### 4.4.1 Phase 3a — Re-architecture

Input: the reverse engineered business logic (phase 1) and the substitution map (phase 2). Output: a **target architecture plan** scoped to the whole module or system rather than a single story.

The plan covers:

- **Target runtime and platform** — language version, framework, deployment target (containers, serverless, managed app platform).
- **Module and service boundaries** — what stays a monolith, what splits out, and *why* (each split needs a justification tied back to the behavior spec).
- **Data model and storage choices** — including the migration path from the legacy schema.
- **Integration contracts** — the concrete API/event shapes replacing each legacy integration flagged in phase 2.
- **Cross-cutting concerns** — auth, logging, config, secrets, observability, feature flags.
- **Migration strategy** — big-bang vs. strangler-fig vs. parallel-run, and how you keep the lights on for existing users during the transition.
- **Risks** — the ones the agent can name from the spec plus the ones the humans add from experience.
- and everything that might be relevant for your specific modernization scenario/tech stack.

### 4.4.2 Phase 3b — Re-write

Once the architecture is approved, re-writing the business logic looks a lot like Chapter 2 of this course. You break the reverse engineered business logic and the architecture plan into a spec, plan, task list and then you implement them one at a time with tests, exactly like `sdd-implement` — the only difference is that the "acceptance check" for each task usually includes *"and it still passes the behavior tests derived from phase 1"*.

Two techniques matter here:

- **Behavior-preserving tests come first.** Before rewriting a module, derive tests from the rediscovery spec that exercise its observable behavior. These tests live against the *new* implementation and are your guardrail against silent regressions.
- **Strangler-fig by default.** Route new implementations behind the same interface as the legacy code and switch traffic gradually. Big-bang cutovers are viable for small modules and effectively never viable for large ones.

<div class="warning" data-title="Do not let the agent invent business rules">

> When the agent hits a gap in the business rule description during phase 3b, it will be tempted to *guess* what the legacy system did. Prompt the agent in a way that whenever there is a white space, something that needs to be clarified, it stops and asks for clarification. Guessed business rules are the single most expensive class of modernization defects because they only surface in production, quietly, on the customers whose edge case you missed.

</div>

## 4.5 Phase 4 (optional) — CI/CD and deployment

At this point the artifacts you produced in earlier phases pay off again: the architecture plan named the deployment target, the substitution map named the operational changes, and the behavior tests give you a signal you can gate a pipeline on. Phase 4 is where you:

- Set up (or extend) the CI pipeline to build, test and scan the new code.
- Produce the infrastructure-as-code for the target platform (containers, managed services, whatever phase 3a picked).
- Wire up secrets, config, observability and health checks.
- Define the promotion path — dev → staging → production — and the rollback path.
- Run the strangler-fig cutover from phase 3b behind whatever traffic-shifting mechanism your platform provides.

## 4.6 Hands-on: modernize a legacy application

I prepared a java legacy application for you to modernize. You can find it [here](https://github.com/jkordick/training-java-monolith-refactor). Based on this example we will apply through the different phases with the help of SDD. For each phase we will do a separate SDD loop.

After cloning the repository initialize spec-kit as done before in chapter 3.1.

Then run **one spec-kit loop per phase**. Each phase's kick-off is a single `/speckit.specify` prompt — spec-kit takes it from there through `/speckit.plan`, `/speckit.tasks` and `/speckit.implement`. Keep prompts short: state the phase's goal, the inputs to read, the output artifact, and one guardrail. Answer clarifying questions as they come.

### Phase 1 — Rediscovery

```text
/speckit.specify Reverse-engineer this legacy Java monolith. Read the source, tests and any docs. Produce a rediscovery spec covering: (1) business rules in plain English with concrete examples, (2) the data model — entities, relationships, invariants (including those enforced only by defensive code or DB constraints), (3) an integration inventory (every external system, filesystem path, hard-coded endpoint), (4) an open-questions list for anything you cannot resolve from the code alone. Do not propose changes and do not write code. Stop and ask before guessing behavior.
```

### Phase 2 — Substitution audit

```text
/speckit.specify Read the rediscovery spec from phase 1. Produce a substitution audit: for each rediscovered element decide keep-as-is, replace-with-library, replace-with-platform, or retire. Cover home-grown code with modern equivalents, integrations that have moved on, data stores that no longer fit, EOL runtimes/frameworks, and operational assumptions that don't survive in the cloud. Output a table with columns: legacy element, proposal, reason, trade-off. Do not design the new architecture.
```

### Phase 3a — Re-architecture

```text
/speckit.specify Read the rediscovery spec (phase 1) and the substitution audit (phase 2). Produce a target architecture spec for the modernized system covering: target runtime and platform, module/service boundaries with justifications tied to business rules, data model and migration path from the legacy schema, integration contracts replacing each flagged legacy integration, cross-cutting concerns (auth, logging, config, secrets, observability), migration strategy (default to strangler-fig), and risks. Do not write code.
```

### Phase 3b — Re-write

```text
/speckit.specify Read the rediscovery spec, substitution audit and target architecture. Produce a re-write spec for the first module to migrate. Every functional requirement must map to a behavior-preserving acceptance test derived from phase 1's business rules. Route the new implementation behind the same interface as the legacy code so traffic can be switched gradually. If a business rule is ambiguous or missing, stop and ask — never invent behavior.
```

Repeat phase 3b module by module until the legacy code path is empty.

### Phase 4 (optional) — CI/CD and deployment

```text
/speckit.specify Read the target architecture (phase 3a) and the current build/test setup. Produce a deployment spec covering: CI pipeline (build, test, scan), infrastructure-as-code for the platform chosen in phase 3a, secrets/config/observability wiring, promotion path dev → staging → production, rollback path, and the strangler-fig traffic-shifting mechanism for the modules rewritten in phase 3b. Do not deploy yet.
```




