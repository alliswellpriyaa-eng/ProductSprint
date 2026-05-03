/**
 * Static fallback data used when:
 *  1. The AI API is unavailable / rate-limited / key missing
 *  2. A server cache miss + AI timeout on the planner route
 *
 * Covers all niches × product types that exist in the app.
 * Each array has 10 entries to match the real API shape.
 */

// ─── Types (mirrors real API shapes) ─────────────────────────────────────────

export interface FallbackIdea {
  title: string;
  description: string;
}

// ─── Ideas per niche ──────────────────────────────────────────────────────────

export const NICHE_FALLBACK_IDEAS: Record<string, FallbackIdea[]> = {
  Kids: [
    { title: "Kids Daily Routine Chart Printable", description: "Visual morning & bedtime routine chart for children ages 4–8." },
    { title: "Kids Alphabet Tracing Workbook", description: "26-page letter tracing practice book for pre-K to kindergarten." },
    { title: "Children's Emotion Check-In Cards", description: "Daily feelings cards to help kids identify and express emotions." },
    { title: "Kids Summer Activity Book", description: "40+ fun summer boredom-buster activities for ages 6–10." },
    { title: "Kids Reading Log Tracker", description: "Monthly reading progress log with star reward system for ages 5–12." },
    { title: "Classroom Behavior Sticker Chart", description: "Weekly reward chart for teachers and homeschool parents." },
    { title: "Kids Bedtime Story Prompt Cards", description: "30 creative story starter cards for bedtime imagination play." },
    { title: "Children's Chore Chart & Reward System", description: "Weekly task tracker with points system for ages 5–12." },
    { title: "Kids Coloring Pages Bundle (Animals)", description: "20 printable animal coloring pages for toddlers through age 8." },
    { title: "Homeschool Daily Schedule Template", description: "Editable daily timetable with subject blocks for home educators." },
  ],
  Teachers: [
    { title: "Teacher Weekly Lesson Planner", description: "Editable 5-day planning template with objectives and notes sections." },
    { title: "Classroom Attendance Tracker Sheet", description: "Monthly attendance log for up to 35 students." },
    { title: "Parent-Teacher Conference Notes Template", description: "Structured note-taking form for recording student progress discussions." },
    { title: "Student Progress Report Template", description: "Quarterly report card with grade, effort, and behavior columns." },
    { title: "Classroom Decor Word Wall Cards", description: "200+ printable vocabulary word cards in clean, readable fonts." },
    { title: "Reading Group Tracker Binder Insert", description: "Guided reading level progress log for small group instruction." },
    { title: "Substitute Teacher Information Pack", description: "Fill-in classroom guide covering routines, rules, and emergency info." },
    { title: "Math Fact Practice Worksheets Bundle", description: "Addition, subtraction, multiplication, and division drill sheets K–5." },
    { title: "Class Newsletter Template (Editable)", description: "Monthly Canva-compatible parent newsletter with drag-and-drop layout." },
    { title: "End-of-Year Memory Book Printable", description: "Student keepsake booklet with prompts, photo spots, and autograph pages." },
  ],
  Budgeting: [
    { title: "Monthly Budget Planner Spreadsheet", description: "Income and expense tracker with savings goal and category breakdown." },
    { title: "Debt Payoff Tracker Printable", description: "Snowball and avalanche method tracker for up to 10 debts." },
    { title: "52-Week Savings Challenge Sheet", description: "Progressive weekly savings tracker from $1 to $1,378 a year." },
    { title: "Emergency Fund Tracker", description: "Visual savings thermometer with goal-setting page and milestone markers." },
    { title: "Grocery Budget Planner & Meal Prep Sheet", description: "Weekly grocery list, meal plan, and spending tracker in one page." },
    { title: "No-Spend Challenge Tracker", description: "30-day no-spend month accountability sheet with category exceptions." },
    { title: "Bill Payment Checklist (Monthly)", description: "One-page monthly bill tracker with due dates and confirmation column." },
    { title: "Annual Financial Goals Workbook", description: "12-page year-at-a-glance financial planning workbook with net worth tracker." },
    { title: "Sinking Fund Tracker (Multiple Goals)", description: "Track up to 8 sinking funds with target amounts and monthly contributions." },
    { title: "Cash Envelope Budget Labels & Tracker", description: "Printable cash envelope labels for every major budget category." },
  ],
  Productivity: [
    { title: "Weekly Planner Printable (Vertical Layout)", description: "7-day vertical weekly spread with time blocks and priority list." },
    { title: "Daily Planner with Habit Tracker", description: "One-page daily planner with tasks, notes, habits, and gratitude section." },
    { title: "Goal Setting Workbook (Quarterly)", description: "90-day goal framework with weekly check-ins and reflection prompts." },
    { title: "Brain Dump & Mind Map Template", description: "Structured capture pages for clearing mental clutter and organising ideas." },
    { title: "Meeting Notes Template (Reusable)", description: "Action item-focused meeting notes page with decision log section." },
    { title: "Project Tracker Kanban Board Printable", description: "To-Do / Doing / Done project board for freelancers and small teams." },
    { title: "Morning Routine Checklist (Printable)", description: "Customisable AM routine checklist to build a powerful start to the day." },
    { title: "Focus Timer Log (Pomodoro Method)", description: "25-minute session tracker with break log and daily output summary." },
    { title: "Content Calendar Template (Monthly)", description: "Social media and blog content planning grid for creators." },
    { title: "Year-at-a-Glance Calendar Printable", description: "Full 12-month bird's-eye view planner for big-picture planning." },
  ],
  Fitness: [
    { title: "30-Day Fitness Challenge Tracker", description: "Daily workout log for a beginner-friendly 30-day challenge." },
    { title: "Weekly Workout Planner Printable", description: "7-day exercise schedule with sets, reps, and cardio logging." },
    { title: "Macro & Calorie Tracking Log", description: "Daily food diary with macros, water intake, and calorie total." },
    { title: "Running Progress Tracker", description: "Weekly distance and pace log with personal record section." },
    { title: "Body Measurement & Progress Tracker", description: "Monthly measurements log with before/after comparison columns." },
    { title: "Strength Training Log Book Pages", description: "Exercise, weight, sets, and reps journal for gym-goers." },
    { title: "Yoga & Stretching Routine Printable", description: "30-pose illustrated routine chart for morning flexibility practice." },
    { title: "Water & Sleep Tracker (Daily)", description: "Hydration and sleep quality log to build healthy daily habits." },
    { title: "Meal Prep Planner (Weekly)", description: "Grocery list, meal plan, and batch-cooking schedule in one printable." },
    { title: "Weight Loss Journey Journal Pages", description: "Weekly weigh-in log with motivational quotes and habit tracker." },
  ],
  Wedding: [
    { title: "Wedding Budget Planner (Minimalist)", description: "Category-by-category wedding cost tracker with vendor payment log." },
    { title: "Guest List & RSVP Manager", description: "Printable guest list with RSVP, meal choice, and gift columns." },
    { title: "Wedding Day Timeline Template", description: "Hour-by-hour day-of schedule for bride, groom, and wedding party." },
    { title: "Vendor Contact Sheet", description: "All-in-one vendor details page with contact, contract, and payment info." },
    { title: "Seating Chart Template (Fillable)", description: "Editable table assignment grid for reception seating planning." },
    { title: "Bridal Party To-Do List Checklist", description: "Month-by-month planning checklist from 12 months to the day." },
    { title: "Honeymoon Packing List Printable", description: "His & her packing checklist with travel documents section." },
    { title: "Wedding Vows Writing Template", description: "Guided vow-writing worksheet with prompts and final draft pages." },
    { title: "Wedding Photo Shot List", description: "80+ must-have wedding photo prompts organised by ceremony and reception." },
    { title: "Thank-You Card Tracker", description: "Gift log with sent/received column to track every thank-you note." },
  ],
  "Seasonal – Summer": [
    { title: "Summer Bucket List Printable", description: "40-activity family summer checklist with check-off boxes." },
    { title: "Kids Summer Reading Log", description: "Book tracker with star ratings and reading minutes for ages 5–12." },
    { title: "Summer Weekly Activity Planner", description: "7-day summer schedule template for parents and camp counselors." },
    { title: "Road Trip Planner Pack", description: "Route planner, packing list, and trip games printable bundle." },
    { title: "Summer Chore Chart for Kids", description: "Seasonal responsibility chart with beach and sun theme graphics." },
    { title: "Camping Trip Planner & Packing List", description: "Site booking, gear checklist, and meal plan for camping weekends." },
    { title: "Summer Savings Goal Tracker", description: "Fun illustrated savings thermometer for a summer savings challenge." },
    { title: "Outdoor Scavenger Hunt Cards (Summer)", description: "30 printable nature scavenger hunt clue cards for kids ages 4–10." },
    { title: "Back-to-School Supply Checklist", description: "Printable school supply list by grade level for parents." },
    { title: "Summer Garden Planting Planner", description: "Vegetable and herb garden layout planner with watering log." },
  ],
  "Seasonal – Christmas": [
    { title: "Christmas Gift List & Budget Tracker", description: "Recipient list with gift idea, budget, bought, and wrapped columns." },
    { title: "Advent Calendar Activity Cards (24 Days)", description: "Printable daily Christmas activity cards for families." },
    { title: "Christmas Party Planning Checklist", description: "Guest list, menu, décor, and game planning sheet for holiday parties." },
    { title: "Holiday Card Address List Printable", description: "Organised address book insert for Christmas card mailing." },
    { title: "Christmas Wish List Template (Kids)", description: "Fun fillable wish list for kids to give to Santa or family." },
    { title: "Holiday Meal Planner & Recipe Cards", description: "Christmas dinner planner with blank recipe card pages." },
    { title: "12 Days of Christmas Reading Log", description: "Book-themed Christmas countdown reading tracker for children." },
    { title: "New Year's Eve Party Planning Kit", description: "Invitation, activity, and countdown timeline printable bundle." },
    { title: "Christmas Thank-You Card Template", description: "Minimalist fillable thank-you cards for holiday gifts." },
    { title: "Elf on the Shelf Ideas & Log Printable", description: "30 elf placement ideas with a nightly log page for parents." },
  ],
  "Seasonal – Halloween": [
    { title: "Halloween Party Planning Checklist", description: "Guest list, costume ideas, menu, and game planner for Halloween parties." },
    { title: "Trick-or-Treat Candy Tracker (Kids)", description: "Fun candy sorting and counting worksheet for ages 4–10." },
    { title: "Halloween Kids Activity Book", description: "Mazes, word searches, and drawing prompts with Halloween theme." },
    { title: "Costume Budget Planner", description: "DIY costume cost tracker and idea brainstorm sheet." },
    { title: "Pumpkin Carving Design Templates", description: "10 printable stencil designs for beginner pumpkin carvers." },
    { title: "Spooky Scavenger Hunt Cards", description: "20 printable Halloween scavenger hunt clue cards for kids." },
    { title: "Halloween Reading Log (October)", description: "Spooky-themed book tracker for classroom or home." },
    { title: "Haunted House Room Décor Checklist", description: "Room-by-room Halloween decorating checklist and budget tracker." },
    { title: "Halloween Bingo Cards (Set of 10)", description: "Printable 5×5 bingo cards with Halloween vocabulary and images." },
    { title: "October Daily Activity Calendar", description: "31-day Halloween countdown calendar with a mini activity each day." },
  ],
  "Self Care": [
    { title: "Self-Care Weekly Routine Checklist", description: "Wellness habit tracker covering mind, body, and soul categories." },
    { title: "Gratitude Journal Pages (Daily)", description: "Morning gratitude prompts, mood tracker, and evening reflection." },
    { title: "Mental Health Check-In Workbook", description: "Weekly mood, anxiety, and energy level tracking journal pages." },
    { title: "Digital Detox Challenge Tracker", description: "7-day screen-time reduction challenge with daily reflection prompts." },
    { title: "Self-Love Affirmation Cards (30-Day)", description: "Printable daily affirmation cards for confidence and positivity." },
    { title: "Mindfulness Meditation Log", description: "Daily meditation time, technique, and insights journal." },
    { title: "Sleep Tracking & Bedtime Routine Sheet", description: "Weekly sleep quality log with evening wind-down checklist." },
    { title: "Vision Board Template (Annual Goals)", description: "A3 printable vision board layout with category boxes and prompts." },
    { title: "Monthly Self-Care Planner", description: "30-day self-care scheduler with appointments, journaling, and habit blocks." },
    { title: "Anxiety & Stress Relief Toolkit Pages", description: "Grounding exercises, breathing guides, and coping strategy journal pages." },
  ],
  "Small Business": [
    { title: "Small Business Monthly Income Report", description: "Revenue, expenses, and profit summary template for Etsy/freelance sellers." },
    { title: "Social Media Content Calendar", description: "31-day posting planner with platform, caption, and hashtag columns." },
    { title: "Client Onboarding Welcome Packet", description: "Professional fillable client intake form and service agreement template." },
    { title: "Invoice Template (Editable PDF)", description: "Clean professional invoice with itemised service rows and payment terms." },
    { title: "Product Launch Planning Checklist", description: "Pre-launch, launch day, and post-launch task tracker for new products." },
    { title: "Email List Growth Tracker", description: "Weekly subscriber count, source, and open rate tracking sheet." },
    { title: "Business Goal Setting Workbook (Annual)", description: "Revenue goals, quarterly milestones, and weekly KPI tracking pages." },
    { title: "Etsy Shop Audit Checklist", description: "SEO, photography, pricing, and policy review checklist for Etsy sellers." },
    { title: "Customer Feedback & Review Tracker", description: "Log incoming reviews and customer feedback to spot improvement patterns." },
    { title: "Brand Style Guide Template (Fillable)", description: "Logo, colour palette, font, and tone-of-voice brand documentation pages." },
  ],
  Travel: [
    { title: "Travel Packing List Printable", description: "Comprehensive trip packing checklist by category — clothing, toiletries, docs." },
    { title: "Trip Itinerary Planner Template", description: "Day-by-day travel schedule with hotel, transport, and activity columns." },
    { title: "Travel Budget Tracker", description: "Per-day expense log with currency conversion column and running total." },
    { title: "Bucket List Destination Planner", description: "Dream destination tracking map with notes and planning pages." },
    { title: "Travel Journal Pages (Daily)", description: "Daily diary pages with sketching space, highlights, and ratings." },
    { title: "Road Trip Planning Kit", description: "Route map planner, gas cost estimator, and pit stop tracker bundle." },
    { title: "Passport & Travel Document Organiser", description: "Keep copies of visas, insurance, and bookings in one printable wallet." },
    { title: "Family Vacation Planner Pack", description: "Kid-friendly activity log, snack tracker, and packing checklist for families." },
    { title: "Airbnb & Hotel Review Comparison Sheet", description: "Side-by-side accommodation comparison spreadsheet for trip planning." },
    { title: "Travel Savings Goal Tracker", description: "Illustrated savings thermometer with milestone rewards for a dream trip." },
  ],
};

