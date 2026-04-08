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
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Static Frontend Tool</span>
          <h1>HTML Studio</h1>
          <p>
            A fast, client-only workspace for editing uploaded HTML visually or splitting one file into reusable parts.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-pill">Next.js App Router</div>
          <div className="meta-pill">Static Export Ready</div>
          <div className="meta-pill">Vercel and Netlify Friendly</div>
        </div>
      </section>

      <section className="tool-shell">
        <div className="tab-bar" role="tablist" aria-label="HTML tools">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tool-description">
          <p>{activeDescription}</p>
        </div>

        <div className="tool-panel">
          {activeTab === "editor" ? <HtmlEditorTool /> : <HtmlSplitterTool />}
        </div>
      </section>
    </main>
  );
}
