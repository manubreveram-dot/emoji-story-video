import React from "react";
import type { GenerationPhase, WizardStepV2 } from "../../types/workflow-v2";

const STEPS: Array<{
  id: WizardStepV2;
  label: string;
  caption: string;
}> = [
  { id: "idea", label: "01", caption: "Inicio" },
  { id: "script-lab", label: "02", caption: "Guion" },
  { id: "visual-review", label: "03", caption: "Fotos" },
  { id: "render-download", label: "04", caption: "Render" },
];

type WizardShellProps = {
  children: React.ReactNode;
  currentStep: WizardStepV2;
  phase: GenerationPhase;
  title: string;
  subtitle: string;
  badge?: string;
  onReset?: () => void;
};

export const WizardShell: React.FC<WizardShellProps> = ({
  children,
  currentStep,
  phase,
  title,
  subtitle,
  badge,
  onReset,
}) => {
  const phaseLabel =
    phase === "script"
      ? "Generando guion"
      : phase === "visuals"
        ? "Generando fotos"
        : phase === "render"
          ? "Renderizando video"
          : "Listo";

  const currentIndex = STEPS.findIndex((item) => item.id === currentStep);

  return (
    <div className="wizard-shell">
      <div className="wizard-frame">
        <header className="wizard-header">
          <div className="wizard-header-copy">
            <h1>{title}</h1>
            <p className="wizard-subtitle">{subtitle}</p>
          </div>

          <div className="wizard-header-meta">
            {badge ? <span className="wizard-badge">{badge}</span> : null}
            <span className={`phase-pill phase-${phase}`}>{phaseLabel}</span>
            {onReset ? (
              <button
                type="button"
                className="secondary-button reset-button"
                onClick={onReset}
              >
                Comenzar de cero
              </button>
            ) : null}
          </div>
        </header>

        <nav className="wizard-steps" aria-label="Workflow steps">
          {STEPS.map((step, index) => {
            const state =
              step.id === currentStep
                ? "active"
                : index < currentIndex
                  ? "done"
                  : "idle";

            return (
              <div key={step.id} className={`wizard-step wizard-step-${state}`}>
                <div className="wizard-step-top">
                  <span className="wizard-step-index">{step.label}</span>
                </div>
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