/** Return fallback ideas for a niche, or the generic FALLBACK_IDEAS if not found */
export function getFallbackIdeas(niche: string): FallbackIdea[] {
  // Exact match
  if (NICHE_FALLBACK_IDEAS[niche]) return NICHE_FALLBACK_IDEAS[niche];

  // Partial match (e.g. "Seasonal – Summer" matches "Summer")
  const key = Object.keys(NICHE_FALLBACK_IDEAS).find((k) =>
    k.toLowerCase().includes(niche.toLowerCase()) ||
    niche.toLowerCase().includes(k.toLowerCase())
  );
  return key ? NICHE_FALLBACK_IDEAS[key] : NICHE_FALLBACK_IDEAS["Productivity"];
}

// ─── SEO fallbacks keyed by niche ────────────────────────────────────────────

export const NICHE_FALLBACK_SEO: Record<string, string[]> = {
  Kids: [
    "Kids Daily Routine Chart Printable | Morning & Bedtime Schedule | Instant Download PDF",
    "Printable Daily Routine Chart for Kids | Visual Schedule for Children | Homeschool Organiser",
    "Kids Routine Checklist Printable | Daily Schedule | Editable PDF Template",
  ],
  Teachers: [
    "Teacher Lesson Planner Printable | Weekly Classroom Planner | Editable PDF Instant Download",
    "Weekly Lesson Plan Template for Teachers | K-12 Classroom Organiser | Printable PDF",
    "Editable Teacher Planner | Classroom Planning Pages | Instant Download PDF",
  ],
  Budgeting: [
    "Monthly Budget Planner Printable | Income & Expense Tracker | Instant Download PDF",
    "Budget Planner Printable | Monthly Finance Tracker | Personal Finance Organiser PDF",
    "Printable Budget Worksheet | Monthly Spending Tracker | Instant Download Planner",
  ],
  Productivity: [
    "Weekly Planner Printable | Daily Schedule | Productivity Planner PDF Instant Download",
    "Daily Planner Printable | Habit Tracker | Goal Setting Workbook | Instant Download",
    "Printable Planner Pages | Productivity Journal | Daily Schedule Template PDF",
  ],
  Fitness: [
    "Fitness Tracker Printable | Workout Log | 30-Day Challenge | Instant Download PDF",
    "Printable Workout Planner | Fitness Journal | Exercise Tracker | Instant Download",
    "Gym Workout Log Printable | Strength Training Tracker | Weight Loss Journal PDF",
  ],
  Wedding: [
    "Wedding Planner Printable | Budget Tracker | Guest List | Instant Download PDF",
    "Printable Wedding Planning Checklist | Bride Binder Inserts | Instant Download",
    "Wedding Budget Planner PDF | Vendor Tracker | Guest List Manager | Instant Download",
  ],
};

