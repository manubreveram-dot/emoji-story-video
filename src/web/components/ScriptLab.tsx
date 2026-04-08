import React from "react";
import type {
  ActDraft,
  PhraseDraft,
  ScriptDocumentV2,
  StyleBible,
} from "../../types/workflow-v2";

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

const STYLE_FIELDS: Array<{
  key: keyof StyleBible;
  label: string;
  multiline?: boolean;
}> = [
  { key: "artStyle", label: "Direccion visual global" },
  { key: "palette", label: "Paleta y tono emocional" },
  { key: "lighting", label: "Iluminacion principal" },
  { key: "camera", label: "Lenguaje de camara" },
  {
    key: "characterDescriptors",
    label: "Protagonista y continuidad visual",
    multiline: true,
  },
  {
    key: "negativePrompt",
    label: "Elementos prohibidos (anti look IA)",
    multiline: true,
  },
  {
    key: "consistencyNote",
    label: "Regla de coherencia entre escenas",
    multiline: true,
  },
];

function phraseIndexesToString(act: ActDraft): string {
  return act.phraseIndexes.map((value) => value + 1).join(", ");
}

function sumDuration(phrases: PhraseDraft[]): number {
  return phrases.reduce((total, phrase) => total + phrase.durationSeconds, 0);
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
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
      <section className="panel span-2 panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Laboratorio de guion</p>
            <h2>{script.title}</h2>
            <p className="muted-copy">
              Ajusta texto, ritmo y claridad para que cada frase empuje la historia.
            </p>
            <p className="muted-copy">
              {script.phraseCount} frases | {sumDuration(script.phrases)} segundos.
            </p>
          </div>
        </div>

        <div className="editor-group">
          <h3>Frases del guion</h3>
          <p className="muted-copy">
            Mantiene frases cortas, visuales y con emocion concreta.
          </p>

          <div className="phrase-list">
            {script.phrases.map((phrase, index) => (
              <article key={phrase.id} className="phrase-card phrase-card-light editor-card">
                <div className="phrase-meta">
                  <span>Frase {index + 1}</span>
                  <span>
                    {phrase.durationSeconds}s | {countWords(phrase.text)} palabras
                  </span>
                </div>
                <textarea
                  value={phrase.text}
                  rows={3}
                  onChange={(event) => onPhraseChange(index, event.target.value)}
                  placeholder="Escribe la narracion exacta que debe mostrarse en pantalla..."
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Bloques de prompt visual</p>
            <h3>Direccion fotografica por acto</h3>
            <p className="muted-copy">
              Define la imagen exacta de cada bloque narrativo antes de generar.
            </p>
          </div>
        </div>

        <div className="act-list">
          {script.acts.map((act, index) => (
            <article key={act.id} className="act-card act-card-light editor-card">
              <div className="act-head">
                <strong>Acto {index + 1}</strong>
              </div>

              <label className="field">
                <span>Titulo del acto</span>
                <input
                  value={act.title}
                  onChange={(event) => onActChange(index, "title", event.target.value)}
                  placeholder="Ej: Punto de quiebre interior"
                />
              </label>

              <label className="field">
                <span>Resumen narrativo</span>
                <textarea
                  value={act.summary}
                  rows={3}
                  onChange={(event) => onActChange(index, "summary", event.target.value)}
                  placeholder="Que pasa en este acto y cual es la emocion dominante..."
                />
              </label>

              <label className="field">
                <span>Prompt visual final (espanol)</span>
                <textarea
                  value={act.visualPrompt}
                  rows={5}
                  onChange={(event) => onActChange(index, "visualPrompt", event.target.value)}
                  placeholder="Escena realista: sujeto, accion, entorno, luz, lente, textura y atmosfera."
                />
              </label>

              <label className="field">
                <span>Frases asociadas</span>
                <input
                  value={phraseIndexesToString(act)}
                  onChange={(event) => onActPhraseIndexesChange(index, event.target.value)}
                  placeholder="1,2,3"
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-2 panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Guia visual</p>
            <h3>Sistema estetico conectado al brief</h3>
            <p className="muted-copy">
              Este bloque asegura continuidad real entre todas las escenas.
            </p>
          </div>
        </div>

        <div className="style-bible-grid">
          {STYLE_FIELDS.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  value={(script.styleBible[field.key] as string | undefined) ?? ""}
                  rows={field.key === "negativePrompt" ? 4 : 3}
                  onChange={(event) => onStyleBibleChange(field.key, event.target.value)}
                />
              ) : (
                <input
                  value={(script.styleBible[field.key] as string | undefined) ?? ""}
                  onChange={(event) => onStyleBibleChange(field.key, event.target.value)}
                />
              )}
            </label>
          ))}

          <label className="field">
            <span>Seed base</span>
            <input
              type="number"
              value={script.styleBible.seedBase}
              onChange={(event) => onStyleBibleChange("seedBase", Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <aside className="panel panel-light">
        <div className="summary-card">
          <p className="eyebrow">Siguiente paso</p>
          <h3>Revisar fotos por acto</h3>
          <p className="muted-copy">
            Luego de guardar, vas a validar y editar cada prompt de imagen.
          </p>
        </div>

        <div className="button-stack">
          <button type="button" className="ghost-button" onClick={onBack}>
            Volver al inicio
          </button>
          <button
            type="button"
            className="ghost-button"
            disabled={isSaving}
            onClick={onRegenerate}
          >
            {isSaving ? "Regenerando..." : "Regenerar guion"}
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isSaving}
            onClick={onProceed}
          >
            Guardar y pasar a fotos
          </button>
        </div>
      </aside>
    </div>
  );
};
