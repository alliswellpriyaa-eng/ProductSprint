/**
 * fallback-planners.ts — Static 30-day sprint plans per niche.
 * Returned immediately when Gemini fails. Never show a blank UI.
 */

export interface FallbackDay {
  day: number;
  phase: "Setup" | "Build" | "Launch";
  title: string;
  goal: string;
  tasks: string[];
  keywords: string[];
  pricing: string;
  time: string;
  effort: "Easy" | "Medium" | "Hard";
  category: "Research" | "Design" | "SEO" | "Listing" | "Marketing" | "Launch";
  estimatedTime: string;
  completed: boolean;
}

function makeDay(
  day: number,
  phase: FallbackDay["phase"],
  title: string,
  goal: string,
  tasks: [string, string],
  keywords: [string, string, string],
  pricing: string,
  effort: FallbackDay["effort"],
  category: FallbackDay["category"]
): FallbackDay {
  const timeMap: Record<FallbackDay["effort"], string> = { Easy: "1–2 hrs", Medium: "2–3 hrs", Hard: "3–4 hrs" };
  return { day, phase, title, goal, tasks, keywords, pricing, time: timeMap[effort], effort, category, estimatedTime: timeMap[effort], completed: false };
}

// ─── Kids ─────────────────────────────────────────────────────────────────────

