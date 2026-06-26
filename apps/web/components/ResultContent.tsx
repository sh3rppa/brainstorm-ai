import { Icon } from "@/components/icons";
import type { ResultTab } from "@/components/ResultsView";
import type { AiOutput } from "@/types/domain";

type ResultContentProps = {
  output: AiOutput;
  tab: ResultTab;
};

export function ResultContent({ output, tab }: ResultContentProps) {
  if (tab === "ideas") {
    return (
      <>
        <p className="eyebrow">Ordered by relevance</p>
        <h2>The strongest ideas</h2>
        <div className="idea-list">
          {output.keyIdeas.map((idea, index) => (
            <article className="idea-row" key={idea.title}>
              <div className="idea-number">{index + 1}</div>
              <div>
                <h3>{idea.title}</h3>
                <p>{idea.detail}</p>
              </div>
              <span className={`priority ${idea.priority}`}>{idea.priority}</span>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (tab === "diagram") {
    return (
      <>
        <p className="eyebrow">Generated flow</p>
        <h2>From raw idea to next iteration</h2>
        <div className="diagram">
          <div className="diagram-flow">
            {output.diagram.nodes.map((node, index) => (
              <div className="diagram-step" key={node}>
                {index > 0 ? <Icon className="diagram-arrow" name="arrowRight" /> : null}
                <div className="diagram-node">{node}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (tab === "code") {
    return (
      <>
        <p className="eyebrow">Starter component</p>
        <h2>A useful first building block</h2>
        <pre className="code-block">
          <code>{output.code}</code>
        </pre>
      </>
    );
  }

  if (tab === "brief") {
    return (
      <div className="brief">
        <p className="eyebrow">Project brief</p>
        <h2>A clear starting point</h2>
        <div className="brief-meta">
          <div className="meta-card">
            <span>Stage</span>
            <strong>Concept validation</strong>
          </div>
          <div className="meta-card">
            <span>Timebox</span>
            <strong>Two weeks</strong>
          </div>
          <div className="meta-card">
            <span>Primary goal</span>
            <strong>Complete core workflow</strong>
          </div>
        </div>
        <p>{output.projectBrief}</p>
        <h3>Suggested next steps</h3>
        <ul className="list-clean">
          {output.suggestedNextSteps.map((item) => (
            <li key={item}>
              <Icon name="arrowRight" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">Executive summary</p>
      <h2>What this session is really about</h2>
      <p className="lead">{output.summary}</p>
      <div className="split">
        <div>
          <h3>Action items</h3>
          <ul className="list-clean">
            {output.actionItems.map((item) => (
              <li key={item}>
                <Icon name="check" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Suggested next steps</h3>
          <ul className="list-clean">
            {output.suggestedNextSteps.map((item) => (
              <li key={item}>
                <Icon name="arrowRight" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

