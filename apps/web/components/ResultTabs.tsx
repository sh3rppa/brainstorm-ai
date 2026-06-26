import type { ResultTab } from "@/components/ResultsView";

type ResultTabsProps = {
  activeTab: ResultTab;
  onChange: (tab: ResultTab) => void;
};

const tabs: Array<{ id: ResultTab; label: string }> = [
  { id: "summary", label: "Executive summary" },
  { id: "ideas", label: "Priority ideas" },
  { id: "diagram", label: "Diagram" },
  { id: "code", label: "Generated code" },
  { id: "brief", label: "Project brief" },
];

export function ResultTabs({ activeTab, onChange }: ResultTabsProps) {
  return (
    <div className="result-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className={`tab ${activeTab === tab.id ? "active" : ""}`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