export function getFallbackSeoTitles(idea: string): string[] {
  const ideaLower = idea.toLowerCase();
  // Try to match by niche keyword
  for (const [niche, titles] of Object.entries(NICHE_FALLBACK_SEO)) {
    if (ideaLower.includes(niche.toLowerCase())) return titles;
  }
  // Generic fallback
  const word = idea.split(" ").slice(0, 3).join(" ");
  return [
    `${word} Printable | Digital Download | Instant PDF`,
    `${word} | Printable Template | Instant Download`,
    `Printable ${word} | PDF Template | Instant Download`,
  ];
}

// ─── Tags fallbacks ───────────────────────────────────────────────────────────

export const GENERIC_FALLBACK_TAGS = [
  "printable pdf",
  "digital download",
  "instant download",
  "etsy printable",
  "digital printable",
  "planner printable",
  "printable template",
  "pdf template",
  "printable art",
  "digital planner",
  "printable gift",
  "letter size pdf",
  "a4 printable",
];

export function getFallbackTags(idea: string): string[] {
  const words = idea.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter(Boolean);
  const niche = words.slice(0, 2).join(" ");
  const specific = `${niche} printable`.substring(0, 20);
  return [
    specific,
    ...GENERIC_FALLBACK_TAGS.slice(0, 12),
  ].slice(0, 13);
}
