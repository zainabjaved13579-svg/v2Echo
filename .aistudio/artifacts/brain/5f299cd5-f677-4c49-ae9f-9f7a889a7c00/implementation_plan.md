# Implementation Plan: File Manager Tool Enhancements

Upgrade Sapphire File Commander into a professional, IDE-grade local file manager and AI workspace with hierarchical folder navigation, multi-tab editing, side-by-side AI diff preview, one-click code formatting, and full-workspace ZIP export.

---

## 1. User Requirements & Feature Scope
- **Domain**: Developer Console / SaaS Productivity Tool (File Manager, Local Disk Commander & AI Code Modifier).
- **Core User Goal**: Allow users to seamlessly browse, organize, edit, and AI-refactor files and folders on their laptop with zero friction, clear visual feedback, and reliable disk sync.
- **Key Enhancements**:
  1. **Hierarchical Tree & Breadcrumb Navigation**:
     - Nested folder tree navigation (expand/collapse directories) with clean folder/file icons.
     - Breadcrumb navigation path above the editor (e.g. `Laptop / src / components / app.js`).
     - "+ New File" and "+ New Folder" direct creation within any subfolder.
  2. **Multi-Tab Workspace**:
     - Tab bar above editor showing currently opened files with close buttons (`×`) and unsaved change indicators (`•`).
     - Quick tab switching and keyboard shortcuts (`Ctrl+S` to save).
  3. **Enhanced Code Editor**:
     - Line numbers with synchronized scrolling.
     - Syntax beautification / auto-formatter for JSON, JavaScript, HTML, CSS, and Markdown.
     - Line and character statistics, search in file with highlight.
     - Direct "Copy All" and "Download File" actions.
  4. **Side-by-Side AI Diff & Review**:
     - Visual diff viewer comparing "Original" vs. "AI Modified" before applying changes.
     - Instant preview of suggested filename and folder path changes.
     - Pre-packaged AI actions:
       * **Format Conversion**: CSV ↔ JSON, Markdown ↔ HTML, JSON ↔ YAML, JS ↔ TS.
       * **Code Refactoring & Bug Fix**: Analyze syntax, fix bugs, optimize logic.
       * **Auto-Documentation**: Add JSDoc, comments, and generate README.
       * **AI Smart Categorizer**: Suggest optimal folder structure and organize messy directories.
  5. **Workspace ZIP Exporter**:
     - 1-click **Export Entire Workspace (.zip)** using `JSZip` to download all files and folders in their original directory structure.
  6. **Rich Media & Binary Inspector**:
     - Enhanced image preview with zoom, dimensions, and format export.
     - Audio and video inline playback for uploaded media assets.
     - Formatted hex preview snippet and MIME inspection for binary files.

---

## 2. Architecture & Design Specifications
- **Visual Design Standard** (`frontend-design` & `references/3_saas_dashboard.md`):
  - Canvas: Dark slate (`#0B0C11` / `#151722`) in Moon theme, crisp slate-50/white in Day theme.
  - Typography: `Plus Jakarta Sans` for UI labels; `JetBrains Mono` / `font-mono` with `tabular-nums` for code, line numbers, and file sizes.
  - Zero-pill discipline: Clean typographic badges and subtle hairline borders (`border-[#292c3d]` / `border-slate-200`).
  - Strict layout integrity: 100% viewport container without clipping or scrollbar leakage.

---

## 3. Step-by-Step Implementation Steps

### Phase 1: Navigation & Workspace Structure
1. **Directory Tree Engine**:
   - Build a recursive tree data structure from `files: LocalDiskFile[]` supporting arbitrary nested folder depths.
   - Add expandable/collapsible folder nodes with persistent toggle state.
   - Implement breadcrumb path trail with clickable segment jumps.
2. **Multi-Tab State Manager**:
   - Track `openFileIds: string[]` and `activeFileId: string`.
   - Add smooth tab switching, tab close, and "Close Other Tabs" menu.
3. **Workspace File Creator**:
   - Add inline modal/input to create new files or folders in the root or any selected subfolder.

### Phase 2: Editor Enhancements & Code Beautifier
1. **Editor Toolbar & Statistics**:
   - Add line numbers gutter synchronized with textarea scroll.
   - Display line count, character count, and file encoding.
   - Add built-in JSON, JS, and CSS code auto-formatter.
2. **Keyboard Accelerators**:
   - Support `Ctrl+S` / `Cmd+S` for quick save directly to disk / memory.

### Phase 3: AI Refactor & Side-by-Side Diff Viewer
1. **Visual Diff Comparison Component**:
   - Show two-column comparison (Original vs. AI Suggestion) with color-coded diff hints.
   - Display summary of changes, proposed new filename, and proposed folder path.
   - "Apply All", "Apply Content Only", or "Discard" controls.
2. **Expanded Preset Gallery**:
   - Quick one-click prompt pills for format conversion, bug fixing, test generation, and documentation.

### Phase 4: Full Workspace ZIP Export & Binary Tools
1. **JSZip Workspace Packager**:
   - Implement `exportWorkspaceZip(files, rootName)` using JSZip.
   - Package all text, images, and binary files with their exact directory hierarchy.
2. **Media & Binary Viewer**:
   - Image preview with zoom controls and dimension detection.
   - Audio/video media player.
   - Hex inspector for arbitrary binary files.

---

## 4. Verification & Testing Plan
- Test file tree expansion/collapse with multi-level nested folders.
- Test opening multiple tabs, switching active tab, and closing tabs.
- Test line numbers and code formatting for JSON and JavaScript files.
- Test AI transformation with format changes (e.g. CSV to JSON) and verify side-by-side diff preview.
- Test "Export Workspace (.zip)" and verify all files download in correct folder hierarchy.
- Run `compile_applet` and `lint_applet` to ensure zero compilation or TypeScript errors.
