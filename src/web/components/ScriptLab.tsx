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

function findActIndexForPhrase(
  acts: ActDraft[],
  phraseIndex: number,
): number | null {
  const index = acts.findIndex((act) => act.phraseIndexes.includes(phraseIndex));
  return index >= 0 ? index : null;
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
              Define subtitulos con ritmo y claridad para sostener un storytelling dinamico.
            </p>
            <p className="muted-copy">
              {script.phraseCount} frases | {sumDuration(script.phrases)} segundos.
            </p>
          </div>
        </div>

        <div className="guide-strip">
          <div className="guide-card">
            <strong>Subtitulo del video</strong>
            <p>Lo que escribes en cada frase se muestra en pantalla y se usa para narracion.</p>
          </div>
          <div className="guide-card">
            <strong>Prompt de foto</strong>
            <p>Se edita por acto y solo dirige la imagen. No se imprime texto dentro de la foto.</p>
          </div>
          <div className="guide-card">
            <strong>Regla de oro</strong>
            <p>Frases cortas + prompts visuales concretos = mejor hook y mayor retencion.</p>
          </div>
        </div>

        <div className="editor-group">
          <h3>Frases del guion</h3>
          <p className="muted-copy">
            Cada bloque controla el subtitulo en pantalla y la voz (si TTS esta activo).
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

                <div className="phrase-tags">
                  <span className="inline-tag inline-tag-primary">Aparece en video</span>
                  <span className="inline-tag">
                    Acto{" "}
                    {(findActIndexForPhrase(script.acts, index) ?? 0) + 1}
                  </span>
                  {phrase.emojis.length > 0 ? (
                    <span className="inline-tag">{phrase.emojis.slice(0, 4).join(" ")}</span>
                  ) : null}
                </div>

                <label className="field">
                  <span>Subtitulo / narracion de esta frase</span>
                  <textarea
                    className="subtitle-textarea"
                    value={phrase.text}
                    rows={4}
                    onChange={(event) => onPhraseChange(index, event.target.value)}
                    placeholder="Ejemplo: Respira profundo. Hoy sueltas el peso viejo."
                  />
                </label>

                <p className="field-helper">
                  Recomendado: 4 a 10 palabras claras, emocionales y faciles de leer en movil.
                </p>
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
              Separa bien historia y fotografia para evitar imagenes con exceso de texto.
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
                <span>Resumen narrativo del acto (interno)</span>
                <textarea
                  className="act-summary-textarea"
                  value={act.summary}
                  rows={4}
                  onChange={(event) => onActChange(index, "summary", event.target.value)}
                  placeholder="Que debe transmitir este acto en terminos de historia y emocion."
                />
              </label>

              <label className="field">
                <span>Prompt visual de la foto (solo imagen, sin letras)</span>
                <textarea
                  className="visual-prompt-textarea"
                  value={act.visualPrompt}
                  rows={7}
                  onChange={(event) => onActChange(index, "visualPrompt", event.target.value)}
                  placeholder="Describe sujeto, accion, entorno, luz, lente y atmosfera. Evita poemas, versos y textos literales."
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

              <p className="field-helper">
                Este prompt no aparece en pantalla. Solo lo usa el generador de fotos.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel span-2 panel-light">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Guia visual</p>
            <h3>ADN visual global del proyecto</h3>
            <p className="muted-copy">
              Mantiene continuidad de estilo, protagonista y look cinematografico en todos los actos.
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
