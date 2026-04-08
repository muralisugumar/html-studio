"use client";

import { ChangeEvent, useState } from "react";

type SectionOutput = {
  label: string;
  fileName: string;
  html: string;
};

function formatStyleBlocks(doc: Document) {
  return Array.from(doc.querySelectorAll("style"))
    .map((styleTag) => styleTag.outerHTML.trim())
    .filter(Boolean)
    .join("\n\n");
}

function formatScriptBlocks(doc: Document) {
  return Array.from(doc.querySelectorAll("script:not([src])"))
    .map((scriptTag) => scriptTag.outerHTML.trim())
    .filter(Boolean)
    .join("\n\n");
}

function getSectionLabel(element: HTMLElement, index: number) {
  const tagName = element.tagName.toLowerCase();
  const namedAttribute =
    element.getAttribute("id") ||
    element.getAttribute("data-name") ||
    element.getAttribute("data-section") ||
    element.getAttribute("aria-label") ||
    element.getAttribute("title");

  if (namedAttribute) {
    return namedAttribute;
  }

  const heading = element.querySelector("h1, h2, h3, h4, h5, h6");
  if (heading?.textContent?.trim()) {
    return heading.textContent.trim();
  }

  if (element.className && typeof element.className === "string") {
    return `${tagName}.${element.className.trim().replace(/\s+/g, ".")}`;
  }

  return `${tagName}-${index + 1}`;
}

function getSectionFileName(element: HTMLElement, label: string, index: number) {
  const preferredName = element.getAttribute("id") || label;

  return slugifySectionLabel(preferredName, index);
}

function slugifySectionLabel(label: string, index: number) {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `section-${index + 1}`;
}

function downloadFile(filename: string, content: string, type: string) {
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

export function HtmlSplitterTool() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlBody, setHtmlBody] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [sections, setSections] = useState<SectionOutput[]>([]);
  const [status, setStatus] = useState("Upload an HTML file and process it to extract each output.");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    if (nextFile && !/\.html?$/i.test(nextFile.name) && nextFile.type !== "text/html") {
      setStatus("Please upload an HTML file only.");
      setFile(null);
      return;
    }

    setFile(nextFile);
    setStatus(
      nextFile
        ? "File ready. Click Process File to extract HTML, CSS, JS, and sections."
        : "Upload an HTML file and process it to extract each output."
    );
  }

  function handleProcess() {
    if (!file) {
      setStatus("Choose an HTML file before processing.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      const bodyContent = doc.body?.innerHTML.trim() ?? "";
      const cssContent = formatStyleBlocks(doc);
      const jsContent = formatScriptBlocks(doc);

      let extractedSections = Array.from(doc.querySelectorAll("section")).map((section, index) => {
        const htmlSection = section as HTMLElement;
        const label = getSectionLabel(htmlSection, index);
        return {
          label,
          fileName: getSectionFileName(htmlSection, label, index),
          html: htmlSection.outerHTML.trim()
        };
      });

      if (!extractedSections.length && doc.body) {
        extractedSections = Array.from(doc.body.children).map((element, index) => {
          const htmlElement = element as HTMLElement;
          const label = getSectionLabel(htmlElement, index);
          return {
            label,
            fileName: getSectionFileName(htmlElement, label, index),
            html: htmlElement.outerHTML.trim()
          };
        });
      }

      setHtmlBody(bodyContent);
      setCss(cssContent);
      setJs(jsContent);
      setSections(extractedSections);
      setStatus("HTML processed. Each output is ready to review or download.");
    };

    reader.readAsText(file);
  }

  const baseName = getBaseName(file?.name ?? "document");

  return (
    <div className="splitter-tool">
      <div className="splitter-actions">
        <label className="upload-field">
          <span>Upload HTML File</span>
          <input type="file" accept=".html,text/html" onChange={handleFileChange} />
        </label>
        <button type="button" className="process-button" onClick={handleProcess} disabled={!file}>
          Process File
        </button>
      </div>

      <p className="support-text">{status}</p>

      <div className="output-grid">
        <OutputPanel
          title="HTML Body Content"
          content={htmlBody}
          emptyMessage="No body content extracted yet."
          onDownload={() => downloadFile(`${baseName}-body.html`, htmlBody, "text/html;charset=utf-8")}
          downloadLabel="Download HTML"
        />

        <OutputPanel
          title="CSS"
          content={css}
          emptyMessage="No inline style blocks found."
          onDownload={() => downloadFile(`${baseName}-styles.html`, css, "text/html;charset=utf-8")}
          downloadLabel="Download CSS"
        />

        <OutputPanel
          title="JS"
          content={js}
          emptyMessage="No inline script blocks found."
          onDownload={() => downloadFile(`${baseName}-scripts.html`, js, "text/html;charset=utf-8")}
          downloadLabel="Download JS"
        />

        <OutputPanel
          title="HTML Sections"
          content=""
          emptyMessage="No sections extracted yet."
          customContent={
            sections.length ? (
              <div className="section-list">
                {sections.map((section, index) => (
                  <article key={`${section.label}-${index}`} className="section-card">
                    <div className="section-card-header">
                      <h4>{section.label}</h4>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          downloadFile(
                            `${baseName}-${section.fileName || slugifySectionLabel(section.label, index)}.html`,
                            section.html,
                            "text/html;charset=utf-8"
                          )
                        }
                      >
                        Download Section
                      </button>
                    </div>
                    <pre>{section.html}</pre>
                  </article>
                ))}
              </div>
            ) : undefined
          }
          onDownload={() => undefined}
          downloadLabel="Download Sections"
        />
      </div>
    </div>
  );
}

type OutputPanelProps = {
  title: string;
  content: string;
  emptyMessage: string;
  onDownload: () => void;
  downloadLabel: string;
  customContent?: React.ReactNode;
};

function OutputPanel({ title, content, emptyMessage, onDownload, downloadLabel, customContent }: OutputPanelProps) {
  return (
    <section className="output-panel">
      <div className="output-panel-header">
        <h3>{title}</h3>
        {!customContent ? (
          <button type="button" className="secondary-button" onClick={onDownload} disabled={!content}>
            {downloadLabel}
          </button>
        ) : null}
      </div>
      {customContent ?? <pre>{content || emptyMessage}</pre>}
    </section>
  );
}
