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
  const statusLabel: Record<ProgressItem["status"], string> = {
    pending: "pendiente",
    running: "en curso",
    done: "listo",
    error: "error",
  };

  return (
    <section className="panel panel-light panel-muted job-progress-card">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Estado</p>
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
              {statusLabel[item.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
