import { CrmClient, CrmDeal, CrmTask } from '../storage/crm-store.types';

type ReportType = 'clients' | 'deals' | 'tasks';

const DEFAULT_TITLE_PREFIX = 'CRM Export';

export type ReportResponse = {
  title: string;
  url: string;
};

export type ReportSheetData = {
  title: string;
  sheetTitle: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
};

type ReportBuilderInput = {
  clients: CrmClient[];
  deals: CrmDeal[];
  tasks: CrmTask[];
  titlePrefix: string | null;
};

const normalizeTitlePrefix = (titlePrefix: string | null): string => {
  const trimmed = titlePrefix?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_TITLE_PREFIX;
};

const formatReportType = (type: ReportType): string => `${type[0].toUpperCase()}${type.slice(1)}`;

const sheetTitles: Record<ReportType, string> = {
  clients: 'Clients',
  deals: 'Deals',
  tasks: 'Tasks',
};

export const buildReportSheetData = (
  type: ReportType,
  input: ReportBuilderInput,
): ReportSheetData => {
  const prefix = normalizeTitlePrefix(input.titlePrefix);
  const title = `${prefix} — ${formatReportType(type)} report`;

  if (type === 'clients') {
    return {
      title,
      sheetTitle: sheetTitles.clients,
      headers: ['ID', 'Name', 'Phone', 'Email', 'Company', 'Status', 'Comment', 'Created at'],
      rows: input.clients.map((client) => [
        client.id,
        client.name,
        client.phone,
        client.email,
        client.company,
        client.status,
        client.comment,
        client.created_at,
      ]),
    };
  }

  if (type === 'deals') {
    const clientsById = new Map(input.clients.map((client) => [client.id, client]));
    return {
      title,
      sheetTitle: sheetTitles.deals,
      headers: ['ID', 'Client ID', 'Client name', 'Title', 'Amount', 'Stage', 'Comment', 'Close date', 'Created at'],
      rows: input.deals.map((deal) => [
        deal.id,
        deal.client_id,
        deal.client_id ? (clientsById.get(deal.client_id)?.name ?? null) : null,
        deal.title,
        deal.amount,
        deal.stage,
        deal.comment,
        deal.close_date,
        deal.created_at,
      ]),
    };
  }

  const clientsById = new Map(input.clients.map((client) => [client.id, client]));
  const dealsById = new Map(input.deals.map((deal) => [deal.id, deal]));

  return {
    title,
    sheetTitle: sheetTitles.tasks,
    headers: ['ID', 'Client ID', 'Client name', 'Deal ID', 'Deal title', 'Title', 'Description', 'Status', 'Is done', 'Due date', 'Created at'],
    rows: input.tasks.map((task) => [
      task.id,
      task.client_id,
      task.client_id ? (clientsById.get(task.client_id)?.name ?? null) : null,
      task.deal_id,
      task.deal_id ? (dealsById.get(task.deal_id)?.title ?? null) : null,
      task.title,
      task.description,
      task.status,
      task.is_done,
      task.due_date,
      task.created_at,
    ]),
  };
};

export const buildReportResponse = (title: string, url: string): ReportResponse => ({
  title,
  url,
});

export { normalizeTitlePrefix };
export type { ReportBuilderInput, ReportType };
