import React, { useEffect, useState } from "react";

const PHRASE_COUNT_OPTIONS = [6, 8, 10, 12, 14];
const DEFAULT_INTERNAL_STYLE = "realismo fotografico cinematografico";

type IdeaStudioProps = {
  initialIdea: string;
  initialStyle: string;
  initialBudgetCapUsd: number;
  initialUseVeo: boolean;
  initialPhraseCount: number;
  recentSessions: Array<{
    id: string;
    title: string;
    subtitle: string;
    step: "idea" | "script-lab" | "visual-review" | "render-download";
    savedAt: number;
    status: "script" | "visuals" | "render";
  }>;
  isLoading: boolean;
  onSubmit: (payload: {
    idea: string;
    artStyle: string;
    budgetCapUsd: number;
    useVeo: boolean;
    phraseCount: number;
  }) => void;
  onResumeSession: (sessionId: string) => void;
  onClearSessions: () => void;
};

function deriveArtStyle(idea: string, fallback: string): string {
  const source = idea.trim();
  if (source.length < 12) {
    return fallback || DEFAULT_INTERNAL_STYLE;
  }

  return `realismo fotografico de alta fidelidad, direccion cinematografica coherente con este contexto: ${source.slice(0, 260)}`;
}

export const IdeaStudio: React.FC<IdeaStudioProps> = ({
  initialIdea,
  initialStyle,
  initialBudgetCapUsd,
  initialUseVeo,
  initialPhraseCount,
  recentSessions,
  isLoading,
  onSubmit,
  onResumeSession,
  onClearSessions,
}) => {
  const [idea, setIdea] = useState(initialIdea);
  const [phraseCount, setPhraseCount] = useState(initialPhraseCount);
  const statusLabel: Record<"script" | "visuals" | "render", string> = {
    script: "guion",
    visuals: "fotos",
    render: "render",
  };

  useEffect(() => {
    setIdea(initialIdea);
    setPhraseCount(initialPhraseCount);
  }, [initialIdea, initialPhraseCount]);

  const canSubmit = idea.trim().length >= 14 && !isLoading;

  return (
    <div className="wizard-grid wizard-grid-hero">
      <section className="panel hero-panel panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Paso 1</p>
            <h2>Describe tu historia con tono, mensaje y atmosfera visual.</h2>
          </div>
        </div>

        <p className="lead">
          Incluye hook inicial, emocion dominante, arco narrativo y cierre.
          El sistema construira guion y prompts visuales a partir de este texto.
        </p>

        <label className="field">
          <span>Brief creativo completo</span>
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={10}
            placeholder="Ejemplo: Quiero un video vertical sobre disciplina interior con hook fuerte tipo TikTok. Debe sentirse real, cinematografico, profundo y cerrar con una frase poderosa."
          />
        </label>

        <div className="field">
          <span>Cuantas frases debe tener el guion</span>
          <div className="option-row" role="radiogroup" aria-label="Cantidad de frases">
            {PHRASE_COUNT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`option-pill ${phraseCount === option ? "option-pill-active" : ""}`}
                onClick={() => setPhraseCount(option)}
                aria-pressed={phraseCount === option}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={!canSubmit}
          onClick={() =>
            onSubmit({
              idea,
              artStyle: deriveArtStyle(idea, initialStyle),
              budgetCapUsd: initialBudgetCapUsd,
              useVeo: initialUseVeo,
              phraseCount,
            })
          }
        >
          {isLoading ? "Generando guion..." : "Crear guion inicial"}
        </button>
      </section>

      <aside className="panel aside-panel panel-light">
        <div className="summary-card">
          <p className="eyebrow">Guia rapida</p>
          <h3>Texto que mejor funciona</h3>
          <p className="muted-copy">
            Escribe en espanol con detalles concretos: protagonista, ambiente,
            conflicto, transformacion y cierre.
          </p>
        </div>

        {recentSessions.length > 0 ? (
          <div className="saved-sessions-card">
            <div className="saved-sessions-header">
              <div>
                <p className="eyebrow">Sesiones</p>
                <strong>Retomar trabajo</strong>
              </div>
              <button
                type="button"
                className="saved-session-clear"
                onClick={onClearSessions}
              >
                Limpiar
              </button>
            </div>

            <div className="saved-session-list">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className="saved-session-item"
                  onClick={() => onResumeSession(session.id)}
                >
                  <div className="saved-session-copy">
                    <strong>{session.title}</strong>
                    <span>{session.subtitle}</span>
                  </div>
                  <div className="saved-session-meta">
                    <span>{statusLabel[session.status]}</span>
                    <small>
                      {new Date(session.savedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
};
