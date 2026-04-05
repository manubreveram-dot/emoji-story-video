import React from "react";
import type { GenerationPhase, WizardStepV2 } from "../../types/workflow-v2";

const STEPS: Array<{ id: WizardStepV2; label: string; caption: string }> = [
  { id: "idea", label: "01", caption: "Idea Studio" },
  { id: "script-lab", label: "02", caption: "Script Lab" },
  { id: "visual-review", label: "03", caption: "Visual Review" },
  { id: "render-download", label: "04", caption: "Render & Download" },
];

type WizardShellProps = {
  children: React.ReactNode;
  currentStep: WizardStepV2;
  phase: GenerationPhase;
  title: string;
  subtitle: string;
  badge?: string;
};

export const WizardShell: React.FC<WizardShellProps> = ({
  children,
  currentStep,
  phase,
  title,
  subtitle,
  badge,
}) => {
  return (
    <div className="wizard-shell">
      <div className="wizard-backdrop wizard-backdrop-left" />
      <div className="wizard-backdrop wizard-backdrop-right" />

      <div className="wizard-frame">
        <header className="wizard-header">
          <div>
            <p className="wizard-kicker">Emoji Story Video v2</p>
            <h1>{title}</h1>
            <p className="wizard-subtitle">{subtitle}</p>
          </div>

          <div className="wizard-header-meta">
            {badge ? <span className="wizard-badge">{badge}</span> : null}
            <span className={`phase-pill phase-${phase}`}>{phase}</span>
          </div>
        </header>

        <nav className="wizard-steps" aria-label="Workflow steps">
          {STEPS.map((step, index) => {
            const state =
              step.id === currentStep
                ? "active"
                : STEPS.findIndex((item) => item.id === currentStep) > index
                  ? "done"
                  : "idle";

            return (
              <div key={step.id} className={`wizard-step wizard-step-${state}`}>
                <span className="wizard-step-index">{step.label}</span>
                <span className="wizard-step-label">{step.caption}</span>
              </div>
            );
          })}
        </nav>

        <main className="wizard-content">{children}</main>
      </div>
    </div>
  );
};