const KIDS: FallbackDay[] = [
  makeDay(1,"Setup","Kids Morning Routine Chart","Research top-selling kids printables on Etsy",["Search Etsy for routine charts","Note top 5 competitors"],["kids routine chart","morning checklist kids","printable for kids"],"$4–$8","Easy","Research"),
  makeDay(2,"Setup","Color & Shape Activity Book","Define your niche and target age group",["Choose ages 3–6 focus","Outline 10 activity pages"],["kids activity book","shapes worksheet","preschool printable"],"$5–$9","Easy","Research"),
  makeDay(3,"Setup","ABC Tracing Worksheet Pack","Plan a 5-page letter tracing set",["Design worksheet layout in Canva","Add dotted letter guides"],["alphabet tracing","letter worksheet","preschool ABC"],"$3–$7","Easy","Design"),
  makeDay(4,"Setup","Kids Reward Sticker Chart","Create a printable behavior tracker",["Design 4-week chart","Add sticker placement squares"],["reward chart kids","behavior tracker","sticker chart printable"],"$3–$6","Easy","Design"),
  makeDay(5,"Setup","Summer Bucket List Poster","Design a fun seasonal activity poster",["List 20 summer activities","Create colorful A4 layout"],["summer bucket list","kids summer activities","printable poster kids"],"$4–$8","Easy","Design"),
  makeDay(6,"Build","Number Tracing 1–20 Worksheet","Create a number tracing practice sheet",["Design dotted number guides","Add count-the-dots activity"],["number tracing worksheet","counting printable","math worksheet kids"],"$3–$6","Easy","Design"),
  makeDay(7,"Build","Kids Meal Planner & Grocery List","Build a family meal planning printable",["Design weekly meal grid","Add grocery checklist section"],["kids meal planner","family grocery list","meal prep printable"],"$4–$7","Easy","Design"),
  makeDay(8,"Build","Sight Words Flash Card Set","Create a 50-card sight word set",["List Dolch sight words","Design card template in Canva"],["sight words flashcards","reading printable","kindergarten words"],"$5–$10","Medium","Design"),
  makeDay(9,"Build","Kids Emotions Feelings Chart","Design a social-emotional learning tool",["Illustrate 8 core emotions","Add coping strategy prompts"],["emotions chart kids","feelings printable","SEL worksheet"],"$4–$8","Easy","Design"),
  makeDay(10,"Build","Road Trip Activity Book","Create a 20-page travel activity bundle",["Design puzzles and games","Add coloring pages"],["road trip kids printable","travel activity book","car games printable"],"$6–$12","Medium","Design"),
  makeDay(11,"Build","Kids Chore Chart Weekly","Build an editable weekly chore tracker",["Design 7-column grid","Add sticker reward section"],["kids chore chart","weekly chore list","printable chores"],"$3–$7","Easy","Design"),
  makeDay(12,"Build","Handwriting Practice Pages","Create a 10-page handwriting workbook",["Design lined practice sheets","Add letter tracing rows"],["handwriting worksheet","penmanship printable","writing practice kids"],"$4–$8","Easy","Design"),
  makeDay(13,"Build","Kids Daily Schedule Poster","Design a visual daily timeline",["Create hour-by-hour layout","Add icon illustrations"],["kids daily schedule","visual schedule printable","daily routine chart"],"$4–$7","Easy","Design"),
  makeDay(14,"Build","Shapes & Colors Coloring Book","Create a 12-page themed coloring set",["Illustrate 12 shape scenes","Add color-by-name labels"],["coloring book printable","shapes coloring pages","kids coloring PDF"],"$4–$8","Easy","Design"),
  makeDay(15,"Build","Kindergarten Math Worksheets","Build a 10-page counting worksheet pack",["Design addition introduction sheets","Add number line activities"],["kindergarten math","counting worksheets","addition printable"],"$5–$9","Medium","Design"),
  makeDay(16,"Build","Kids Reading Log Bookmark","Create a printable reading tracker",["Design bookmark-sized log","Add star rating column"],["reading log kids","book tracker printable","kids reading chart"],"$3–$6","Easy","Design"),
  makeDay(17,"Build","Dinosaur Coloring Activity Pack","Create a themed 15-page activity set",["Illustrate 10 dinosaur scenes","Add dino fact labels"],["dinosaur coloring pages","kids activity pack","dino printable"],"$5–$10","Medium","Design"),
  makeDay(18,"Build","Kids Goal Setting Journal","Design a simple dream-big journal",["Create monthly goal page","Add weekly reflection prompts"],["kids goal journal","children planner","growth mindset printable"],"$5–$10","Medium","Design"),
  makeDay(19,"Build","Alphabet Coloring Pages A–Z","Create 26 illustrated letter pages",["Design one scene per letter","Add tracing line below each"],["alphabet coloring pages","ABC printable","letter coloring sheets"],"$5–$9","Medium","Design"),
  makeDay(20,"Build","Kids Worry Journal Pages","Create a feelings and worry worksheet",["Design calming prompt pages","Add draw-your-feelings section"],["worry journal kids","anxiety worksheet child","feelings journal printable"],"$4–$8","Easy","Design"),
  makeDay(21,"Launch","List Morning Routine Chart","Publish your first Etsy listing",["Write SEO title and description","Upload PNG and PDF files"],["kids printable Etsy","routine chart download","instant download kids"],"$4–$8","Easy","Listing"),
  makeDay(22,"Launch","Add 13 Etsy Tags","Optimize tags for your top product",["Research long-tail keywords","Add 13 relevant tags"],["etsy tags kids","printable tags etsy","seo etsy listing"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pin to Pinterest","Drive traffic with Pinterest posts",["Create 3 Pinterest graphics","Pin to kids printable board"],["pinterest kids printable","etsy traffic","printable promotion"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Bundle 3 Products","Create a value bundle listing",["Group 3 related printables","Price at 20% discount"],["printable bundle kids","activity bundle","kids bundle PDF"],"$10–$18","Easy","Listing"),
  makeDay(25,"Launch","Post on Etsy Community","Get early visibility and feedback",["Share in Etsy Seller Community","Ask for listing critique"],["etsy community","etsy seller tips","new shop launch"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","Create Shop Banner","Design a branded shop header",["Design 3360×840 banner in Canva","Add shop name and tagline"],["etsy shop branding","shop banner","etsy storefront"],"$0","Easy","Marketing"),
  makeDay(27,"Launch","Add 5 More Products","Expand your catalog",["List 5 products from Build phase","Stagger listings over 2 days"],["etsy listing strategy","shop catalog","printable shop"],"$3–$12","Medium","Listing"),
  makeDay(28,"Launch","Share on Instagram","Post a reel or carousel",["Create 3-slide carousel","Add link in bio to Etsy shop"],["instagram printable seller","etsy shop instagram","kids printable reel"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Check Analytics","Review first data and adjust",["Check Etsy Stats views and favorites","Update underperforming listings"],["etsy analytics","etsy shop stats","listing optimization"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Sprint Complete Review","Plan next 30 days",["List top 3 best products","Set goal for Month 2"],["etsy growth plan","printable business","etsy side hustle"],"$0","Easy","Launch"),
];

// ─── Fitness ──────────────────────────────────────────────────────────────────

const FITNESS: FallbackDay[] = [
  makeDay(1,"Setup","30-Day Fitness Challenge Tracker","Research bestselling fitness printables",["Search Etsy for fitness trackers","Identify top 5 sellers"],["fitness tracker printable","workout log etsy","30 day challenge"],"$4–$9","Easy","Research"),
  makeDay(2,"Setup","Weekly Workout Planner","Plan a 7-day exercise schedule template",["Outline days and exercise slots","Choose clean minimal design"],["weekly workout planner","exercise schedule","gym printable"],"$4–$8","Easy","Research"),
  makeDay(3,"Setup","Macro & Calorie Tracker","Design a nutrition logging sheet",["Create daily macro tracking grid","Add water intake section"],["macro tracker printable","calorie log","nutrition worksheet"],"$4–$8","Easy","Design"),
  makeDay(4,"Setup","Body Measurement Log","Build a body progress tracking sheet",["Design monthly measurement table","Add progress photo prompt"],["body measurement log","progress tracker fitness","weight loss printable"],"$3–$7","Easy","Design"),
  makeDay(5,"Setup","Running Log Sheet","Create a running mileage tracker",["Design weekly run log","Add pace and distance columns"],["running log printable","run tracker","marathon training sheet"],"$3–$7","Easy","Design"),
  makeDay(6,"Build","Habit Tracker 30-Day Grid","Design a monthly habit grid",["Create 30-row habit table","Add emoji habit icons"],["habit tracker printable","30 day habit","daily habit log"],"$3–$6","Easy","Design"),
  makeDay(7,"Build","Meal Prep Weekly Planner","Create a meal planning and prep sheet",["Design 7-day meal columns","Add shopping list section"],["meal prep planner","weekly meal plan","healthy eating printable"],"$4–$8","Easy","Design"),
  makeDay(8,"Build","Yoga Pose Reference Sheet","Design a 12-pose reference card",["Illustrate 12 common poses","Add breathing cues"],["yoga pose chart","yoga printable","beginner yoga sheet"],"$5–$9","Medium","Design"),
  makeDay(9,"Build","Weight Training Log Book","Build a strength training tracker",["Design set/rep/weight columns","Add personal best tracking row"],["weight training log","strength tracker","gym workout log"],"$5–$10","Medium","Design"),
  makeDay(10,"Build","Water Intake Tracker","Create a daily hydration log",["Design 8-cup daily tracker","Add weekly progress chart"],["water tracker printable","hydration log","drink water reminder"],"$3–$6","Easy","Design"),
  makeDay(11,"Build","HIIT Workout Card Set","Create a 20-card HIIT exercise deck",["List 20 HIIT exercises","Design printable card template"],["HIIT workout cards","exercise cards printable","home workout printable"],"$6–$12","Medium","Design"),
  makeDay(12,"Build","Fitness Goal Setter","Design a quarterly fitness goal page",["Create SMART goal template","Add milestone checkboxes"],["fitness goal sheet","workout goal printable","health goal tracker"],"$4–$8","Easy","Design"),
  makeDay(13,"Build","Sleep Tracker Journal Page","Build a sleep quality log",["Design nightly sleep entry","Add mood and energy columns"],["sleep tracker printable","sleep log journal","rest tracker"],"$3–$7","Easy","Design"),
  makeDay(14,"Build","Protein Meal Plan Template","Create a high-protein meal planner",["Design 7-day protein meal grid","Add macro summary row"],["protein meal plan","high protein diet printable","muscle building diet"],"$4–$9","Easy","Design"),
  makeDay(15,"Build","5K Training Plan Printable","Build a beginner 5K training schedule",["Design 8-week run plan","Add rest day markers"],["5K training plan","beginner running schedule","run printable"],"$5–$9","Medium","Design"),
  makeDay(16,"Build","Gym Bag Checklist","Design a pre-gym preparation checklist",["List 20 gym essentials","Create checklist card format"],["gym checklist printable","workout bag list","gym packing list"],"$3–$6","Easy","Design"),
  makeDay(17,"Build","Self-Care Sunday Planner","Create a weekly wellness day planner",["Design morning to evening self-care","Add gratitude and reflection prompts"],["self care planner","wellness printable","sunday reset planner"],"$4–$8","Easy","Design"),
  makeDay(18,"Build","Before & After Progress Tracker","Design a visual transformation log",["Create photo comparison page","Add measurement columns"],["before after tracker","body transformation printable","fitness progress log"],"$4–$8","Easy","Design"),
  makeDay(19,"Build","Workout Intensity Tracker","Build a perceived exertion log",["Design RPE scale chart","Add weekly intensity summary"],["workout intensity log","RPE tracker printable","exercise log"],"$3–$7","Easy","Design"),
  makeDay(20,"Build","Monthly Fitness Review Page","Create a month-end reflection sheet",["Design wins and losses section","Add next month goal column"],["monthly fitness review","progress reflection","fitness journal page"],"$3–$6","Easy","Design"),
  makeDay(21,"Launch","List Fitness Challenge Tracker","Publish your first fitness listing",["Write keyword-rich Etsy title","Upload PNG and PDF versions"],["fitness printable etsy","workout tracker download","instant download fitness"],"$4–$9","Easy","Listing"),
  makeDay(22,"Launch","Research Etsy SEO Tags","Find 13 high-traffic fitness tags",["Use eRank or Marmalead","Add tags to all listings"],["fitness etsy seo","etsy tags fitness","workout printable tags"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest Strategy","Create fitness-focused Pinterest pins",["Design 3 vertical pin graphics","Pin to fitness printable board"],["pinterest fitness printable","etsy traffic fitness","workout pin"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Fitness Bundle","Bundle 5 complementary products",["Group tracker + planner + log","Price at 25% discount"],["fitness printable bundle","workout bundle PDF","fitness kit printable"],"$12–$20","Easy","Listing"),
  makeDay(25,"Launch","Post in Etsy Community","Share new listings for feedback",["Post in Etsy Seller forum","Request honest reviews"],["etsy community seller","new listing feedback","etsy shop tips"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","Instagram Reels Post","Create a short demo video",["Film using printable","Add trending audio"],["instagram fitness printable","etsy seller reel","workout printable video"],"$0","Medium","Marketing"),
  makeDay(27,"Launch","List 5 More Products","Expand fitness catalog",["Publish remaining Build products","Add to Featured Listings"],["etsy fitness shop","printable catalog","workout downloads"],"$3–$12","Easy","Listing"),
  makeDay(28,"Launch","Email Early Buyers","Ask for a review",["Draft short thank-you message","Include discount code for next purchase"],["etsy review request","customer thank you","etsy repeat buyer"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Check Etsy Stats","Analyze performance data",["Review views and conversion rates","Update weakest listing titles"],["etsy analytics fitness","shop stats review","listing optimization"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Complete","Plan Month 2 strategy",["List top 3 performing products","Set revenue goal for Month 2"],["etsy growth strategy","printable business","fitness shop etsy"],"$0","Easy","Launch"),
];

// ─── Budgeting ────────────────────────────────────────────────────────────────

const BUDGETING: FallbackDay[] = [
  makeDay(1,"Setup","Zero-Based Budget Planner","Research top finance printables on Etsy",["Search 'budget planner' on Etsy","Note price range and reviews"],["budget planner printable","zero based budget","monthly budget sheet"],"$4–$9","Easy","Research"),
  makeDay(2,"Setup","Monthly Expense Tracker","Plan a 12-category expense log",["List common expense categories","Design 4-week grid layout"],["expense tracker printable","monthly spending log","budget worksheet"],"$4–$8","Easy","Research"),
  makeDay(3,"Setup","Debt Payoff Snowball Tracker","Create a visual debt paydown chart",["Design debt listing table","Add payoff date estimator"],["debt snowball printable","debt payoff tracker","debt free journey"],"$4–$8","Easy","Design"),
  makeDay(4,"Setup","Savings Goal Thermometer","Design a visual savings progress bar",["Create fillable thermometer graphic","Add milestone markers"],["savings goal printable","savings tracker visual","money goal chart"],"$3–$6","Easy","Design"),
  makeDay(5,"Setup","Bill Payment Checklist","Build a monthly bills tracker",["List 20 common bills","Design checkbox grid by week"],["bill payment tracker","monthly bills checklist","bill organizer printable"],"$3–$7","Easy","Design"),
  makeDay(6,"Build","Paycheck Budget Worksheet","Create a biweekly budget planner",["Design income minus expenses layout","Add leftover savings section"],["paycheck budget planner","biweekly budget printable","paycheck tracker"],"$4–$8","Easy","Design"),
  makeDay(7,"Build","No-Spend Challenge Tracker","Design a 30-day no-spend log",["Create daily spending checkbox","Add reflection prompt column"],["no spend challenge","no spend printable","spending freeze tracker"],"$3–$6","Easy","Design"),
  makeDay(8,"Build","Emergency Fund Tracker","Build a savings milestone log",["Design savings tier progress","Add motivation quotes"],["emergency fund tracker","savings milestone printable","financial safety net"],"$3–$7","Easy","Design"),
  makeDay(9,"Build","Annual Budget Overview","Create a 12-month budget summary",["Design monthly column grid","Add year-end net worth row"],["annual budget planner","yearly budget printable","12 month budget"],"$5–$10","Medium","Design"),
  makeDay(10,"Build","Cash Envelope System Kit","Create a printable cash envelope set",["Design 8 category envelopes","Add budget amount fields"],["cash envelope printable","cash stuffing printable","budget envelope system"],"$5–$10","Medium","Design"),
  makeDay(11,"Build","Sinking Fund Tracker","Design a multi-goal savings sheet",["Create 6-fund tracking grid","Add monthly contribution column"],["sinking fund tracker","savings fund printable","multiple savings goals"],"$4–$8","Easy","Design"),
  makeDay(12,"Build","Weekly Budget Check-In","Build a mini weekly finance review",["Design income vs spend summary","Add 3 weekly money questions"],["weekly budget check","financial check in","weekly money review"],"$3–$6","Easy","Design"),
  makeDay(13,"Build","Holiday Spending Planner","Create a Christmas budget worksheet",["List gift categories by person","Design budget vs actual columns"],["holiday budget planner","Christmas spending printable","gift budget tracker"],"$4–$8","Easy","Design"),
  makeDay(14,"Build","Grocery Budget Tracker","Design a weekly grocery log",["Create store section columns","Add unit price comparison row"],["grocery budget tracker","food spending log","weekly grocery planner"],"$3–$7","Easy","Design"),
  makeDay(15,"Build","Subscription Audit Worksheet","Build a subscription review sheet",["List all streaming and app subs","Add monthly cost and keep/cancel column"],["subscription tracker","monthly subscriptions log","cancel subscriptions printable"],"$3–$6","Easy","Design"),
  makeDay(16,"Build","Net Worth Tracker","Create a quarterly net worth log",["Design assets minus liabilities table","Add trend chart section"],["net worth tracker printable","financial health log","wealth tracker"],"$4–$8","Easy","Design"),
  makeDay(17,"Build","Student Budget Planner","Design a college student budget sheet",["Create semester income and expense grid","Add financial aid tracking row"],["student budget printable","college budget planner","university finances"],"$4–$8","Easy","Design"),
  makeDay(18,"Build","Retirement Savings Planner","Build a retirement contribution tracker",["Design 401k and IRA log","Add employer match calculator"],["retirement savings tracker","401k printable","retirement planner printable"],"$5–$9","Medium","Design"),
  makeDay(19,"Build","Baby Budget Planner","Create a new parent expense tracker",["Design first-year budget categories","Add one-time vs recurring columns"],["baby budget planner","new parent expenses","baby shower printable budget"],"$4–$8","Easy","Design"),
  makeDay(20,"Build","Financial Goals Vision Board","Design a 2025 money goal poster",["Create goal category sections","Add inspiring money affirmations"],["financial goals printable","money vision board","2025 budget goals"],"$4–$8","Easy","Design"),
  makeDay(21,"Launch","List Monthly Budget Planner","Publish first finance listing",["Write keyword-rich Etsy title","Set price at $4.99"],["budget planner etsy","finance printable download","monthly budget instant download"],"$4–$9","Easy","Listing"),
  makeDay(22,"Launch","Research Finance Etsy Tags","Find 13 high-traffic budget tags",["Research with eRank free tier","Apply to all budget listings"],["etsy finance tags","budget printable seo","money printable tags"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest Finance Pins","Drive traffic via finance boards",["Create 3 pin graphics in Canva","Pin to personal finance board"],["pinterest budget printable","finance pin etsy","money printable pinterest"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Budget Bundle","Bundle 5 finance products",["Group monthly + weekly + savings","Set bundle price at 30% off"],["budget bundle printable","finance printable kit","money management bundle"],"$14–$22","Easy","Listing"),
  makeDay(25,"Launch","TikTok Finance Clip","Post a short budget demo",["Show filling in budget sheet","Add personal finance trending audio"],["tiktok budget printable","finance tiktok etsy","cash stuffing tiktok"],"$0","Medium","Marketing"),
  makeDay(26,"Launch","List All Build Products","Publish remaining 15 products",["Upload all PDFs to Etsy","Stagger listings over 3 days"],["etsy finance shop","budget printable catalog","finance downloads etsy"],"$3–$10","Easy","Listing"),
  makeDay(27,"Launch","Post in Finance Communities","Share in budget Facebook groups",["Join 2 budget/finance groups","Share listing link with tips post"],["budget facebook group","finance community etsy","printable promotion"],"$0","Easy","Marketing"),
  makeDay(28,"Launch","Run a 20% Off Sale","Attract first buyers with discount",["Set 7-day sale on Etsy","Post sale announcement on Instagram"],["etsy sale finance","discount printable","budget planner sale"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Review Etsy Analytics","Check views and favorites",["Review traffic sources","Update titles with better keywords"],["etsy stats finance","listing analytics","seo update etsy"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Review","Set Month 2 goals",["Count total revenue and views","Plan 10 new products for Month 2"],["etsy finance growth","printable business plan","budgeting shop etsy"],"$0","Easy","Launch"),
];

// ─── Teachers ─────────────────────────────────────────────────────────────────

const TEACHERS: FallbackDay[] = [
  makeDay(1,"Setup","Teacher Weekly Lesson Planner","Research top teacher printables",["Search 'teacher planner' on Etsy","List top 10 bestsellers"],["teacher planner printable","lesson plan template","teacher weekly planner"],"$5–$12","Easy","Research"),
  makeDay(2,"Setup","Classroom Jobs Chart","Plan a visual classroom duties chart",["List 15 common classroom jobs","Design rotating job wheel"],["classroom jobs chart","classroom helpers printable","job board teacher"],"$4–$8","Easy","Research"),
  makeDay(3,"Setup","Student Behavior Log","Create a classroom behavior tracker",["Design daily behavior rating grid","Add parent signature section"],["behavior log teacher","classroom management printable","student behavior tracker"],"$4–$8","Easy","Design"),
  makeDay(4,"Setup","Reading Log for Students","Build a reading tracking sheet",["Design book title and rating columns","Add parent sign-off row"],["reading log printable","student reading tracker","book log classroom"],"$3–$7","Easy","Design"),
  makeDay(5,"Setup","Parent Communication Log","Design a home-school contact tracker",["Create date and topic columns","Add follow-up action row"],["parent communication log","teacher contact log","school home communication"],"$4–$8","Easy","Design"),
  makeDay(6,"Build","Classroom Seating Chart Template","Create an editable seating layout",["Design 5-row desk grid","Add name label placeholders"],["seating chart template","classroom layout printable","editable seating plan"],"$4–$8","Easy","Design"),
  makeDay(7,"Build","Student Data Tracking Sheet","Build an assessment tracking grid",["Create student roster rows","Add subject grade columns"],["student data tracker","grade tracking sheet","assessment printable teacher"],"$5–$9","Medium","Design"),
  makeDay(8,"Build","Substitute Teacher Folder","Create a sub plans printable pack",["Design daily schedule sheet","Add class rules and routine cards"],["sub plans printable","substitute teacher folder","emergency sub plans"],"$6–$12","Medium","Design"),
  makeDay(9,"Build","Classroom Newsletter Template","Design a monthly parent newsletter",["Create 4-section newsletter layout","Add class news and upcoming events"],["classroom newsletter","teacher newsletter template","parent communication printable"],"$4–$8","Easy","Design"),
  makeDay(10,"Build","Morning Meeting Cards","Create daily discussion prompt cards",["Write 30 discussion prompts","Design printable card template"],["morning meeting cards","classroom discussion prompts","daily circle time cards"],"$5–$10","Medium","Design"),
  makeDay(11,"Build","Lesson Plan Template 5-Day","Build a week-long lesson planner",["Design 5-column lesson grid","Add learning objectives row"],["lesson plan template","5 day lesson planner","teacher weekly planning"],"$4–$8","Easy","Design"),
  makeDay(12,"Build","Student Self-Assessment Rubric","Create a reflection checklist",["Design I can statement checkboxes","Add effort rating scale"],["student self assessment","reflection rubric printable","learning checklist classroom"],"$3–$7","Easy","Design"),
  makeDay(13,"Build","Classroom Decor Bundle","Design matching classroom labels",["Create 50 label set in Canva","Add desk tags and bin labels"],["classroom labels printable","classroom decor bundle","editable classroom labels"],"$6–$12","Medium","Design"),
  makeDay(14,"Build","Teacher Self-Care Planner","Create a wellness planner for teachers",["Design daily wins and stress release","Add weekend recharge prompts"],["teacher self care planner","teacher wellness printable","educator burnout prevention"],"$5–$10","Easy","Design"),
  makeDay(15,"Build","Differentiated Task Cards","Build a set of 3-level task cards",["Write 30 tasks across 3 levels","Design color-coded card template"],["differentiated task cards","leveled task cards","tiered activity cards"],"$6–$12","Medium","Design"),
  makeDay(16,"Build","Grade Book Spreadsheet","Design a printable grade tracker",["Create 30-student roster","Add 10 assignment columns"],["grade book printable","classroom grade tracker","teacher grade sheet"],"$4–$8","Easy","Design"),
  makeDay(17,"Build","Classroom Rules Poster Set","Create a 5-rule poster set",["Design 5 matching rule posters","Add growth mindset border"],["classroom rules poster","class rules printable","classroom management decor"],"$5–$9","Easy","Design"),
  makeDay(18,"Build","IEP Accommodation Tracker","Build a student support log",["Create student accommodation table","Add review date column"],["IEP tracker printable","accommodation log teacher","special education printable"],"$5–$10","Medium","Design"),
  makeDay(19,"Build","Exit Ticket Templates","Create a set of 10 exit slips",["Design 4-per-page exit ticket","Add understanding rating scale"],["exit ticket printable","formative assessment cards","exit slip template"],"$4–$8","Easy","Design"),
  makeDay(20,"Build","Teacher Gratitude Journal","Design a daily positivity journal",["Create 3 daily reflection prompts","Add weekly wins page"],["teacher gratitude journal","educator journal printable","positive teacher planner"],"$5–$9","Easy","Design"),
  makeDay(21,"Launch","List Teacher Planner","Publish your first teacher listing",["Write SEO-optimized listing title","Upload PDF and PNG previews"],["teacher planner etsy","teacher printable download","classroom planner instant download"],"$5–$12","Easy","Listing"),
  makeDay(22,"Launch","Research Teacher Etsy Tags","Find 13 high-traffic teacher tags",["Use Etsy search suggestions","Apply tags to first 5 listings"],["etsy tags teacher","classroom printable seo","teacher download tags"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest for Teachers","Pin to teacher resource boards",["Create 3 tall pin graphics","Pin to teacher resource board"],["pinterest teacher printable","etsy teacher resources","classroom printable pin"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Classroom Bundle","Bundle 5 teacher products",["Group planner + tracker + labels","Price at 20% off individual total"],["classroom printable bundle","teacher resource bundle","back to school bundle"],"$15–$25","Easy","Listing"),
  makeDay(25,"Launch","Share in Teacher Groups","Post in TPT and Facebook teacher groups",["Share in 2 teacher Facebook groups","Post listing link with teaching tip"],["teachers pay teachers community","teacher facebook group","teacher resource share"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","Back to School Campaign","Create seasonal promotions",["Design 3 back to school pins","Run 10% off sale in August"],["back to school printable","teacher back to school","classroom decor sale"],"$0","Easy","Marketing"),
  makeDay(27,"Launch","List 5 More Products","Expand teacher catalog",["Upload 5 more Build products","Add Featured Listings"],["teacher shop etsy","classroom printable catalog","educator downloads"],"$4–$12","Easy","Listing"),
  makeDay(28,"Launch","Email Thank You Note","Send buyers a review request",["Draft a polite review request","Add coupon code for return visit"],["etsy review teacher","seller thank you","etsy coupon code"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Check Etsy Stats","Analyze teacher listing performance",["Review which listings got views","Update underperforming listing titles"],["etsy analytics teacher","shop stats classroom","listing seo update"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Complete","Plan next 30 days",["List top 3 products by views","Set Month 2 revenue goal"],["teacher shop growth","etsy printable business","classroom resources etsy"],"$0","Easy","Launch"),
];

// ─── Self-Care ────────────────────────────────────────────────────────────────

const SELF_CARE: FallbackDay[] = [
  makeDay(1,"Setup","Daily Self-Care Checklist","Research top wellness printables",["Search 'self care printable' on Etsy","Note top products and prices"],["self care checklist","wellness printable","daily self care routine"],"$4–$8","Easy","Research"),
  makeDay(2,"Setup","Morning Routine Planner","Design a calm morning ritual planner",["List 10 common morning habits","Create time-blocked layout"],["morning routine planner","morning ritual printable","daily routine worksheet"],"$4–$8","Easy","Research"),
  makeDay(3,"Setup","Gratitude Journal Pages","Create a 30-page gratitude journal",["Write 3 daily gratitude prompts","Design clean minimal layout"],["gratitude journal printable","daily gratitude pages","gratitude worksheet"],"$5–$10","Easy","Design"),
  makeDay(4,"Setup","Mood Tracker Monthly","Build a colorful mood log",["Design 31-day bubble grid","Add emotion key legend"],["mood tracker printable","monthly mood chart","emotion log printable"],"$3–$7","Easy","Design"),
  makeDay(5,"Setup","Evening Wind-Down Routine","Design a nighttime ritual planner",["List calming evening activities","Create checklist with time slots"],["evening routine planner","night routine printable","bedtime routine checklist"],"$3–$7","Easy","Design"),
  makeDay(6,"Build","Weekly Self-Care Planner","Create a 7-day wellness planner",["Design daily self-care blocks","Add weekly reflection section"],["weekly self care planner","wellness weekly planner","self care schedule"],"$4–$8","Easy","Design"),
  makeDay(7,"Build","Affirmations Card Set","Design 50 daily affirmation cards",["Write 50 positive affirmations","Design printable card template"],["affirmation cards printable","positive affirmations deck","daily affirmation cards"],"$5–$10","Medium","Design"),
  makeDay(8,"Build","Anxiety Relief Worksheet","Build a CBT-style thought log",["Create thought challenging prompts","Add breathing exercise reminder"],["anxiety worksheet printable","CBT thought log","stress relief printable"],"$4–$8","Easy","Design"),
  makeDay(9,"Build","Self-Love Journal Bundle","Create a 60-page love yourself journal",["Write 60 self-discovery prompts","Design warm typography layout"],["self love journal printable","inner child healing journal","self discovery prompts"],"$6–$12","Medium","Design"),
  makeDay(10,"Build","Habit Tracker for Wellness","Design a 30-habit monthly grid",["List 10 wellness habits","Create daily checkbox grid"],["habit tracker wellness","health habit printable","self care habit log"],"$3–$7","Easy","Design"),
  makeDay(11,"Build","Vision Board Template","Create a goal visualization page",["Design 9-section vision grid","Add intention setting prompts"],["vision board printable","goal vision board","manifestation printable"],"$4–$8","Easy","Design"),
  makeDay(12,"Build","Stress Management Planner","Build a weekly stress log",["Create trigger and coping section","Add weekly stress rating"],["stress management printable","stress relief planner","anxiety management worksheet"],"$4–$8","Easy","Design"),
  makeDay(13,"Build","Digital Detox Challenge","Design a 7-day screen-free planner",["List offline activities per day","Create daily challenge card"],["digital detox printable","screen free challenge","phone break planner"],"$3–$6","Easy","Design"),
  makeDay(14,"Build","Sleep Journal Pages","Create a detailed sleep quality log",["Design bedtime routine tracker","Add dream journal section"],["sleep journal printable","sleep log pages","dream journal printable"],"$4–$8","Easy","Design"),
  makeDay(15,"Build","Monthly Reflection Sheet","Design a month-end review page",["Create wins and lessons columns","Add next month intentions"],["monthly reflection printable","end of month review","life reflection journal"],"$3–$7","Easy","Design"),
  makeDay(16,"Build","Body Scan Meditation Guide","Create a guided body scan printable",["Write 10-step body scan script","Design calming layout"],["meditation guide printable","body scan worksheet","mindfulness printable"],"$4–$8","Easy","Design"),
  makeDay(17,"Build","Bucket List Planner","Design a life experiences tracker",["Create 100 items bucket list","Add completion checkbox"],["bucket list printable","life goals list","100 things to do list"],"$4–$8","Easy","Design"),
  makeDay(18,"Build","Daily Mindfulness Journal","Create a 5-minute mindfulness log",["Write one present moment prompt","Add 3 gratitude lines"],["mindfulness journal printable","5 minute journal","daily mindfulness printable"],"$4–$8","Easy","Design"),
  makeDay(19,"Build","Self-Care Assessment Quiz","Design a wellness check-in sheet",["Create 20 self-care questions","Add scoring key and recommendations"],["self care quiz printable","wellness assessment","self care audit worksheet"],"$3–$7","Easy","Design"),
  makeDay(20,"Build","Boundaries Setting Worksheet","Create a personal limits planner",["Design 4 boundary categories","Add scripts for each scenario"],["boundaries worksheet printable","setting limits journal","boundary setting guide"],"$4–$8","Easy","Design"),
  makeDay(21,"Launch","List Daily Self-Care Checklist","Publish first wellness listing",["Write Etsy SEO title","Upload PDF and preview PNG"],["self care printable etsy","wellness download instant","self care checklist download"],"$4–$8","Easy","Listing"),
  makeDay(22,"Launch","Research Wellness Tags","Find 13 top wellness Etsy tags",["Research with Etsy search bar","Apply tags to first 5 listings"],["etsy wellness tags","self care printable seo","mindfulness etsy tags"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest Wellness Boards","Pin to self-care boards",["Create 3 pin graphics in Canva","Pin to wellness and self-care boards"],["pinterest self care printable","wellness pin etsy","mindfulness pinterest"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Wellness Bundle","Bundle 5 related products",["Group journal + tracker + affirmations","Price at 25% off"],["wellness bundle printable","self care kit PDF","mindfulness bundle etsy"],"$12–$20","Easy","Listing"),
  makeDay(25,"Launch","Share on Instagram","Post wellness content with CTA",["Create carousel of printable pages","Add Etsy link in bio"],["instagram self care printable","wellness shop instagram","mindfulness printable reel"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","List All Build Products","Publish remaining 15 products",["Upload all PDFs","Stagger 3 listings per day"],["etsy wellness shop","self care printable catalog","mindfulness downloads"],"$3–$12","Easy","Listing"),
  makeDay(27,"Launch","Post in Wellness Facebook Groups","Promote in communities",["Join 2 wellness groups","Share listing with helpful tip"],["wellness community etsy","self care group facebook","mindfulness community"],"$0","Easy","Marketing"),
  makeDay(28,"Launch","Run a Sale","Offer 15% off to attract buyers",["Set 5-day Etsy sale","Post about it on Instagram stories"],["etsy wellness sale","self care printable discount","mindfulness sale etsy"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Check Analytics","Review views and conversions",["Check Etsy Stats dashboard","Update 2 underperforming listings"],["etsy analytics wellness","shop stats self care","listing optimization"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Complete","Plan Month 2 strategy",["Identify top 3 products","Set revenue goal for next month"],["etsy growth wellness","self care printable business","mindfulness shop etsy"],"$0","Easy","Launch"),
];

// ─── Wedding ──────────────────────────────────────────────────────────────────

const WEDDING: FallbackDay[] = [
  makeDay(1,"Setup","Wedding Budget Planner","Research top wedding printables on Etsy",["Search 'wedding planner printable'","Note bestsellers and prices"],["wedding budget planner","wedding planning printable","bridal budget tracker"],"$6–$15","Easy","Research"),
  makeDay(2,"Setup","Guest List Tracker","Design a wedding guest management sheet",["Create 150-row guest roster","Add RSVP and dietary columns"],["wedding guest list","RSVP tracker printable","guest management wedding"],"$5–$10","Easy","Research"),
  makeDay(3,"Setup","Wedding Timeline Template","Create a day-of schedule printable",["Design hour-by-hour timeline","Add vendor call-time section"],["wedding day timeline","wedding schedule printable","day of wedding template"],"$5–$10","Easy","Design"),
  makeDay(4,"Setup","Vendor Contact Sheet","Build a wedding vendor tracker",["List 15 vendor categories","Add contact and deposit columns"],["wedding vendor tracker","vendor contact sheet","wedding supplier list"],"$4–$8","Easy","Design"),
  makeDay(5,"Setup","Seating Chart Template","Design a printable seating layout",["Create table number grid","Add guest name placeholders"],["wedding seating chart","seating plan printable","table arrangement template"],"$5–$10","Easy","Design"),
  makeDay(6,"Build","Wedding Checklist 12 Months","Create a full planning timeline",["List tasks by month","Design 12-section layout"],["wedding planning checklist","12 month wedding timeline","bride to do list"],"$5–$10","Medium","Design"),
  makeDay(7,"Build","Bridal Shower Planner","Design a party planning printable",["Create budget and guest sections","Add game and activity planner"],["bridal shower planner","bachelorette party printable","bridal party planning"],"$5–$9","Easy","Design"),
  makeDay(8,"Build","Honeymoon Itinerary Template","Build a travel planning printable",["Design daily schedule layout","Add packing list section"],["honeymoon itinerary","honeymoon planner printable","travel planning template"],"$5–$10","Easy","Design"),
  makeDay(9,"Build","Wedding Vow Booklet","Create a printable vow ceremony card",["Design elegant card layout","Add writing lines for vows"],["wedding vow booklet","ceremony card printable","vow writing template"],"$5–$10","Easy","Design"),
  makeDay(10,"Build","Table Numbers Printable Set","Design 1–30 table number cards",["Create matching table card template","Add floral border design"],["table numbers printable","wedding table cards","wedding decor printable"],"$5–$10","Easy","Design"),
  makeDay(11,"Build","Menu Card Template","Create a printable dinner menu card",["Design 4x6 menu card","Add editable text fields"],["menu card printable","wedding menu template","dinner menu card"],"$4–$8","Easy","Design"),
  makeDay(12,"Build","Wedding Photo Checklist","Build a shot list for photographers",["List 50 must-have wedding photos","Design checkbox format"],["wedding photo checklist","shot list printable","photography checklist wedding"],"$4–$8","Easy","Design"),
  makeDay(13,"Build","Flower Girl Checklist","Create a wedding party role card",["List flower girl day-of duties","Design kids-friendly card"],["flower girl checklist","wedding party printable","flower girl card"],"$3–$6","Easy","Design"),
  makeDay(14,"Build","Thank You Card Tracker","Design a gift and thank-you log",["Create gift giver and item columns","Add thank you sent checkbox"],["thank you card tracker","wedding gift log","thank you letter tracker"],"$4–$8","Easy","Design"),
  makeDay(15,"Build","Wedding Morning Routine Card","Create a bride preparation checklist",["Design 6am to 2pm timeline","Add beauty and logistics sections"],["bride morning checklist","wedding day routine","getting ready printable"],"$4–$8","Easy","Design"),
  makeDay(16,"Build","Anniversary Date Night Planner","Build a couple's activity planner",["Design monthly date night page","Add bucket list section"],["anniversary planner","date night printable","couple activity planner"],"$4–$8","Easy","Design"),
  makeDay(17,"Build","Wedding Speech Template","Create a printable toast outline",["Design intro, body, close structure","Add timing tips"],["wedding speech template","toast printable","best man speech outline"],"$4–$8","Easy","Design"),
  makeDay(18,"Build","Reception Game Cards","Design printable wedding games",["Create 3 wedding trivia games","Design card deck format"],["wedding reception games","printable wedding games","reception activity cards"],"$5–$10","Medium","Design"),
  makeDay(19,"Build","Engagement Party Planner","Create an engagement celebration guide",["Design venue and guest checklist","Add budget tracker section"],["engagement party planner","engagement printable","party planning checklist"],"$5–$9","Easy","Design"),
  makeDay(20,"Build","Wedding Memories Journal","Design a couple's keepsake journal",["Create 30 relationship memory prompts","Design romantic typography layout"],["wedding journal printable","couple memories book","love story journal"],"$6–$12","Medium","Design"),
  makeDay(21,"Launch","List Wedding Budget Planner","Publish first wedding listing",["Write keyword-rich listing title","Upload PDF and PNG mockup"],["wedding planner etsy","bridal printable download","wedding budget instant download"],"$6–$15","Easy","Listing"),
  makeDay(22,"Launch","Research Wedding Etsy Tags","Find 13 high-traffic wedding tags",["Research with Etsy search","Apply tags to all listings"],["etsy wedding tags","bridal printable seo","wedding planner etsy tags"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest Wedding Boards","Drive traffic via wedding boards",["Create 3 pin graphics","Pin to wedding planning boards"],["pinterest wedding printable","bridal pin etsy","wedding planner pinterest"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Wedding Planning Bundle","Bundle 5 wedding products",["Group planner + timeline + checklist","Price at 25% off"],["wedding printable bundle","bridal planning kit","wedding bundle PDF"],"$18–$30","Easy","Listing"),
  makeDay(25,"Launch","Post in Wedding Facebook Groups","Promote in bridal communities",["Join 2 wedding planning groups","Share listing with planning tip"],["wedding planning facebook","bridal community etsy","wedding seller promotion"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","List All Build Products","Publish remaining 15 wedding products",["Upload all PDFs to Etsy","Add to Featured Listings"],["wedding etsy shop","bridal printable catalog","wedding downloads etsy"],"$4–$15","Easy","Listing"),
  makeDay(27,"Launch","Instagram Wedding Content","Post styled printable photos",["Style printables on desk flat lay","Post to bridal content account"],["instagram wedding printable","bridal content creator","wedding shop instagram"],"$0","Easy","Marketing"),
  makeDay(28,"Launch","Run a Wedding Season Sale","Time promotion to peak season",["Run 15% off in May/June","Post about it to social channels"],["wedding sale etsy","bridal printable discount","wedding season sale"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Check Etsy Analytics","Review wedding listing performance",["Review views and favorites","Update 2 underperforming listings"],["etsy analytics wedding","bridal shop stats","listing optimization wedding"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Complete","Plan Month 2 expansion",["Identify top 3 products","Set revenue goal for Month 2"],["etsy wedding shop growth","bridal printable business","wedding resources etsy"],"$0","Easy","Launch"),
];

// ─── Journaling ───────────────────────────────────────────────────────────────

const JOURNALING: FallbackDay[] = [
  makeDay(1,"Setup","Daily Journal Pages","Research top journal printables",["Search 'journal printable' on Etsy","Note bestsellers and pricing"],["journal printable","daily journal pages","printable journal PDF"],"$4–$10","Easy","Research"),
  makeDay(2,"Setup","Bullet Journal Spreads","Plan a monthly bullet journal pack",["List 10 popular spread types","Sketch basic layouts"],["bullet journal printable","bujo spreads printable","monthly bullet journal"],"$5–$10","Easy","Research"),
  makeDay(3,"Setup","5-Minute Morning Journal","Create a short daily prompt journal",["Write 5 daily morning prompts","Design simple lined layout"],["morning journal printable","5 minute journal pages","daily writing prompts"],"$4–$8","Easy","Design"),
  makeDay(4,"Setup","Dream Journal Template","Design a nightly dream log",["Create dream description section","Add emotion and theme columns"],["dream journal printable","sleep journal pages","dream log template"],"$4–$8","Easy","Design"),
  makeDay(5,"Setup","One Line a Day Journal","Create a 5-year memory journal",["Design dated one-line entry","Add 5-year parallel columns"],["one line a day journal","memory journal printable","daily diary printable"],"$4–$8","Easy","Design"),
  makeDay(6,"Build","Gratitude Journal 30 Days","Create a 30-page gratitude log",["Write 3 prompts per page","Design minimal warm layout"],["gratitude journal printable","30 day gratitude log","thankful journal pages"],"$5–$10","Easy","Design"),
  makeDay(7,"Build","Shadow Work Journal","Design deep self-reflection prompts",["Write 60 shadow work prompts","Create clean journaling layout"],["shadow work journal","inner healing journal","deep reflection prompts"],"$6–$12","Medium","Design"),
  makeDay(8,"Build","Travel Journal Pages","Create a trip documentation journal",["Design per-destination pages","Add itinerary and memory sections"],["travel journal printable","adventure journal pages","trip memory journal"],"$5–$10","Easy","Design"),
  makeDay(9,"Build","Pregnancy Journal Pages","Design a week-by-week pregnancy log",["Write prompts for each trimester","Design bump photo placeholder"],["pregnancy journal printable","bump journal pages","maternity journal printable"],"$6–$12","Medium","Design"),
  makeDay(10,"Build","Goal-Setting Journal","Create a quarterly goal planner journal",["Design SMART goal pages","Add weekly progress tracking"],["goal setting journal","quarterly planner printable","goal journal pages"],"$5–$10","Easy","Design"),
  makeDay(11,"Build","Creative Writing Prompts","Design a 100-prompt writing deck",["Write 100 story starter prompts","Design printable card format"],["writing prompts printable","creative writing cards","story starter prompts"],"$5–$10","Medium","Design"),
  makeDay(12,"Build","Recovery Journal Pages","Create a healing and recovery log",["Write daily sobriety prompts","Add milestones tracking section"],["recovery journal printable","sobriety journal pages","healing journal prompts"],"$5–$10","Easy","Design"),
  makeDay(13,"Build","Book Club Journal","Design a reading discussion journal",["Create character and theme pages","Add discussion question section"],["book club journal printable","reading journal pages","book discussion printable"],"$5–$9","Easy","Design"),
  makeDay(14,"Build","Brain Dump Pages","Create a mental clutter clearing sheet",["Design free-write open page","Add categorize and prioritize section"],["brain dump printable","thought dump journal","mental clarity printable"],"$3–$7","Easy","Design"),
  makeDay(15,"Build","Letter to Future Self","Design a time capsule journal page",["Create 1-year and 5-year letter pages","Add seal and date design element"],["letter to future self","time capsule printable","future self journal"],"$4–$8","Easy","Design"),
  makeDay(16,"Build","Anxiety Journal Prompts","Create a therapeutic journaling sheet",["Write 30 anxiety management prompts","Add breathing reminder box"],["anxiety journal printable","mental health journal pages","therapy journal prompts"],"$4–$8","Easy","Design"),
  makeDay(17,"Build","Couples Journal Pages","Design a relationship journaling set",["Write 50 couples discussion prompts","Create two-column format"],["couples journal printable","relationship journal pages","love journal prompts"],"$5–$10","Easy","Design"),
  makeDay(18,"Build","Year in Review Journal","Create an annual reflection journal",["Design monthly highlights pages","Add wins and lessons columns"],["year in review printable","annual reflection journal","yearly review pages"],"$5–$10","Medium","Design"),
  makeDay(19,"Build","Productivity Journal","Design a daily task and focus log",["Create time-block daily page","Add deep work session tracker"],["productivity journal printable","daily planner journal","focus tracker pages"],"$4–$9","Easy","Design"),
  makeDay(20,"Build","Art Journal Pages","Create mixed media journal templates",["Design watercolor-friendly blank pages","Add creative prompt borders"],["art journal printable","mixed media journal","creative journal pages"],"$5–$10","Easy","Design"),
  makeDay(21,"Launch","List Daily Journal Pages","Publish first journal listing",["Write SEO-optimized title","Upload PDF and preview image"],["journal printable etsy","daily journal download","journaling pages etsy"],"$4–$10","Easy","Listing"),
  makeDay(22,"Launch","Research Journaling Tags","Find 13 top journaling Etsy tags",["Use Etsy search suggestions","Apply to all journal listings"],["etsy journaling tags","journal printable seo","writing journal etsy"],"$0","Easy","SEO"),
  makeDay(23,"Launch","Pinterest Journal Boards","Pin to journaling communities",["Create 3 journal pin graphics","Pin to journaling and wellness boards"],["pinterest journal printable","journaling pin etsy","daily journal pinterest"],"$0","Easy","Marketing"),
  makeDay(24,"Launch","Create Journal Bundle","Bundle 5 journal products",["Group gratitude + goal + shadow work","Price at 30% off total"],["journal bundle printable","journaling kit PDF","printable journal set"],"$14–$22","Easy","Listing"),
  makeDay(25,"Launch","Post in Journaling Communities","Share in journaling Facebook groups",["Join 2 journaling groups","Post listing with a journaling tip"],["journaling community facebook","journaling group etsy","printable journal share"],"$0","Easy","Marketing"),
  makeDay(26,"Launch","List All Build Products","Publish remaining journal products",["Upload all PDFs to Etsy","Write descriptions with prompts preview"],["etsy journal shop","journaling printable catalog","journal pages downloads"],"$3–$12","Easy","Listing"),
  makeDay(27,"Launch","Instagram Journaling Content","Post a journaling how-to reel",["Film filling in journal pages","Add trending audio and caption"],["instagram journaling printable","journal shop instagram","daily writing reel"],"$0","Easy","Marketing"),
  makeDay(28,"Launch","Run a Journal Sale","Attract buyers with limited offer",["Set 20% off for 7 days","Post about it in journaling groups"],["etsy journal sale","journaling printable discount","journal pages sale"],"$0","Easy","Marketing"),
  makeDay(29,"Launch","Review Etsy Analytics","Check journal listing performance",["Review top listing by views","Update 2 weaker listing titles"],["etsy analytics journaling","journal shop stats","listing seo update"],"$0","Easy","Launch"),
  makeDay(30,"Launch","Month 1 Complete","Plan Month 2 expansion",["List top 3 journal products","Plan 10 new products for Month 2"],["etsy journal shop growth","journaling printable business","journal pages etsy expansion"],"$0","Easy","Launch"),
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

const PLANS: Record<string, FallbackDay[]> = {
  kids:       KIDS,
  fitness:    FITNESS,
  budgeting:  BUDGETING,
  teachers:   TEACHERS,
  teacher:    TEACHERS,
  "self-care":    SELF_CARE,
  "self care":    SELF_CARE,
  selfcare:       SELF_CARE,
  wedding:    WEDDING,
  journaling: JOURNALING,
  journal:    JOURNALING,
};

/**
 * Returns the static fallback planner for a given niche.
 * Falls back to Fitness if the niche is not found.
 */
export function getFallbackPlanner(niche: string): FallbackDay[] {
  const key = niche.toLowerCase().trim();
  return PLANS[key] ?? FITNESS;
}
