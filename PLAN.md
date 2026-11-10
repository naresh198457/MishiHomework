# KS2 SATs Maths Practice App: Phase 1 Design

## Decisions
- Hosting: GitHub Pages (Next.js static export) + GitHub Actions deploy
- Data/auth: Supabase free tier (+ weekly keep-alive GitHub Action)
- Repo: public
- Drawing questions: multiple-choice for now; proper drawing tool in a later phase
- Questions: **parent reviews and approves every question before it goes live**

## 1. Question review workflow
Questions live in the repo as JSON, one file per topic: `content/questions/<topic-id>.json`.
Each has a `status`: `draft` -> `approved` (or `rejected`).
- The app only ever serves `approved` questions.
- A private **/review** page (parent login only) shows each draft with its answer and
  explanation, with Approve / Edit / Reject buttons. Decisions are written back as a
  small JSON change you commit (or the page downloads the updated file).
- Until /review exists (Phase 2), I give you each topic as a readable table to approve in chat.
- Arithmetic template questions: you approve the *template* (e.g. "a/b + c/d, denominators
  <= 12") plus 3 sample outputs, not every random instance.
- A script checks all arithmetic/answers automatically before a question reaches you.

### Question schema
```json
{
  "id": "frac-add-001",
  "topic": "fractions-add",
  "paper": "arithmetic | reasoning",
  "difficulty": 1,
  "marks": 1,
  "format": "numeric | fraction | choice | multi-choice | order | match | true-false-table | text-self-mark",
  "prompt": "2 3/5 + 1 3/5 =",
  "options": null,
  "answer": "4 1/5",
  "acceptable": ["21/5"],
  "explanation": "Add wholes 2+1=3, fractions 3/5+3/5=6/5=1 1/5, total 4 1/5.",
  "source": "real-2025-P1-Q24 | original | template",
  "status": "draft"
}
```

## 2. Topic taxonomy (about 8 questions each)
Tags: A = arithmetic paper, R = reasoning paper.

**Number**
1. Place value & rounding (A/R): digit values, partitioning, round to 10/100/1000, 2,000 more than
2. Negative numbers (R): number lines, differences across zero
3. Sequences, multiples, primes, squares, factors (R)
4. Addition & subtraction (A): up to 7 digits, decimals, missing number
5. Multiplication (A): times tables, x10/100, short multiplication, x0
6. Division (A): short division, /10, remainders, missing number
7. Long multiplication (A, 2 marks): 3-4 digit x 2 digit
8. Long division (A, 2 marks): 3-4 digit / 2 digit
9. Order of operations & powers (A)

**Fractions, decimals, percentages**
10. Equivalent fractions & simplifying
11. Comparing & ordering fractions/decimals
12. Add & subtract fractions (unlike denominators, mixed numbers)
13. Multiply fractions (incl. fraction of an amount, mixed x whole)
14. Divide fractions (fraction / whole number)
15. Improper fractions & mixed numbers
16. Decimals (+ - x /, x/10,100,1000)
17. Percentages (5%, 10%, 19%, 65% of; percentage of a shape)
18. FDP conversions

**Ratio, proportion, algebra**
19. Ratio & proportion (scaling, unit cost, "4kg costs £6")
20. Algebra (substitution, simple formulae, missing numbers, sequences rules)

**Measurement & geometry**
21. Measurement & conversions (mm/cm/m/km, g/kg, ml/l)
22. Time (12/24h, durations, timetables)
23. Area & perimeter
24. Volume
25. Angles (lines, triangles, quadrilaterals, parallelogram/rhombus)
26. Shape properties (2D/3D, nets)
27. Coordinates (4 quadrants)
28. Reflection & translation

**Statistics & problem solving**
29. Statistics (tables, pie charts, line graphs, mean)
30. Word problems (one/two step, money)
31. Multi-step reasoning (3-mark style)
32. Mixed practice (random across topics)

## 3. Mock papers
- Arithmetic: 36 questions, 40 marks, 30 min
- Reasoning 1 and Reasoning 2: ~22 questions, 35 marks each, 40 min
- Countdown timer, no instant feedback; results and corrections only at the end
- Real 2025 papers loaded as the first mocks (drawing questions as multiple-choice for now)

## 4. Wireframes (ASCII)
```
LOGIN                     TODAY
+-----------------+      +------------------------------------+
| Maths Practice  |      | Hi Mishitha!        Streak: 5 days |
| [username]      |      | [ Today's homework: 10 Qs  START ] |
| [password]      |      | Recommended: Fractions - Divide    |
| [ Log in ]      |      | Last 7 days: ## # ### . ## ## .    |
+-----------------+      | [Topics] [Mock SATs] [Dashboard]   |
                         +------------------------------------+
QUIZ PLAYER                          RESULTS
+-------------------------------+   +-------------------------------+
| Fractions - Add   Q3 of 8  ## |   | Score 6/8 (75%)   Time 4:12   |
| ------------------------------|   | Q1 ok  Q2 ok  Q3 X  ...       |
| 2 3/5 + 1 3/5 =               |   | Q3: you wrote 3 6/5           |
|   [ whole ] [ num ]/[ den ]   |   |   Correct: 4 1/5              |
|                [ Check ]      |   |   Why: 3/5+3/5 = 6/5 = 1 1/5  |
+-------------------------------+   | [Retake] [Next topic]         |
                                    +-------------------------------+
DASHBOARD
+-------------------------------------------------------------+
| Attempted 412 | Correct 318 | Accuracy 77% | SATs readiness 68|
| Accuracy trend (line)        | Topic accuracy (bars, sorted)  |
| Weekly / monthly (bars)      | Strongest: Addition, Time      |
| Streak calendar              | Revise: Long division, FDP     |
+-------------------------------------------------------------+
```
Page map: `/login`, `/` (Today), `/topics`, `/topics/[id]`, `/quiz/[attemptId]`,
`/results/[attemptId]`, `/mock`, `/mock/[paper]`, `/dashboard`, `/history`, `/review` (parent).

## 5. Repo structure
```
/content/questions/*.json   question bank (versioned)
/content/topics.json
/src/app/...                Next.js pages
/src/lib/marking/           one marker per question format (unit tested)
/src/lib/homework/          homework selection + difficulty rules
/supabase/migrations/       SQL schema + RLS policies
/scripts/validate-questions validates schema and answers
/.github/workflows/         deploy.yml, keepalive.yml
```

## 6. Phase 2 (MVP) scope proposal
1. Project setup, deploy pipeline, Supabase schema and login
2. Quiz player with formats: numeric, fraction, choice, multi-choice, order, match
3. First 8 topics (about 64 questions) from the real papers plus new questions, for your review
4. Instant marking, explanations, attempt history
5. Basic homework generation and streak

Proposed first topics: Place value, Add/Subtract, Multiplication, Division, Long multiplication,
Long division, Fractions (add/subtract), Percentages.
