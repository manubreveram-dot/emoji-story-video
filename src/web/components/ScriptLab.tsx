import React from "react";
import type { ActDraft, PhraseDraft, ScriptDocumentV2, StyleBible } from "../../types/workflow-v2";

type ScriptLabProps = {
  script: ScriptDocumentV2;
  isSaving: boolean;
  onBack: () => void;
  onRegenerate: () => void;
  onProceed: () => void;
  onPhraseChange: (phraseIndex: number, value: string) => void;
  onActChange: (actIndex: number, field: keyof ActDraft, value: string) => void;
  onActPhraseIndexesChange: (actIndex: number, value: string) => void;
  onStyleBibleChange: (field: keyof StyleBible, value: string | number) => void;
};

const STYLE_FIELDS: Array<{ key: keyof StyleBible; label: string; multiline?: boolean }> = [
  { key: "artStyle", label: "Art style" },
  { key: "palette", label: "Palette" },
  { key: "lighting", label: "Lighting" },
  { key: "camera", label: "Camera" },
  { key: "characterDescriptors", label: "Character descriptors", multiline: true },
  { key: "negativePrompt", label: "Negative prompt", multiline: true },
  { key: "consistencyNote", label: "Consistency note", multiline: true },
];

function phraseIndexesToString(act: ActDraft): string {
  return act.phraseIndexes.map((value) => value + 1).join(", ");
}

function sumDuration(phrases: PhraseDraft[]): number {
  return phrases.reduce((total, phrase) => total + phrase.durationSeconds, 0);
}

export const ScriptLab: React.FC<ScriptLabProps> = ({
  script,
  isSaving,
  onBack,
  onRegenerate,
  onProceed,
  onPhraseChange,
  onActChange,
  onActPhraseIndexesChange,
  onStyleBibleChange,
}) => {
  return (
    <div className="wizard-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Script Lab</p>
            <h2>{script.title}</h2>
            <p className="muted-copy">
              10 frases editables y agrupacion auto en 4 actos.
            </p>
          </div>
          <div className="cost-pill">
            Estimado: US$ {script.estimatedCost.totalUsd.toFixed(2)}
          </div>
        </div>

        <div className="phrase-list">
          {script.phrases.map((phrase, index) => (
            <article key={phrase.id} className="phrase-card">
              <div className="phrase-meta">
                <span>Frase {index + 1}</span>
                <span>{phrase.durationSeconds}s</span>
              </div>
              <textarea
                value={phrase.text}
                rows={2}
                onChange={(event) => onPhraseChange(index, event.target.value)}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Act mapper</p>
            <h3>4 bloques visuales</h3>
          </div>
        </div>

        <div className="act-list">
          {script.acts.map((act, index) => (
            <article key={act.id} className="act-card">
              <strong>Acto {index + 1}</strong>
              <input
                value={act.title}
                onChange={(event) => onActChange(index, "title", event.target.value)}
                placeholder="Titulo del acto"
              />
              <textarea
                value={act.summary}
                rows={2}
                onChange={(event) => onActChange(index, "summary", event.target.value)}
                placeholder="Resumen narrativo"
              />
              <textarea
                value={act.visualPrompt}
                rows={3}
                onChange={(event) =>
                  onActChange(index, "visualPrompt", event.target.value)
                }
                placeholder="Prompt visual del bloque"
              />
              <input
                value={phraseIndexesToString(act)}
                onChange={(event) =>
                  onActPhraseIndexesChange(index, event.target.value)
                }
                placeholder="Frases asociadas: 1,2,3"
              />
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-2">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Style Bible</p>
            <h3>Ancla visual compartida</h3>
          </div>
        </div>

        <div className="style-bible-grid">
          {STYLE_FIELDS.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  value={(script.styleBible[field.key] as string | undefined) ?? ""}
                  rows={field.key === "negativePrompt" ? 3 : 2}
                  onChange={(event) =>
                    onStyleBibleChange(field.key, event.target.value)
                  }
                />
              ) : (
                <input
                  value={(script.styleBible[field.key] as string | undefined) ?? ""}
                  onChange={(event) =>
                    onStyleBibleChange(field.key, event.target.value)
                  }
                />
              )}
            </label>
          ))}

          <label className="field">
            <span>Seed base</span>
            <input
              type="number"
              value={script.styleBible.seedBase}
              onChange={(event) =>
                onStyleBibleChange("seedBase", Number(event.target.value))
              }
            />
          </label>
        </div>
      </section>

      <aside className="panel">
        <div className="summary-card">
          <p className="eyebrow">Estado</p>
          <h3>Listo para generar visuales</h3>
          <p>
            {script.phrases.length} frases / {script.acts.length} actos / {sumDuration(script.phrases)}s
          </p>
          <p className="muted-copy">
            Presupuesto cap: US$ {script.budgetCapUsd.toFixed(2)}
          </p>
        </div>

        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onBack}>
            Volver
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={isSaving}
            onClick={onRegenerate}
          >
            {isSaving ? "Regenerando..." : "Regenerar script"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isSaving}
            onClick={onProceed}
          >
            Guardar y generar visuales
          </button>
        </div>
      </aside>
    </div>
  );
};
