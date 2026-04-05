import React, { useState } from "react";

const ART_STYLES = [
  { id: "cinematic spiritual realism", label: "Cinematic" },
  { id: "minimal symbolic illustration", label: "Minimal" },
  { id: "editorial 3d surrealism", label: "3D Editorial" },
  { id: "soft watercolor storytelling", label: "Watercolor" },
  { id: "anime dramatic key art", label: "Anime" },
  { id: "neo noir devotional poster", label: "Neo Noir" },
];

type IdeaStudioProps = {
  initialIdea: string;
  initialStyle: string;
  initialBudgetCapUsd: number;
  initialUseVeo: boolean;
  isLoading: boolean;
  onSubmit: (payload: {
    idea: string;
    artStyle: string;
    budgetCapUsd: number;
    useVeo: boolean;
  }) => void;
};

export const IdeaStudio: React.FC<IdeaStudioProps> = ({
  initialIdea,
  initialStyle,
  initialBudgetCapUsd,
  initialUseVeo,
  isLoading,
  onSubmit,
}) => {
  const [idea, setIdea] = useState(initialIdea);
  const [artStyle, setArtStyle] = useState(initialStyle);
  const [budgetCapUsd, setBudgetCapUsd] = useState(initialBudgetCapUsd);
  const [useVeo, setUseVeo] = useState(initialUseVeo);

  const canSubmit = idea.trim().length >= 12 && !isLoading;

  return (
    <div className="wizard-grid wizard-grid-hero">
      <section className="panel hero-panel">
        <p className="eyebrow">Idea Studio</p>
        <h2>De idea suelta a guion controlado, sin quemar presupuesto.</h2>
        <p className="lead">
          Define la premisa, el look y el cap de costo antes de gastar tokens.
          El pipeline V2 generara 10 frases, las condensara en 4 actos visuales
          y solo usara Veo si sigue dentro del presupuesto.
        </p>

        <label className="field">
          <span>Idea del video</span>
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Ej: Un video breve sobre disciplina interior, silencio mental y direccion de vida."
            rows={7}
          />
        </label>

        <div className="style-grid">
          {ART_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              className={`style-pill ${artStyle === style.id ? "style-pill-active" : ""}`}
              onClick={() => setArtStyle(style.id)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="panel aside-panel">
        <div className="budget-card">
          <p className="eyebrow">Costo objetivo</p>
          <strong>US$ {budgetCapUsd.toFixed(2)}</strong>
          <span>
            Default ahorro. Si Veo rompe este cap, el sistema cae a modo
            Remotion sin romper el flujo.
          </span>
        </div>

        <label className="field">
          <span>Cap de costo (USD)</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={budgetCapUsd}
            onChange={(event) => setBudgetCapUsd(Number(event.target.value))}
          />
        </label>

        <label className="toggle-row">
          <div>
            <strong>Intentar clip Veo hero</strong>
            <span>
              Se intentara solo si no excede el cap.
            </span>
          </div>
          <button
            type="button"
            className={`toggle-button ${useVeo ? "toggle-button-on" : ""}`}
            onClick={() => setUseVeo((value) => !value)}
          >
            <span />
          </button>
        </label>

        <div className="stat-grid">
          <div className="stat-card">
            <span>Frases</span>
            <strong>10</strong>
          </div>
          <div className="stat-card">
            <span>Visuales</span>
            <strong>4</strong>
          </div>
          <div className="stat-card">
            <span>Hero clip</span>
            <strong>{useVeo ? "1" : "0"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              idea,
              artStyle,
              budgetCapUsd,
              useVeo,
            })
          }
        >
          {isLoading ? "Generando guion V2..." : "Generar script lab"}
        </button>
      </aside>
    </div>
  );
};
