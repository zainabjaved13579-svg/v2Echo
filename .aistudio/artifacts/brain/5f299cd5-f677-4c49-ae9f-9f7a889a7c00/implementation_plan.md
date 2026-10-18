# Implementation Plan: VS Code IDE Codex, Developer Tools Suite & Ultra-Clean Zero-Lag UI

Transform the platform based on user specifications:
1. **Remove File Commander** from the Tools Studio navigation and views.
2. **Re-architect Codex Studio into a complete, authentic VS Code-style IDE**:
   - Direct native folder/workspace open button (`showDirectoryPicker` + `webkitdirectory` fallback).
   - VS Code activity bar (Explorer, Search, Source Control, Extensions/AI).
   - Side-by-side multi-tab editor with breadcrumb bar, syntax highlights, and line numbers.
   - Live integrated preview split pane with desktop/mobile viewport toggle, console log drawer, and hot reload.
   - Autonomous multi-file code generation that creates real project files step-by-step using fast Gemini reasoning models.
3. **Add 3 high-utility developer tools** to Tools Studio:
   - **API Tester / REST Client**: Execute HTTP/REST requests (GET, POST, PUT, DELETE), headers, JSON body, query params, response viewer with status code, latency, and syntax formatting.
   - **Regex Studio**: Live regex pattern matcher, flags, match groups, substitution playground, and regex cheatsheet.
   - **Code Formatter & Beautifier**: Multi-language code beautifier (HTML, CSS, JS/TS, JSON, SQL) with indentation control and copy/download.
4. **Ultra-Clean, Zero-Lag UI Polish**:
   - Remove dense walls of marketing/kicker text, noisy banners, and heavy decorative elements that cause chat lag and clutter.
   - Compact cards, sleek dark/light palette, minimal typography, and snappy rendering.

---

## User Review Required

> [!IMPORTANT]
> **Tools Studio Update**: File Commander will be retired from Tools Studio tabs as requested. Tools Studio will now feature:
> 1. **Web Cloner** (Ultra website cloner with live sandbox & ZIP export)
> 2. **URL to App (.exe)** (Ultra-fast Windows executable generator)
> 3. **API Tester** (Interactive REST/HTTP client)
> 4. **Regex Studio** (Real-time regex evaluator & match inspector)
> 5. **Code Formatter** (Multi-language beautifier)

---

## Proposed Changes

### 1. Tools Studio Cleanup & New Tools
#### [src/components/tools/ToolsStudioView.tsx]
- Remove `FileManagerTool` tab and button from Tools Studio.
- Add tabs for:
  - `API Tester`
  - `Regex Studio`
  - `Code Formatter`
- Update tool overview cards to showcase the new developer suite with compact, minimal cards.

#### [NEW: src/components/tools/ApiTesterTool.tsx]
- Full-featured REST client:
  - Method selector (GET, POST, PUT, PATCH, DELETE, HEAD)
  - URL input with query parameter builder
  - Headers editor (key-value table)
  - Request body (JSON, text, raw)
  - Send request via server-side proxy route to avoid CORS errors (`/api/tools/proxy-request`)
  - Response viewer: status badge (200 OK, 404, etc.), roundtrip latency (ms), response size, formatted response body, and response headers.

#### [NEW: src/components/tools/RegexStudioTool.tsx]
- Real-time regular expression tester:
  - Pattern input with regex flags toggles (`g`, `i`, `m`, `s`, `u`)
  - Test string editor with real-time highlighted match spans
  - Captured groups table with index ranges
  - Regex replace / substitution simulator
  - Preset library (Email, URL, IP address, UUID, Phone, Hex color, Dates)

#### [NEW: src/components/tools/CodeFormatterTool.tsx]
- Multi-language formatter:
  - Supports HTML, CSS, JavaScript, TypeScript, JSON, and SQL
  - Configurable indent spacing (2 spaces, 4 spaces, tabs)
  - Instant formatting, copy to clipboard, and file download

#### [server.ts]
- Add `/api/tools/proxy-request` to safely proxy external API requests for the API Tester without CORS limitations.

---

### 2. Full VS Code-Style Codex IDE
#### [src/components/CodexWorkspaceView.tsx]
- Redesign layout into an authentic VS Code interface:
  - **Left Activity Bar** (Explorer, Search, AI Architect, Settings)
  - **Collapsible Sidebar**:
    - **Explorer**: Direct "Open Folder" button, project root label, nested tree with folder expand/collapse, file icons (HTML, CSS, JS, TS, JSON, images), new file / new folder buttons.
    - **Search**: Search across workspace files.
    - **AI Assistant**: Streamlined prompt bar, multi-file code generator with step-by-step progress cards.
  - **Editor Workspace**:
    - Top editor tabs with dirty indicators and close buttons (`x`).
    - File breadcrumb header (`project > src > App.tsx`).
    - Monaco/VS Code-style dark code area with line numbering gutter, auto-indent, code formatting shortcut.
  - **Split Live Preview**:
    - Right-side docking or split view with instant iframe reload.
    - Responsive device toolbar (Desktop 100%, Tablet 768px, Mobile 375px).
    - Quick actions: Open in new tab, restart sandbox, console drawer.
  - **Bottom Status Bar**:
    - File path, line/col numbers, UTF-8, Language mode, Gemini Model badge, and Shaheer Developer badge.

---

### 3. Lag-Free, Minimal Clean UI Across Tabs
#### [src/components/ChatMessageItem.tsx & src/components/ChatView.tsx]
- Remove repetitive marketing text blocks and bloated informational banners that clog the feed.
- Optimize Markdown rendering and message item DOM trees to prevent scroll stuttering and chat lag.
- Clean compact bubble design with clear code blocks and instant action buttons.

---

## Verification Plan

### Automated Verification
1. **Compilation**: Run `compile_applet` to verify clean build without TypeScript or JSX errors.
2. **Linting**: Run `lint_applet` to check strict typing, unused imports, and syntax correctness.

### Functional Verification
1. **Tools Studio**:
   - Verify File Commander is removed.
   - Verify API Tester sends requests and displays status/headers/body accurately.
   - Verify Regex Studio highlights matches in real time.
   - Verify Code Formatter formats HTML, CSS, JS, and JSON accurately.
2. **VS Code Codex IDE**:
   - Click "Open Folder" to verify folder loading, auto-expanding tree, tab opening, and live preview rendering.
   - Generate code to verify step-by-step multi-file generation with Gemini.
3. **UI Performance**:
   - Verify chat view is snappy with zero lag and clean typography.
