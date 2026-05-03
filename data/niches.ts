export interface NicheData {
  niche: string;
  demand: "High" | "Medium" | "Low";
  competition: "High" | "Medium" | "Low";
  potential: "High" | "Medium" | "Low";
  avgPrice: string;
  audience: string;
  difficulty: "Easy" | "Medium" | "Hard";
  trendingProducts: string[];
  tip: string;
}

export const NICHE_DATASET: NicheData[] = [
  {
    niche: "Kids",
    demand: "High",
    competition: "High",
    potential: "High",
    avgPrice: "$3.99–$8.99",
    audience: "Parents & Homeschoolers",
    difficulty: "Easy",
    trendingProducts: ["Activity Books", "Coloring Pages", "Learning Worksheets", "Reward Charts"],
    tip: "Seasonal variations (back-to-school, summer) sell especially well.",
  },
  {
    niche: "Teachers",
    demand: "High",
    competition: "High",
    potential: "Medium",
    avgPrice: "$3.99–$9.99",
    audience: "K–12 Teachers",
    difficulty: "Easy",
    trendingProducts: ["Lesson Planners", "Attendance Trackers", "Classroom Decor", "Sub Plans"],
    tip: "Back-to-school season (July–September) is peak selling time.",
  },
  {
    niche: "Wedding",
    demand: "High",
    competition: "High",
    potential: "High",
    avgPrice: "$5.99–$14.99",
    audience: "Engaged Couples & Planners",
    difficulty: "Medium",
    trendingProducts: ["Budget Planner", "Guest List Tracker", "Seating Chart", "Timeline Template"],
    tip: "Couples plan 12–18 months ahead — Valentine's Day and spring are peak seasons.",
  },
  {
    niche: "Budgeting",
    demand: "High",
    competition: "Medium",
    potential: "High",
    avgPrice: "$3.99–$9.99",
    audience: "Young Adults & Families",
    difficulty: "Easy",
    trendingProducts: ["Monthly Budget Sheet", "Savings Tracker", "Bill Tracker", "Debt Payoff Planner"],
    tip: "January (new year, new goals) is peak season. Bundle monthly + weekly trackers.",
  },
  {
    niche: "Productivity",
    demand: "High",
    competition: "High",
    potential: "Medium",
    avgPrice: "$4.99–$12.99",
    audience: "Professionals & Students",
    difficulty: "Easy",
    trendingProducts: ["Daily Planner", "Goal Setting Workbook", "Habit Tracker", "Weekly Review Template"],
    tip: "Digital versions (GoodNotes compatible) command a price premium.",
  },
  {
    niche: "Fitness",
    demand: "Medium",
    competition: "Medium",
    potential: "High",
    avgPrice: "$3.99–$7.99",
    audience: "Fitness Beginners & Gym-goers",
    difficulty: "Easy",
    trendingProducts: ["Workout Planner", "Macro Tracker", "Weight Loss Journal", "30-Day Challenge"],
    tip: "January and summer are peak — tie products to seasonal fitness goals.",
  },
  {
    niche: "Mental Health",
    demand: "High",
    competition: "Low",
    potential: "High",
    avgPrice: "$4.99–$11.99",
    audience: "Adults in Self-Improvement",
    difficulty: "Medium",
    trendingProducts: ["Gratitude Journal", "Anxiety Workbook", "Mood Tracker", "Self-Care Checklist"],
    tip: "Low competition and growing demand — a great underserved niche for beginners.",
  },
  {
    niche: "Self Care",
    demand: "High",
    competition: "Medium",
    potential: "High",
    avgPrice: "$3.99–$9.99",
    audience: "Women 25–45",
    difficulty: "Easy",
    trendingProducts: ["Self-Care Planner", "Morning Routine Checklist", "Glow-Up Tracker", "Vision Board"],
    tip: "Aesthetic design matters a lot in this niche — invest in beautiful templates.",
  },
  {
    niche: "Small Business",
    demand: "Medium",
    competition: "Low",
    potential: "High",
    avgPrice: "$7.99–$19.99",
    audience: "Solopreneurs & Side Hustlers",
    difficulty: "Medium",
    trendingProducts: ["Business Planner", "Invoice Template", "Social Media Calendar", "Client Tracker"],
    tip: "Higher price point accepted — business owners see these as investments.",
  },
  {
    niche: "Travel",
    demand: "Medium",
    competition: "Low",
    potential: "Medium",
    avgPrice: "$3.99–$8.99",
    audience: "Travel Enthusiasts & Families",
    difficulty: "Easy",
    trendingProducts: ["Travel Planner", "Packing Checklist", "Budget Travel Sheet", "Itinerary Template"],
    tip: "Spring break and summer vacation drive big spikes in sales.",
  },
  {
    niche: "Seasonal – Summer",
    demand: "High",
    competition: "Medium",
    potential: "High",
    avgPrice: "$2.99–$6.99",
    audience: "Parents & Kids",
    difficulty: "Easy",
    trendingProducts: ["Summer Activity Book", "Camp Packing List", "Bucket List Printable", "Water Games"],
    tip: "List these in April–May to catch early summer shoppers.",
  },
  {
    niche: "Seasonal – Christmas",
    demand: "High",
    competition: "High",
    potential: "High",
    avgPrice: "$2.99–$7.99",
    audience: "Families & Gift-Givers",
    difficulty: "Easy",
    trendingProducts: ["Christmas Planner", "Gift List Tracker", "Advent Calendar", "Holiday Recipe Cards"],
    tip: "Start listing in September — Etsy shoppers plan months ahead.",
  },
  {
    niche: "Seasonal – Halloween",
    demand: "Medium",
    competition: "Medium",
    potential: "Medium",
    avgPrice: "$2.99–$5.99",
    audience: "Parents & Party Planners",
    difficulty: "Easy",
    trendingProducts: ["Halloween Coloring Pages", "Trick-or-Treat Planner", "Party Checklist", "Costume Tracker"],
    tip: "List by August — shoppers plan Halloween costumes and parties early.",
  },
  {
    niche: "Digital Planners",
    demand: "High",
    competition: "High",
    potential: "High",
    avgPrice: "$6.99–$19.99",
    audience: "iPad & GoodNotes Users",
    difficulty: "Hard",
    trendingProducts: ["GoodNotes Planner", "Notability Journal", "Digital Stickers", "Hyperlinked Planner"],
    tip: "Digital planners have a higher price ceiling — worth the extra effort.",
  },
];

/** Look up cached niche data for faster card analysis */
export function getNicheData(nicheName: string): NicheData | null {
  const normalized = nicheName.toLowerCase().replace(/seasonal\s*[–-]\s*/i, "seasonal – ");
  return (
    NICHE_DATASET.find(
      (n) =>
        n.niche.toLowerCase() === normalized ||
        nicheName.toLowerCase().includes(n.niche.toLowerCase()) ||
        n.niche.toLowerCase().includes(nicheName.toLowerCase().split("–")[0].trim())
    ) ?? null
  );
}
