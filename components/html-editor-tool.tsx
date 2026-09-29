"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type DeviceMode = "desktop" | "tablet" | "mobile";

const EDITOR_SCRIPT = String.raw`
(function () {
  const editableSelector = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "a",
    "button",
    "label",
    "small",
    "strong",
    "em",
    "b",
    "i",
    "figcaption",
    "blockquote",
    "li",
    "td",
    "th",
    "[data-html-studio-editable='true']"
  ].join(",");
  let editMode = false;
  let selected = null;
  let previousSpellcheck = null;

  function placeCaretAtPoint(element, clientX, clientY) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    let range = null;

    if (document.caretPositionFromPoint) {
      const caretPosition = document.caretPositionFromPoint(clientX, clientY);
      if (caretPosition && element.contains(caretPosition.offsetNode)) {
        range = document.createRange();
        range.setStart(caretPosition.offsetNode, caretPosition.offset);
        range.collapse(true);
      }
    } else if (document.caretRangeFromPoint) {
      const caretRange = document.caretRangeFromPoint(clientX, clientY);
      if (caretRange && element.contains(caretRange.startContainer)) {
        range = caretRange;
        range.collapse(true);
      }
    }

    if (!range) {
      range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function hasOwnText(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    return Array.from(element.childNodes).some(function (node) {
      return node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0;
    });
  }

  function findEditableElement(node) {
    if (!(node instanceof Node)) {
      return null;
    }

    let current = node instanceof HTMLElement ? node : node.parentElement;

    while (current && current !== document.body) {
      if (current.matches(editableSelector)) {
        return current;
      }

      if (hasOwnText(current) && !current.closest("script,style")) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function clearSelection() {
    if (selected) {
      selected.classList.remove("__htmlstudio-selected");
      selected.removeAttribute("contenteditable");
      if (previousSpellcheck === null) {
        selected.removeAttribute("spellcheck");
      } else {
        selected.setAttribute("spellcheck", previousSpellcheck);
      }
      selected = null;
      previousSpellcheck = null;
    }
  }

  function selectElement(element, clientX, clientY) {
    clearSelection();
    selected = element;
    previousSpellcheck = selected.getAttribute("spellcheck");
    selected.classList.add("__htmlstudio-selected");
    selected.setAttribute("contenteditable", "true");
    selected.setAttribute("spellcheck", "false");
    selected.focus();

    if (typeof clientX === "number" && typeof clientY === "number") {
      placeCaretAtPoint(selected, clientX, clientY);
      return;
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(selected);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function notifyUpdate() {
    window.parent.postMessage({ type: "HTML_STUDIO_DOC_UPDATED" }, "*");
  }

  function setEditMode(nextEditMode) {
    editMode = nextEditMode;
    document.body.classList.toggle("__htmlstudio-edit-mode", editMode);
    if (!editMode) {
      clearSelection();
      document.querySelectorAll("[contenteditable]").forEach(function (element) {
        element.removeAttribute("contenteditable");
      });
    }
  }

  function protectWhenViewMode(event) {
    if (editMode) {
      return;
    }

    const target = findEditableElement(event.target);
    if (!target) {
      return;
    }

    if (target.hasAttribute("contenteditable")) {
      target.removeAttribute("contenteditable");
    }
  }

  document.addEventListener("click", function (event) {
    if (!editMode) {
      protectWhenViewMode(event);
      return;
    }
    const target = findEditableElement(event.target);
    if (!(target instanceof HTMLElement)) {
      clearSelection();
      return;
    }

    if (selected === target) {
      selected.setAttribute("contenteditable", "true");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    selectElement(target, event.clientX, event.clientY);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (!editMode) {
      protectWhenViewMode(event);
      return;
    }

    const target = findEditableElement(event.target);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (selected !== target) {
      selectElement(target);
    }
  }, true);

  document.addEventListener("dblclick", function (event) {
    if (!editMode) {
      return;
    }
    const target = event.target instanceof HTMLElement ? event.target.closest("a") : null;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const nextHref =
      window.prompt("Edit link URL", target.getAttribute("href") || "") ??
      (target.getAttribute("href") || "");
    target.setAttribute("href", nextHref);
    notifyUpdate();
  }, true);

  document.addEventListener("input", function () {
    if (!editMode) {
      return;
    }
    notifyUpdate();
  }, true);

  document.addEventListener("blur", function (event) {
    if (!editMode) {
      return;
    }
    if (selected && event.target === selected) {
      notifyUpdate();
    }
  }, true);

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "HTML_STUDIO_SET_EDIT_MODE") {
      return;
    }
    setEditMode(Boolean(event.data.value));
  });

  document.addEventListener("focusin", function (event) {
    if (editMode) {
      return;
    }

    const target = findEditableElement(event.target);
    if (target instanceof HTMLElement) {
      target.blur();
    }
  }, true);

  window.parent.postMessage({ type: "HTML_STUDIO_READY" }, "*");
})();
`;

