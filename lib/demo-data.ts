import type { Availability, Candidate } from "./types";

type Seed = {
  name: string; username: string; title: string; bio: string; location: string;
  skills: string[]; bid: number; availability: Availability;
  portfolio: string; links?: Partial<Record<"linkedin" | "github" | "twitter", string>>;
  views: number; recruiterViews: number; portfolioClicks: number;
  interest: { type: "unlock" | "interview" | "hire"; company: string; message?: string; daysAgo: number }[];
};

export const SEEDS: Seed[] = [
  {
    name: "Damilare Adeosun", username: "damilare", title: "AI Product Builder",
    bio: "I ship AI products fast. Last one went 0 → 40k users in six weeks. I'd like to do that for you, ideally starting Monday.",
    location: "London, UK", skills: ["Next.js", "LLM apps", "Product", "TypeScript", "Growth"],
    bid: 15000, availability: "open", portfolio: "https://hireme.lol",
    links: { linkedin: "https://linkedin.com/in/damilare", github: "https://github.com/damilare", twitter: "https://x.com/damilare" },
    views: 12400, recruiterViews: 861, portfolioClicks: 3120,
    interest: [
      { type: "interview", company: "Vercel", message: "Loved the demo. Can you chat Thursday?", daysAgo: 1 },
      { type: "unlock", company: "Monzo", daysAgo: 2 },
      { type: "interview", company: "Linear", message: "Are you open to a founding PM role?", daysAgo: 4 },
      { type: "unlock", company: "Anthropic", daysAgo: 5 },
    ],
  },
  {
    name: "Sarah Okonkwo", username: "sarah", title: "Product Designer",
    bio: "Ten years of making complicated things feel obvious. Fintech, healthtech, one regrettable NFT project.",
    location: "Manchester, UK", skills: ["Figma", "Design systems", "Prototyping", "UX research"],
    bid: 12000, availability: "open", portfolio: "https://sarah.design",
    links: { linkedin: "https://linkedin.com/in/sarah", twitter: "https://x.com/sarahdraws" },
    views: 9800, recruiterViews: 640, portfolioClicks: 2410,
    interest: [
      { type: "unlock", company: "Figma", daysAgo: 1 },
      { type: "interview", company: "Revolut", message: "Portfolio is unreal.", daysAgo: 3 },
    ],
  },
  {
    name: "James Whitfield", username: "james", title: "Software Engineer",
    bio: "Backend. Go and Postgres. I make slow things fast and page myself so you don't have to.",
    location: "Bristol, UK", skills: ["Go", "PostgreSQL", "Kubernetes", "Distributed systems"],
    bid: 10000, availability: "open", portfolio: "https://jameswhit.dev",
    links: { github: "https://github.com/jameswhit" },
    views: 7300, recruiterViews: 502, portfolioClicks: 1180,
    interest: [{ type: "unlock", company: "Cloudflare", daysAgo: 2 }],
  },
  {
    name: "Priya Raman", username: "priya", title: "Data Scientist",
    bio: "Forecasting, causal inference, and telling execs their A/B test wasn't significant.",
    location: "Remote (GMT)", skills: ["Python", "dbt", "Causal inference", "SQL"],
    bid: 8500, availability: "passive", portfolio: "https://priya.works",
    links: { linkedin: "https://linkedin.com/in/priyaraman", github: "https://github.com/priya" },
    views: 5600, recruiterViews: 388, portfolioClicks: 940,
    interest: [{ type: "interview", company: "Deliveroo", daysAgo: 6 }],
  },
  {
    name: "Tobi Adeyemi", username: "tobi", title: "Growth Marketer",
    bio: "I turn £1 into £6. Repeatedly. Ask me about the TikTok thing.",
    location: "Lagos, NG", skills: ["Paid social", "SEO", "Lifecycle", "Analytics"],
    bid: 7200, availability: "open", portfolio: "https://tobigrowth.co",
    links: { twitter: "https://x.com/tobigrows" },
    views: 4900, recruiterViews: 301, portfolioClicks: 1520,
    interest: [{ type: "unlock", company: "Depop", daysAgo: 3 }],
  },
  {
    name: "Mira Kaufmann", username: "mira", title: "Founding Engineer",
    bio: "Employee #3 twice. I like the part where nothing exists yet and everything is on fire.",
    location: "Berlin, DE", skills: ["TypeScript", "React", "Rust", "0→1"],
    bid: 6400, availability: "open", portfolio: "https://mira.build",
    links: { github: "https://github.com/mirak", twitter: "https://x.com/mirabuilds" },
    views: 4100, recruiterViews: 277, portfolioClicks: 860,
    interest: [{ type: "hire", company: "Sequence", message: "We want to make an offer.", daysAgo: 1 }],
  },
  {
    name: "Leo Marchetti", username: "leo", title: "Brand Designer",
    bio: "Logos, type, and the good kind of weird. Previously in-house at two unicorns.",
    location: "Milan, IT", skills: ["Branding", "Typography", "Motion", "Illustration"],
    bid: 5500, availability: "passive", portfolio: "https://leomarchetti.studio",
    views: 3800, recruiterViews: 210, portfolioClicks: 1290, interest: [],
  },
  {
    name: "Aisha Bello", username: "aisha", title: "Product Manager",
    bio: "Shipped payments in 14 countries. I write the doc nobody wanted and then everybody quotes.",
    location: "London, UK", skills: ["Payments", "Discovery", "Roadmapping", "SQL"],
    bid: 4800, availability: "open", portfolio: "https://aisha.pm",
    links: { linkedin: "https://linkedin.com/in/aishabello" },
    views: 3200, recruiterViews: 186, portfolioClicks: 610,
    interest: [{ type: "interview", company: "Wise", daysAgo: 5 }],
  },
  {
    name: "Noah Fitzgerald", username: "noah", title: "iOS Engineer",
    bio: "Swift since Swift. I care about 120fps more than is medically advisable.",
    location: "Dublin, IE", skills: ["Swift", "SwiftUI", "Metal", "Accessibility"],
    bid: 4100, availability: "open", portfolio: "https://noahfitz.app",
    links: { github: "https://github.com/noahfitz" },
    views: 2700, recruiterViews: 154, portfolioClicks: 520, interest: [],
  },
  {
    name: "Yuki Tanaka", username: "yuki", title: "ML Engineer",
    bio: "Inference costs go down when I'm around. Quantisation enjoyer.",
    location: "Remote (JST)", skills: ["PyTorch", "CUDA", "Inference", "Evals"],
    bid: 3600, availability: "passive", portfolio: "https://yuki.ml",
    links: { github: "https://github.com/yukit" },
    views: 2400, recruiterViews: 141, portfolioClicks: 470,
    interest: [{ type: "unlock", company: "Hugging Face", daysAgo: 4 }],
  },
  {
    name: "Grace Mensah", username: "grace", title: "Content Strategist",
    bio: "I make B2B writing that people actually finish. Rare. Expensive. Worth it.",
    location: "Accra, GH", skills: ["Editorial", "SEO", "Brand voice", "Docs"],
    bid: 2900, availability: "open", portfolio: "https://gracemensah.com",
    views: 1900, recruiterViews: 98, portfolioClicks: 380, interest: [],
  },
  {
    name: "Marcus Hale", username: "marcus", title: "DevOps Engineer",
    bio: "Your build is 11 minutes. Give me a week and it's 90 seconds.",
    location: "Leeds, UK", skills: ["Terraform", "AWS", "CI/CD", "Observability"],
    bid: 2200, availability: "open", portfolio: "https://marcushale.io",
    links: { github: "https://github.com/mhale" },
    views: 1500, recruiterViews: 76, portfolioClicks: 240, interest: [],
  },
  {
    name: "Elena Rossi", username: "elena", title: "UX Researcher",
    bio: "I talk to your users so your roadmap stops being fan fiction.",
    location: "Barcelona, ES", skills: ["Interviews", "Synthesis", "Surveys", "Usability"],
    bid: 1600, availability: "open", portfolio: "https://elenarossi.research",
    views: 1100, recruiterViews: 54, portfolioClicks: 190, interest: [],
  },
  {
    name: "Sam Osei", username: "sam", title: "Junior Frontend Dev",
    bio: "Six months in, shipping daily, annoyingly enthusiastic. Give me a chance and I'll make it your best hire.",
    location: "London, UK", skills: ["React", "CSS", "TypeScript"],
    bid: 900, availability: "open", portfolio: "https://samosei.dev",
    links: { github: "https://github.com/samosei", twitter: "https://x.com/samships" },
    views: 840, recruiterViews: 41, portfolioClicks: 160, interest: [],
  },
];

export function seedPhoto(username: string) {
  return `https://i.pravatar.cc/240?u=hireme-${username}`;
}

export function seedCandidates(): Candidate[] {
  const now = Date.now();
  return SEEDS.map((s, i) => ({
    id: `demo-${s.username}`,
    user_id: `demo-user-${s.username}`,
    name: s.name,
    username: s.username,
    photo: seedPhoto(s.username),
    title: s.title,
    bio: s.bio,
    location: s.location,
    portfolio_url: s.portfolio,
    linkedin_url: s.links?.linkedin ?? null,
    github_url: s.links?.github ?? null,
    twitter_url: s.links?.twitter ?? null,
    skills: s.skills,
    current_bid: s.bid,
    rank: i + 1,
    availability: s.availability,
    contact_email: `${s.username}@hireme.lol`,
    created_at: new Date(now - (SEEDS.length - i) * 86_400_000).toISOString(),
  }));
}
