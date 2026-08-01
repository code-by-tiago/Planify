import type { MaterialEngineType } from "./material-engine-types";

const SECTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    content: { type: "STRING" },
    bullets: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "content", "bullets"],
};

const ACTIVITY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    objective: { type: "STRING" },
    estimatedTime: { type: "STRING" },
    materials: { type: "ARRAY", items: { type: "STRING" } },
    instructions: { type: "STRING" },
    items: { type: "ARRAY", items: { type: "STRING" } },
    evaluation: { type: "STRING" },
  },
  required: [
    "title",
    "objective",
    "estimatedTime",
    "materials",
    "instructions",
    "items",
    "evaluation",
  ],
};

const BASE_MATERIAL_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    subtitle: { type: "STRING" },
    summary: { type: "STRING" },
    sections: { type: "ARRAY", items: SECTION_SCHEMA },
    activities: { type: "ARRAY", items: ACTIVITY_SCHEMA },
    answerKey: { type: "ARRAY", items: { type: "STRING" } },
    teacherNotes: { type: "ARRAY", items: { type: "STRING" } },
    html: { type: "STRING" },
  },
  required: ["title", "subtitle", "summary", "sections", "activities", "answerKey", "teacherNotes"],
};

const GAME_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    game: {
      type: "OBJECT",
      properties: {
        format: { type: "STRING" },
        rules: { type: "ARRAY", items: { type: "STRING" } },
        components: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["format", "rules", "components"],
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "game"],
};

const EXAM_QUESTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    number: { type: "INTEGER" },
    type: {
      type: "STRING",
      enum: ["multipla-escolha", "verdadeiro-falso", "dissertativa", "completar"],
    },
    statement: { type: "STRING" },
    options: { type: "ARRAY", items: { type: "STRING" } },
    answer: { type: "STRING" },
  },
  required: ["number", "type", "statement", "options", "answer"],
};

const SLIDES_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    exam: {
      type: "OBJECT",
      properties: {
        questions: { type: "ARRAY", items: EXAM_QUESTION_SCHEMA },
      },
    },
    slides: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          bullets: { type: "ARRAY", items: { type: "STRING" } },
          speakerNotes: { type: "STRING" },
          layout: {
            type: "STRING",
            enum: ["capa", "conteudo", "duasColunas", "destaque", "fechamento"],
          },
          subtitle: { type: "STRING" },
          imagePrompt: { type: "STRING" },
          sequenceStep: { type: "INTEGER" },
          sequenceLabel: { type: "STRING" },
          accentColor: {
            type: "STRING",
            enum: ["indigo", "violet", "coral", "amber", "emerald", "sky", "rose"],
          },
          iconHint: { type: "STRING" },
          callout: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              text: { type: "STRING" },
            },
          },
        },
        required: ["title", "bullets", "speakerNotes"],
      },
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "slides"],
};

const FLASHCARDS_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    flashcards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          front: { type: "STRING" },
          back: { type: "STRING" },
        },
        required: ["front", "back"],
      },
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "flashcards"],
};

const EXAM_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    exam: {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              number: { type: "INTEGER" },
              type: {
                type: "STRING",
                enum: [
                  "multipla-escolha",
                  "verdadeiro-falso",
                  "dissertativa",
                  "completar",
                ],
              },
              statement: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              answer: { type: "STRING" },
            },
            required: ["number", "type", "statement", "options", "answer"],
          },
        },
      },
      required: ["questions"],
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "exam"],
};

const MINDMAP_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    mindMap: {
      type: "OBJECT",
      properties: {
        central: { type: "STRING" },
        branches: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              items: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["title", "items"],
          },
        },
      },
      required: ["central", "branches"],
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "mindMap"],
};

const LESSON_PLAN_SCHEMA = {
  ...BASE_MATERIAL_SCHEMA,
  properties: {
    ...BASE_MATERIAL_SCHEMA.properties,
    lessonPlan: {
      type: "OBJECT",
      properties: {
        steps: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              stage: { type: "STRING" },
              duration: { type: "STRING" },
              description: { type: "STRING" },
              resources: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["stage", "duration", "description", "resources"],
          },
        },
      },
      required: ["steps"],
    },
  },
  required: [...BASE_MATERIAL_SCHEMA.required, "lessonPlan"],
};

export function getMaterialEngineSchema(type: MaterialEngineType) {
  if (type === "jogo" || type === "cruzadinha") return GAME_SCHEMA;
  if (type === "atividade") {
    return {
      ...BASE_MATERIAL_SCHEMA,
      properties: {
        ...BASE_MATERIAL_SCHEMA.properties,
        activities: { type: "ARRAY", items: ACTIVITY_SCHEMA },
      },
    };
  }
  if (type === "slides") return SLIDES_SCHEMA;
  if (type === "flashcards") return FLASHCARDS_SCHEMA;
  if (type === "prova" || type === "lista") return EXAM_SCHEMA;
  if (type === "mapa-mental") return MINDMAP_SCHEMA;
  if (type === "plano-aula") return LESSON_PLAN_SCHEMA;
  return BASE_MATERIAL_SCHEMA;
}