const EDITOR_STYLE = String.raw`
html {
  min-height: 100%;
}

body.__htmlstudio-edit-mode {
  cursor: text;
}

body.__htmlstudio-edit-mode a,
body.__htmlstudio-edit-mode button,
body.__htmlstudio-edit-mode h1,
body.__htmlstudio-edit-mode h2,
body.__htmlstudio-edit-mode h3,
body.__htmlstudio-edit-mode h4,
body.__htmlstudio-edit-mode h5,
body.__htmlstudio-edit-mode h6,
body.__htmlstudio-edit-mode p,
body.__htmlstudio-edit-mode span {
  outline: 1px dashed rgba(16, 88, 255, 0.22);
  outline-offset: 2px;
}

.__htmlstudio-selected {
  outline: 2px solid #1058ff !important;
  outline-offset: 2px !important;
}
`;

function injectEditorSupport(html: string) {
  if (!html.trim()) {
    return "";
  }

  const styleTag = `<style data-html-studio-helper="style">${EDITOR_STYLE}</style>`;
  const scriptTag = `<script data-html-studio-helper="script">${EDITOR_SCRIPT}<\/script>`;
  let output = html;

  if (output.includes("</head>")) {
    output = output.replace("</head>", `${styleTag}</head>`);
  } else if (output.includes("</body>")) {
    output = output.replace("</body>", `${styleTag}</body>`);
  } else {
    output = `${output}${styleTag}`;
  }

  if (output.includes("</body>")) {
    output = output.replace("</body>", `${scriptTag}</body>`);
  } else {
    output = `${output}${scriptTag}`;
  }

  return output;
}

