export type Availability = "open" | "passive" | "not_looking" | "hired";
export type InterestType = "unlock" | "interview" | "hire";
export type PaymentType = "bid" | InterestType;

export type Candidate = {
  id: string;
  user_id: string;
  name: string;
  username: string;
  photo: string | null;
  title: string;
  bio: string | null;
  location: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  skills: string[];
  /** cents */
  current_bid: number;
  rank: number | null;
  availability: Availability;
  contact_email: string | null;
  created_at: string;
};

export type CandidateStats = {
  views: number;
  portfolio_clicks: number;
  recruiter_views: number;
  companies_interested: number;
  interview_requests: number;
  hires: number;
};

export type Interest = {
  id: string;
  candidate_id: string;
  company: string | null;
  message: string | null;
  type: InterestType;
  created_at: string;
};

export type Bid = {
  id: string;
  candidate_id: string;
  amount: number;
  created_at: string;
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  open: "Open to work",
  passive: "Open to the right thing",
  not_looking: "Just flexing",
  hired: "Hired 🎉",
};
