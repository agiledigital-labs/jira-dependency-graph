export type Issue = {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
};
export type IssueLink = {
  id?: string;
  linkType: string;
  inwardIssue: string;
  outwardIssue: string;
};