function makeDownload(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getBaseName(fileName: string) {
  return fileName.replace(/\.html?$/i, "") || "document";
}

export function HtmlEditorTool() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [fileName, setFileName] = useState("document.html");
  const [sourceHtml, setSourceHtml] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [status, setStatus] = useState("Upload an HTML file to begin visual editing.");

  const previewHtml = useMemo(() => injectEditorSupport(sourceHtml), [sourceHtml]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (event.data?.type === "HTML_STUDIO_READY") {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "HTML_STUDIO_SET_EDIT_MODE",
            value: editMode
          },
          "*"
        );
      }

      if (event.data?.type === "HTML_STUDIO_DOC_UPDATED") {
        setStatus("Edits are reflected in the live preview and ready for export.");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "HTML_STUDIO_SET_EDIT_MODE",
        value: editMode
      },
      "*"
    );
  }, [editMode, previewHtml]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
      setStatus("Please upload an HTML file only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const html = typeof reader.result === "string" ? reader.result : "";
      setFileName(file.name);
      setSourceHtml(html);
      setEditMode(false);
      setStatus("HTML loaded. Click Edit, then select elements in the preview to change them.");
    };
    reader.readAsText(file);
  }

  function handleDownload() {
    const doc = iframeRef.current?.contentDocument;

    if (!doc) {
      setStatus("Load an HTML file before downloading.");
      return;
    }

    const clonedRoot = doc.documentElement.cloneNode(true) as HTMLElement;
    clonedRoot.querySelectorAll("[data-html-studio-helper]").forEach((node) => node.remove());
    clonedRoot.querySelectorAll(".__htmlstudio-selected").forEach((node) => {
      node.classList.remove("__htmlstudio-selected");
    });
    clonedRoot.removeAttribute("contenteditable");
    clonedRoot.querySelectorAll("[contenteditable]").forEach((node) => {
      node.removeAttribute("contenteditable");
    });

    const fullHtml = `<!DOCTYPE html>\n${clonedRoot.outerHTML}`;
    makeDownload(`${getBaseName(fileName)}-edited.html`, fullHtml, "text/html;charset=utf-8");
    setStatus("Edited HTML downloaded as one complete file.");
  }

  function handleStartEditing() {
    setEditMode(true);
    setStatus("Edit mode on. Click an element in the preview to edit it.");
  }

  function handleSaveChanges() {
    setEditMode(false);
    setStatus("Changes saved in the preview. Download the edited HTML to export your file.");
  }

  return (
    <div className="editor-tool">
      <div className="upload-card">
        <div className="upload-copy">
          <span className="section-kicker">01 / SOURCE FILE</span>
          <h2>Bring your page in.</h2>
          <p>Choose a complete HTML document to start editing.</p>
        </div>
        <div className="upload-control">
          <label className="upload-field">
            <span>Choose HTML file</span>
            <input type="file" accept=".html,text/html" onChange={handleUpload} />
          </label>
          <p className="support-text" role="status" aria-live="polite">{status}</p>
        </div>
      </div>

      <div className="preview-stage">
        <div className="preview-header">
          <div>
            <span className="section-kicker">02 / CANVAS</span>
            <h2>Live preview</h2>
          </div>
          <span className={`preview-state ${sourceHtml ? "loaded" : ""}`}>
            <span className="preview-state-dot" aria-hidden="true" />
            {sourceHtml ? "Page loaded" : "Waiting for a file"}
          </span>
        </div>
        <div className={`device-frame ${deviceMode}`}>
          {sourceHtml ? (
            <iframe
              ref={iframeRef}
              title="Live HTML preview"
              sandbox="allow-same-origin allow-scripts"
              srcDoc={previewHtml}
              className="preview-iframe"
            />
          ) : (
            <div className="empty-state">
              <div className="empty-mark" aria-hidden="true">
                <span>&lt;</span><i /><span>/&gt;</span>
              </div>
              <h3>Your page starts here</h3>
              <p>Choose an HTML file above to see it rendered in your canvas.</p>
            </div>
          )}
        </div>
      </div>

      <div className="floating-toolbar">
        <div className="device-switcher" role="group" aria-label="Preview size">
          <span className="control-label">VIEW</span>
          {(["desktop", "tablet", "mobile"] as DeviceMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`toolbar-button device-button ${deviceMode === mode ? "active" : ""}`}
              onClick={() => setDeviceMode(mode)}
              aria-pressed={deviceMode === mode}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="edit-actions">
          <button
            type="button"
            className={`toolbar-button ${editMode ? "active" : ""}`}
            onClick={handleStartEditing}
            aria-pressed={editMode}
            disabled={!sourceHtml || editMode}
          >
            Edit
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={handleSaveChanges}
            disabled={!sourceHtml || !editMode}
          >
            Save changes
          </button>
          <button
            type="button"
            className="toolbar-button primary"
            onClick={handleDownload}
            disabled={!sourceHtml || editMode}
          >
            Download HTML <span aria-hidden="true">↓</span>
          </button>
        </div>
      </div>
    </div>
  );
}
