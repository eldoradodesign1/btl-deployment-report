export type CampaignType = "hostess" | "brand_ambassador";

export type Campaign = {
  id: string;
  code: string;
  name: string;
  campaignType: CampaignType;
  status: "draft" | "active" | "archived";
  startsOn: string | null;
  endsOn: string | null;
  dailyPosTarget: number | null;
  transactionsPerPosTarget: number | null;
};

export type CampaignTerms = {
  record: string;
  records: string;
  participant: string;
  participants: string;
  location: string;
  locations: string;
  movement: string;
};

export const vodacomCampaignCode = "vodacom-privilege";

export const campaignTerms = (type?: CampaignType): CampaignTerms => type === "brand_ambassador"
  ? { record: "transaction", records: "Transactions", participant: "Ambassadeur", participants: "Ambassadeurs", location: "Point de vente", locations: "Points de vente", movement: "transactions" }
  : { record: "activation", records: "Activations", participant: "Agent", participants: "Agents", location: "Shop", locations: "Shops", movement: "activations" };

export const campaignDefaultTarget = (campaign?: Campaign | null) => campaign?.campaignType === "brand_ambassador"
  ? Math.max(0, (campaign.dailyPosTarget ?? 0) * (campaign.transactionsPerPosTarget ?? 0))
  : 0;
