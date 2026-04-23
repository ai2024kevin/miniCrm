export type CrmDealStatus = 'new' | 'in_progress' | 'won' | 'lost';
export type CrmTaskStatus = 'todo' | 'doing' | 'done';

export interface CrmUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type CrmClientStatus = 'active' | 'archived';

export interface CrmClient {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  status: CrmClientStatus;
  comment: string | null;
  created_at: string;
}

export interface CrmDeal {
  id: number;
  client_id: number | null;
  title: string;
  amount: number;
  stage: CrmDealStatus;
  comment: string | null;
  close_date: string | null;
  created_at: string;
}

export interface CrmTask {
  id: number;
  client_id: number | null;
  deal_id: number | null;
  title: string;
  description: string | null;
  status: CrmTaskStatus;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
}

export interface CrmGoogleSettings {
  spreadsheet_id: string | null;
  folder_id: string | null;
  title_prefix: string | null;
  client_secret_json: string | null;
  oauth_token_json: string | null;
}

export interface CrmStore {
  users: CrmUser[];
  clients: CrmClient[];
  deals: CrmDeal[];
  tasks: CrmTask[];
  googleSettings: CrmGoogleSettings;
}

export const createEmptyCrmStore = (): CrmStore => ({
  users: [],
  clients: [],
  deals: [],
  tasks: [],
  googleSettings: {
    spreadsheet_id: null,
    folder_id: null,
    title_prefix: null,
    client_secret_json: null,
    oauth_token_json: null,
  },
});
