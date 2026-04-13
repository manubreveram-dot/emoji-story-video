import type { StyleBible, VisualActV2 } from "../v2-types";
import type { ImageStyle } from "../../types/script";

export function buildImagePromptV2(
  act: VisualActV2,
  style: ImageStyle,
  styleBible: StyleBible,
): string {
  return [
    "Genera una imagen fotografica vertical 9:16 con calidad editorial premium.",
    "Todo el prompt debe ejecutarse en espanol y de forma literal.",
    "Esta imagen pertenece a un canal de micro historias distopicas con IA.",
    "",
    "Contexto visual global:",
    `- Direccion: ${style.artStyle}.`,
    `- Regla de coherencia: ${style.consistency}.`,
    `- Tono cromatico: ${style.colorTone}.`,
    `- Paleta: ${styleBible.palette}.`,
    `- Iluminacion: ${styleBible.lighting}.`,
    `- Camara: ${styleBible.camera}.`,
    `- Protagonista estable: ${styleBible.characterDescriptors}.`,
    `- Prohibiciones: ${styleBible.negativePrompt}.`,
    "",
    "Contexto del acto:",
    `- Acto: ${act.title}.`,
    `- Resumen: ${act.summary}.`,
    `- Foco visual: ${act.visualFocus}.`,
    `- Prompt del acto: ${act.shotPrompt}.`,
    "",
    "Objetivo estetico obligatorio:",
    "- Blanco y negro predominante con opcion de un acento rojo o azul muy sutil.",
    "- Alto contraste, sombras duras y mucho espacio negativo.",
    "- Aspecto realista, piel natural y texturas organicas.",
    "- Fuente unica de luz cuando sea posible: pantalla, celular, farol o interfaz.",
    "- Rostros parcialmente ocultos, tension psicologica y encuadre cerrado.",
    "- POV humano o POV IA si ayuda a la escena.",
    "- UI overlays, tracking o alertas solo si aportan narrativa.",
    "- Luz fisica creible y profundidad cinematografica.",
    "- Cero apariencia de imagen IA barata o plastica.",
    "- Sin texto sobreimpreso, sin logos y sin watermark.",
    "- Mantener continuidad de sujeto y entorno con los otros actos.",
  ].join("\n");
}

export function buildVeoPromptEnglish(
  act: VisualActV2,
  styleBible: StyleBible,
  translatedSummary: string,
): string {
  return [
    `Create a cinematic 9:16 hero motion shot for Act ${act.order}.`,
    "Use the reference image as the main visual anchor.",
    `Visual style anchor: ${styleBible.characterDescriptors}.`,
    `Palette: ${styleBible.palette}.`,
    `Lighting: ${styleBible.lighting}.`,
    `Camera: ${styleBible.camera}.`,
    `Character consistency: ${styleBible.characterDescriptors}.`,
    `Scene intent: ${translatedSummary}.`,
    "Subtle camera drift, elegant motion, no abrupt cuts, no text overlay.",
  ].join(" ");
}
