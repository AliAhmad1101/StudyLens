/* ==========================================================================
   StudyLens — Seed dataset
   --------------------------------------------------------------------------
   Holds `subjects` (with `resources` arrays) used by renderResources().
   When the backend is ready, `subjects[subject].resources` will be replaced
   by an API call to GET /api/subjects/:key/resources — keep the shape intact.
   Resource shape: { type: video|article|pdf, title, topic, detail, link, level }
   ========================================================================== */

const subjects = {
  physics: {
    key: 'physics',
    name: 'Physics',
    exam: 'JEE Main & Advanced',
    tint: '#4A5FC1',
    tags: ['Mechanics', 'Electromagnetism', 'Optics', 'Modern Physics'],
    description:
      'From Newtonian mechanics to quantum phenomena — build physical intuition first, then sharpen it with numerical practice. Physics rewards the learner who connects laws to real-world situations.',
    topics: ['Mechanics', 'Electromagnetism', 'Optics', 'Thermodynamics', 'Modern Physics'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <ellipse cx="100" cy="70" rx="62" ry="24" stroke="currentColor" stroke-width="1.6"/>
      <ellipse cx="100" cy="70" rx="62" ry="24" stroke="currentColor" stroke-width="1.6" transform="rotate(60 100 70)"/>
      <ellipse cx="100" cy="70" rx="62" ry="24" stroke="currentColor" stroke-width="1.6" transform="rotate(120 100 70)"/>
      <circle cx="100" cy="70" r="7" fill="currentColor"/>
      <circle cx="162" cy="70" r="4" fill="currentColor"/>
      <circle cx="69" cy="24" r="4" fill="currentColor"/>
    </svg>`,
    plan: [
      { title: 'Diagnose & warm up', focus: 'Revise formulas for {weak} and attempt 10 mixed MCQs.', min: 25 },
      { title: 'Core concept block', focus: 'Watch one lecture on {weak} and write brief notes in your own words.', min: 35 },
      { title: 'Application practice', focus: 'Solve previous-year numericals on {weak} and Mechanics.', min: 40 },
      { title: 'Recap & reflect', focus: 'Re-read today’s notes, log doubts, and update your formula sheet.', min: 20 },
    ],
    resources: [
      { type: 'video', title: 'Complete Mechanics in one sitting', topic: 'Mechanics', detail: 'Full-length lecture covering kinematics, laws of motion and work–energy with solved numericals.', link: 'https://www.youtube.com/results?search_query=complete+mechanics+physics+jee+lecture', level: 'intermediate' },
      { type: 'video', title: 'Electromagnetism visualised', topic: 'Electromagnetism', detail: 'Field-line intuition for Gauss’s law, capacitors and motional EMFE — heavy on diagrams.', link: 'https://www.youtube.com/results?search_query=electromagnetism+visual+lecture+physics', level: 'intermediate' },
      { type: 'video', title: 'Ray optics: diagrams that score', topic: 'Optics', detail: 'Mirror/lens formula shortcuts and the standard reflection–refraction diagram set.', link: 'https://www.youtube.com/results?search_query=ray+optics+shortcut+tricks+jee', level: 'beginner' },
      { type: 'article', title: 'Electricity & magnetism — chapter map', topic: 'Electromagnetism', detail: 'Khan Academy’s structured walkthrough of circuits, fields and electromagnetic induction.', link: 'https://www.khanacademy.org/science/physics/electricity-and-magnetism', level: 'beginner' },
      { type: 'article', title: 'HyperPhysics reference: mechanics', topic: 'Mechanics', detail: 'Compact concept maps — ideal for 10-minute revision between study blocks.', link: 'http://hyperphysics.phy-astr.gsu.edu/hbase/hmech.html', level: 'beginner' },
      { type: 'article', title: 'Special relativity, plainly explained', topic: 'Modern Physics', detail: 'Length contraction and time dilation without the tensor soup — good JEE primer.', link: 'https://en.wikipedia.org/wiki/Special_relativity', level: 'advanced' },
      { type: 'pdf', title: 'MIT OCW — Classical mechanics problem sets', topic: 'Mechanics', detail: 'Printable problem sets with solutions from MIT’s first-year mechanics course.', link: 'https://ocw.mit.edu/search/?q=classical+mechanics', level: 'advanced' },
      { type: 'pdf', title: 'Formula booklet — physics (JEE)', topic: 'Thermodynamics', detail: 'One-file formula sheet spanning thermal physics, waves and modern physics.', link: 'https://ncert.nic.in/textbook.php', level: 'intermediate' },
      { type: 'pdf', title: 'NCERT Physics Part I & II (XI–XII)', topic: 'Modern Physics', detail: 'The board-level foundation every JEE aspirant must master first — official NCERT PDFs.', link: 'https://ncert.nic.in/textbook.php', level: 'beginner' },
    ],
  },

  chemistry: {
    key: 'chemistry',
    name: 'Chemistry',
    exam: 'JEE / NEET',
    tint: '#B4573A',
    tags: ['Organic', 'Inorganic', 'Physical', 'Reactions'],
    description:
      'Chemistry is the highest ROI subject in competitive exams: memorise the patterns of organic reactions, visualise inorganic trends, and drill the small physical-chemistry calculations until they are automatic.',
    topics: ['Organic Reactions', 'Chemical Bonding', 'Physical Chemistry', 'Inorganic Chemistry', 'Electrochemistry'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M84 22v30L52 106a10 10 0 0 0 9 15h78a10 10 0 0 0 9-15L116 52V22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M74 22h52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M66 86h68" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="86" cy="98" r="4" fill="currentColor"/>
      <circle cx="104" cy="106" r="3" fill="currentColor"/>
      <circle cx="118" cy="96" r="5" fill="currentColor"/>
    </svg>`,
    plan: [
      { title: 'Reaction warm-up', focus: 'Flash-review {weak} mechanisms — name each step before you write it.', min: 20 },
      { title: 'Concept block', focus: 'Study one named-reaction family in {weak} with examples.', min: 35 },
      { title: 'Timed drills', focus: '20 MCQs mixing {weak} with Chemical Bonding — no calculator.', min: 40 },
      { title: 'Memory consolidation', focus: 'Convert today’s reactions into a one-page flowchart.', min: 15 },
    ],
    resources: [
      { type: 'video', title: 'Organic reaction mechanisms A→Z', topic: 'Organic Reactions', detail: 'Arrow-pushing explained properly: SN1/SN2/E1/E2, carbonyl chemistry and named reactions.', link: 'https://www.youtube.com/results?search_query=organic+reaction+mechanisms+full+course', level: 'intermediate' },
      { type: 'video', title: 'Chemical bonding in 45 minutes', topic: 'Chemical Bonding', detail: 'VSEPR, MOT and hybridisation with the standard exam diagrams.', link: 'https://www.youtube.com/results?search_query=chemical+bonding+jee+one+shot', level: 'beginner' },
      { type: 'video', title: 'Physical chemistry numerical bootcamp', topic: 'Physical Chemistry', detail: 'Equilibrium, kinetics and thermodynamics numericals solved live at exam pace.', link: 'https://www.youtube.com/results?search_query=physical+chemistry+numericals+jee+one+shot', level: 'advanced' },
      { type: 'article', title: 'Periodic trends that actually get asked', topic: 'Inorganic Chemistry', detail: 'Electronegativity, ionisation energy and oxide acidity — with the exceptions that get tested.', link: 'https://en.wikipedia.org/wiki/Periodic_trends', level: 'beginner' },
      { type: 'article', title: 'Organic chemistry — structure & reactivity', topic: 'Organic Reactions', detail: 'Khan Academy’s organic track: functional groups, mechanisms and spectroscopy basics.', link: 'https://www.khanacademy.org/science/organic-chemistry', level: 'beginner' },
      { type: 'article', title: 'Electrochemistry: cells & Nernst', topic: 'Electrochemistry', detail: 'Clean derivations of cell potential and the Nernst equation with worked examples.', link: 'https://en.wikipedia.org/wiki/Electrochemistry', level: 'intermediate' },
      { type: 'pdf', title: 'NCERT Chemistry XI–XII (official)', topic: 'Inorganic Chemistry', detail: 'Exam setters quote NCERT inorganic line-by-line — read it twice.', link: 'https://ncert.nic.in/textbook.php', level: 'beginner' },
      { type: 'pdf', title: 'Named reactions handbook', topic: 'Organic Reactions', detail: 'Printable list of ~80 named reactions with reagents, conditions and substrates.', link: 'https://www.google.com/search?q=named+organic+reactions+handbook+pdf', level: 'intermediate' },
      { type: 'pdf', title: 'OpenStax Chemistry 2e', topic: 'Physical Chemistry', detail: 'Full free textbook — strong on thermo, equilibrium and atomic structure.', link: 'https://openstax.org/details/books/chemistry-2e', level: 'intermediate' },
    ],
  },

  maths: {
    key: 'maths',
    name: 'Mathematics',
    exam: 'JEE / CUET',
    tint: '#14665C',
    tags: ['Calculus', 'Algebra', 'Coordinate', 'Vectors'],
    description:
      'Mathematics decides the JEE rank. The winning loop is simple: understand the theorem, see two model proofs, then solve until the pattern is reflex. Calculus carries the most weight — protect time for it.',
    topics: ['Algebra', 'Calculus', 'Coordinate Geometry', 'Vectors & 3D', 'Probability'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M30 118h144M38 118V24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M38 104c26 0 38-56 62-56s34 44 60 44" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M138 62l16-6-2 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M96 34h16M104 26v16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="100" cy="62" r="3.5" fill="currentColor"/>
    </svg>`,
    plan: [
      { title: 'Formula recall', focus: 'Write {weak} formulas from memory, then verify — gaps found here are your syllabus.', min: 20 },
      { title: 'Theory block', focus: 'Study one {weak} theorem end-to-end including its proof sketch.', min: 35 },
      { title: 'Solve sprints', focus: '15 timed problems on {weak}; mark every one as easy/medium/hard.', min: 45 },
      { title: 'Error log', focus: 'Move today’s mistakes into your error log with the one-line fix.', min: 15 },
    ],
    resources: [
      { type: 'video', title: 'Differential calculus — full stretch', topic: 'Calculus', detail: 'Limits, L’Hôpital, continuity and AOD packed into one exam-focused marathon.', link: 'https://www.youtube.com/results?search_query=differential+calculus+jee+full+lecture', level: 'intermediate' },
      { type: 'video', title: 'Vectors & 3D geometry, visualised', topic: 'Vectors & 3D', detail: 'Rowboat-and-arrow intuition for dot/cross products, lines and planes in space.', link: 'https://www.youtube.com/results?search_query=vectors+3d+geometry+jee+one+shot', level: 'beginner' },
      { type: 'video', title: 'Probability for competitive exams', topic: 'Probability', detail: 'Bayes’ theorem and binomial distribution through past-paper questions.', link: 'https://www.youtube.com/results?search_query=probability+jee+advanced+questions', level: 'advanced' },
      { type: 'article', title: 'Calculus — Khan Academy track', topic: 'Calculus', detail: 'Step-graded practice from limits to series, with instant feedback.', link: 'https://www.khanacademy.org/math/calculus-1', level: 'beginner' },
      { type: 'article', title: 'Coordinate geometry cheat-sheet', topic: 'Coordinate Geometry', detail: 'Conics, families of lines and shifted-origin tricks on one page.', link: 'https://en.wikipedia.org/wiki/Analytic_geometry', level: 'intermediate' },
      { type: 'article', title: 'Algebra: polynomials & the remainder theorem', topic: 'Algebra', detail: 'Clean statement, proof sketch, and the five question patterns it spawns.', link: 'https://en.wikipedia/wiki/Polynomial', level: 'beginner' },
      { type: 'pdf', title: 'MIT OCW — Single variable calculus', topic: 'Calculus', detail: 'Full problem sets with solutions; the gold standard for calculus depth.', link: 'https://ocw.mit.edu/search/?q=single+variable+calculus', level: 'advanced' },
      { type: 'pdf', title: 'NCERT Maths XI–XII (official)', topic: 'Algebra', detail: 'Board + CUET backbone; every serious JEE prep starts here.', link: 'https://ncert.nic.in/textbook.php', level: 'beginner' },
      { type: 'pdf', title: ' PYQ compilation — maths (2015–2025)', topic: 'Coordinate Geometry', detail: 'Topic-sorted previous-year questions — the highest-yield revision PDF.', link: 'https://www.google.com/search?q=jee+main+maths+previous+year+questions+pdf', level: 'intermediate' },
    ],
  },

  biology: {
    key: 'biology',
    name: 'Biology',
    exam: 'NEET / CUET',
    tint: '#4E7A3F',
    tags: ['Genetics', 'Ecology', 'Physiology', 'Cell Biology'],
    description:
      'Biology rewards precise memory over raw effort. The learners who win build labelled diagrams, connect processes into cycles, and revise NCERT until the exact exam phrasing feels familiar.',
    topics: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Evolution'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M70 18c0 26 60 32 60 52s-60 26-60 52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M130 18c0 26-60 32-60 52s60 26 60 52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M76 40h48M68 62h64M68 90h64M76 112h48" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="100" cy="70" r="5" fill="currentColor"/>
    </svg>`,
    plan: [
      { title: 'NCERT re-read', focus: 'Re-read the {weak} section of NCERT; highlight only exam-grade lines.', min: 25 },
      { title: 'Diagram drill', focus: 'Draw and label the key {weak} diagram twice without looking.', min: 25 },
      { title: 'Question bank', focus: '30 assertion–reason MCQs on {weak} and Genetics.', min: 40 },
      { title: 'Spaced review', focus: 'Revise yesterday’s notes using active recall before you close the day.', min: 15 },
    ],
    resources: [
      { type: 'video', title: 'Genetics & evolution one-shot', topic: 'Genetics', detail: 'Mendel to molecular genetics with the standard NEET diagram set.', link: 'https://www.youtube.com/results?search_query=genetics+evolution+neet+one+shot', level: 'intermediate' },
      { type: 'video', title: 'Human physiology: body systems tour', topic: 'Human Physiology', detail: 'Digestive, circulatory, excretory and nervous systems as one connected story.', link: 'https://www.youtube.com/results?search_query=human+physiology+neet+full+chapter', level: 'beginner' },
      { type: 'video', title: 'Ecology full revision', topic: 'Ecology', detail: 'Populations, communities and nutrient cycles — the highest-scoring NEET unit.', link: 'https://www.youtube.com/results?search_query=ecology+full+revision+neet', level: 'beginner' },
      { type: 'article', title: 'Cell biology — Khan Academy', topic: 'Cell Biology', detail: 'Membranes, organelles and cell cycle with checkpoint practice.', link: 'https://www.khanacademy.org/science/biology/structure-of-a-cell', level: 'beginner' },
      { type: 'article', title: 'Photosynthesis, step by step', topic: 'Cell Biology', detail: 'Light reactions and Calvin cycle traced molecule-by-molecule.', link: 'https://en.wikipedia.org/wiki/Photosynthesis', level: 'intermediate' },
      { type: 'article', title: 'Natural selection explained', topic: 'Evolution', detail: 'Mechanisms of evolution with the peppered moth and antibiotic resistance cases.', link: 'https://en.wikipedia.org/wiki/Evolution', level: 'beginner' },
      { type: 'pdf', title: 'NCERT Biology XI–XII (official)', topic: 'Genetics', detail: 'The single most-referenced book for NEET — read the biology NCERT cover to cover.', link: 'https://ncert.nic.in/textbook.php', level: 'beginner' },
      { type: 'pdf', title: 'OpenStax Biology 2e', topic: 'Ecology', detail: 'Free full textbook with chapters on ecology, genetics and physiology.', link: 'https://openstax.org/details/books/biology-2e', level: 'intermediate' },
      { type: 'pdf', title: 'NEET biology PYQ bank', topic: 'Human Physiology', detail: 'Topic-sorted previous papers with answer keys and NCERT line references.', link: 'https://www.google.com/search?q=neet+biology+previous+year+questions+pdf', level: 'intermediate' },
    ],
  },

  english: {
    key: 'english',
    name: 'English',
    exam: 'CUET / Boards',
    tint: '#8A4F7D',
    tags: ['Reading', 'Vocabulary', 'Grammar', 'Writing'],
    description:
      'English scores compound: better comprehension speed lifts every other subject’s paper too. CUET English is less about literature and more about precision reading, vocabulary in context and clean writing under time pressure.',
    topics: ['Reading Comprehension', 'Vocabulary', 'Grammar', 'Descriptive Writing', 'Literary Terms'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M100 34c-14-9-32-11-50-8v76c18-3 36-1 50 8 14-9 32-11 50-8V26c-18-3-36-1-50 8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M100 34v76" stroke="currentColor" stroke-width="1.6"/>
      <path d="M64 52h20M64 68h20M116 52h20M116 68h20" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`,
    plan: [
      { title: 'Vocabulary sprint', focus: 'Learn 15 words in context; write one sentence each.', min: 20 },
      { title: 'Close reading', focus: 'Read one dense passage from {weak} and summarise in three lines.', min: 30 },
      { title: 'Timed writing', focus: 'One letter/essay outline in 20 minutes — structure beats eloquence.', min: 25 },
      { title: 'Error review', focus: 'Review grammar mistakes from your last quiz and note the rule.', min: 15 },
    ],
    resources: [
      { type: 'video', title: 'CUET English strategy masterclass', topic: 'Reading Comprehension', detail: 'Section pattern, time allocation and elimination technique for CUET English.', link: 'https://www.youtube.com/results?search_query=cuet+english+strategy+masterclass', level: 'beginner' },
      { type: 'video', title: 'Grammar rules that get tested', topic: 'Grammar', detail: 'Tenses, subject–verb agreement, modifiers — with the classic trap questions.', link: 'https://www.youtube.com/results?search_query=english+grammar+rules+competitive+exam', level: 'beginner' },
      { type: 'video', title: 'Vocabulary building with roots', topic: 'Vocabulary', detail: 'Latin and Greek roots that unlock hundreds of exam words.', link: 'https://www.youtube.com/results?search_query=vocabulary+roots+prefixes+suffixes', level: 'intermediate' },
      { type: 'article', title: 'Reading comprehension — practice hub', topic: 'Reading Comprehension', detail: 'Khan Academy’s passage exercises with instant feedback — build speed safely.', link: 'https://www.khanacademy.org/evidence-based-reading', level: 'beginner' },
      { type: 'article', title: 'English tenses, fully charted', topic: 'Grammar', detail: 'Every tense with form, use and signal words — a one-page reference.', link: 'https://en.wikipedia.org/wiki/English_tenses', level: 'beginner' },
      { type: 'article', title: 'Literary devices glossary', topic: 'Literary Terms', detail: 'Metaphor to zeugma — the terms CUET passages quietly assume you know.', link: 'https://en.wikipedia.org/wiki/List_of_literary_devices', level: 'intermediate' },
      { type: 'pdf', title: 'Wren & Martin — high school English', topic: 'Grammar', detail: 'The classic grammar workbook; do the exercises, not just the reading.', link: 'https://www.google.com/search?q=wren+and+martin+high+school+english+grammar+pdf', level: 'beginner' },
      { type: 'pdf', title: 'CUET English syllabus & sample paper', topic: 'Reading Comprehension', detail: 'Official pattern, marking scheme and a full-length sample paper.', link: 'https://cuet.samarth.ac.in/', level: 'beginner' },
      { type: 'pdf', title: 'Descriptive writing Handbook', topic: 'Descriptive Writing', detail: 'Letter and essay templates with examiner-facing checklists.', link: 'https://www.google.com/search?q=descriptive+writing+handbook+letter+essay+format+pdf', level: 'intermediate' },
    ],
  },

  economics: {
    key: 'economics',
    name: 'Economics',
    exam: 'CUET / Boards',
    tint: '#9A6B2F',
    tags: ['Micro', 'Macro', 'Indian Economy', 'Statistics'],
    description:
      'Economics blends logic and data. Micro builds the reasoning toolkit, macro reads the economy’s pulse, and the Indian Economy section rewards students who connect textbook concepts to real policy news.',
    topics: ['Microeconomics', 'Macroeconomics', 'Indian Economy', 'Statistics', 'Public Finance'],
    art: `<svg viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <path d="M34 112h136" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="52" y="76" width="20" height="36" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <rect x="90" y="52" width="20" height="60" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <rect x="128" y="30" width="20" height="82" rx="3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M48 58l30-18 34 10 40-28" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M138 20l14 2-3 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    plan: [
      { title: 'Concept map', focus: 'Sketch the {weak} model (curves, shifts, equilibrium) from memory.', min: 20 },
      { title: 'Theory block', focus: 'Study one {weak} chapter; relate one concept to current news.', min: 35 },
      { title: 'Data practice', focus: 'Numericals on index numbers, GDP and elasticity — 15 questions.', min: 35 },
      { title: 'Answer writing', focus: 'Write one 6-marker answer in CUET format on {weak}.', min: 20 },
    ],
    resources: [
      { type: 'video', title: 'Microeconomics foundations', topic: 'Microeconomics', detail: 'Demand, supply, elasticity and market failure explained with Indian examples.', link: 'https://www.youtube.com/results?search_query=microeconomics+class+12+full+chapter', level: 'beginner' },
      { type: 'video', title: 'Macroeconomics & national income', topic: 'Macroeconomics', detail: 'GDP, multiplier, inflation and BoP in one clean sequence.', link: 'https://www.youtube.com/results?search_query=macroeconomics+national+income+class+12', level: 'intermediate' },
      { type: 'video', title: 'Indian Economy post-reforms', topic: 'Indian Economy', detail: '1991 reforms to GST — the narrative CUET and interviewers both like.', link: 'https://www.youtube.com/results?search_query=indian+economy+1991+reforms+explained', level: 'intermediate' },
      { type: 'article', title: 'Khan Academy — microeconomics track', topic: 'Microeconomics', detail: 'Interactive units from supply curves to externalities with graded practice.', link: 'https://www.khanacademy.org/economics-finance-domain/microeconomics', level: 'beginner' },
      { type: 'article', title: 'Economy of India — overview', topic: 'Indian Economy', detail: 'Sectors, growth data and structural facts, with linked sources for citation.', link: 'https://en.wikipedia.org/wiki/Economy_of_India', level: 'beginner' },
      { type: 'article', title: 'Inflation & the RBI explained', topic: 'Macroeconomics', detail: 'CPI vs WPI, repo rate mechanics and the inflation-targeting framework.', link: 'https://en.wikipedia.org/wiki/Inflation', level: 'intermediate' },
      { type: 'pdf', title: 'NCERT Macroeconomics XII', topic: 'Macroeconomics', detail: 'Official text — national income accounting done carefully.', link: 'https://ncert.nic.in/textbook.php', level: 'beginner' },
      { type: 'pdf', title: 'OpenStax Principles of Economics', topic: 'Statistics', detail: 'Free full textbook; strong stats-for-economics chapters.', link: 'https://openstax.org/details/books/principles-economics-3e', level: 'intermediate' },
      { type: 'pdf', title: 'Economic Survey highlights digest', topic: 'Indian Economy', detail: 'Annual survey distilled into exam-relevant data points and one-liners.', link: 'https://www.google.com/search?q=economic+survey+india+highlights+pdf', level: 'advanced' },
    ],
  },
};

/* Order in which subjects appear when none are selected / for daily rotation */
const SUBJECT_ORDER = ['physics', 'chemistry', 'maths', 'biology', 'english', 'economics'];
