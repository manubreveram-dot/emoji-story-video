import React from "react";

type ProgressItem = {
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
};

type JobProgressListProps = {
  title: string;
  items: ProgressItem[];
  compact?: boolean;
};

export const JobProgressList: React.FC<JobProgressListProps> = ({
  title,
  items,
  compact = false,
}) => {
  return (
    <section className="panel panel-muted">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h3>{title}</h3>
        </div>
      </div>

      <div className={`progress-list ${compact ? "progress-list-compact" : ""}`}>
        {items.map((item) => (
          <div key={item.label} className={`progress-row status-${item.status}`}>
            <div className="progress-copy">
              <strong>{item.label}</strong>
              {item.detail ? <span>{item.detail}</span> : null}
            </div>
            <span className={`status-chip status-chip-${item.status}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
