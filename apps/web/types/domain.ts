export type SessionStatus = "draft" | "recording" | "processing" | "done";

export type IdeaPriority = "High" | "Medium" | "Low";

export type Idea = {
  title: string;
  detail: string;
  priority: IdeaPriority;
};

export type AiOutput = {
  summary: string;
  keyIdeas: Idea[];
  actionItems: string[];
  diagram: {
    nodes: string[];
    edges: Array<[number, number]>;
  };
  code: string;
  projectBrief: string;
  suggestedNextSteps: string[];
};

export type BrainstormSession = {
  id: string;
  title: string;
  status: SessionStatus;
  durationSeconds: number;
  notes: string[];
  canvasData: string | null;
  transcript: string;
  aiOutput: AiOutput | null;
  createdAt: string;
  updatedAt: string;
};
