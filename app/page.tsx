"use client";

import { useMemo, useState } from "react";
import { HtmlEditorTool } from "../components/html-editor-tool";
import { HtmlSplitterTool } from "../components/html-splitter-tool";

type ToolTab = "editor" | "splitter";

const tabs: Array<{ id: ToolTab; label: string; description: string }> = [
  {
    id: "editor",
    label: "Live HTML Editor",
    description: "Upload a full HTML file, edit it directly on the page, and export one complete HTML file."
  },
  {
    id: "splitter",
    label: "HTML Splitter",
    description: "Upload an HTML file and separate body, CSS, JavaScript, and sections into clean outputs."
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ToolTab>("editor");

  const activeDescription = useMemo(
    () => tabs.find((tab) => tab.id === activeTab)?.description ?? "",
    [activeTab]
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="HTML Studio home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
              <path d="M8 11.5 13.5 18 8 24.5M18 25h10" />
              <path d="M18 7v22" className="brand-mark-accent" />
            </svg>
          </span>
          <span>HTML <strong>STUDIO</strong></span>
        </a>
        <span className="header-note">
          <span className="online-indicator" aria-hidden="true" />
          Runs in your browser
        </span>
      </header>

      <section className="hero-card">
        <div className="hero-copy">
          <h1>HTML Studio</h1>
          <p>
            A fast, client-only workspace for editing uploaded HTML visually or splitting one file into reusable parts.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-pill">Next.js App Router</div>
          <div className="meta-pill">Static Export Ready</div>
        </div>
      </section>

      <section className="tool-shell">
        <div className="workspace-topline">
          <span className="workspace-label">YOUR WORKSPACE</span>
          <span className="workspace-local">Private by design</span>
        </div>

        <div className="workspace-navigation">
          <div className="tab-bar" role="tablist" aria-label="HTML tools">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="tool-content"
                id={`tab-${tab.id}`}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={`tab-icon ${tab.id}`} aria-hidden="true">
                  {tab.id === "editor" ? "</>" : "↗"}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <p className="tool-description">{activeDescription}</p>
        </div>

        <div
          className="tool-panel"
          id="tool-content"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === "editor" ? <HtmlEditorTool /> : <HtmlSplitterTool />}
        </div>
      </section>

      <footer className="app-footer">
        <span>
          HTML Studio • Crafted with precision by{" "}
          <a href="https://muralisugumar.com/">Murali Sugumar</a>
        </span>
      </footer>
    </main>
  );
}
