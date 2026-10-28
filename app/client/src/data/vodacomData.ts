/* Public-build data contract: the GitHub Pages version starts empty. Users populate it locally through CSV/XLSX import. */
export type Activation = {
  id?: string;
  campaignId?: string;
  d: string;
  a: string;
  s: string;
  c: string;
  t: string;
  cl: string;
  n: string;
  merchant?: {
    reference: string;
    shortCode: string;
    amount: number;
    status: "recorded" | "verified" | "rejected";
    pool: string;
    activity: string;
    comment: string;
    occurredAt: string;
    campaignRunId: string;
    baId: string;
    posId: string;
    evidencePath: string;
  };
};

export const activationData: Activation[] = [];
