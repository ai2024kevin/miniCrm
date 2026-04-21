export type Client = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  status: "active" | "archived";
  comment: string | null;
  created_at: string;
};

export type Deal = {
  id: number;
  client_id: number | null;
  title: string;
  amount: number;
  stage: "new" | "in_progress" | "won" | "lost";
  comment: string | null;
  close_date: string | null;
  created_at: string;
};

export type Task = {
  id: number;
  client_id: number | null;
  deal_id: number | null;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done";
  is_done: boolean;
  due_date: string | null;
  created_at: string;
};

export type ReportResult = {
  title: string;
  url: string;
};
