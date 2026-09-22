/** Practice, Studio, and Manifesto copy. Manifesto is the belief layer — do not duplicate it in Studio. */

export const STUDIO_COPY = {
  /** The Studio viewer: its line in the bar, the lead, and the facts that aren't projects. */
  line: "Independent brand and design practice",
  lead: [
    "You’ve built something real. But somewhere along the way, the brand stopped reflecting where it’s heading.",
    "How by Why is an independent brand and design practice led by Mark Blackler. We work directly with founders and leadership teams, bringing strategy and creative direction into the same conversation.",
    "A brief might begin with a name, an identity, packaging, a website or simply the sense that something isn’t quite right. We start there, then work out what the brand actually needs.",
  ],
  disciplines: "Strategy · Naming · Identity · Storytelling · Design",
  /** The Studio page opens on the tension, then who answers it. */
  statement: [
    "You’ve built something real. But somewhere along the way, the brand stopped reflecting where it’s heading.",
    "How by Why is an independent brand and design practice, led by Mark Blackler, working directly with founders and leadership teams to bring strategy and creative direction into the same conversation.",
  ],
  brief:
    "A brief might begin with a name, an identity, packaging, a website or simply the sense that something isn’t quite right. We start there, then work out what the brand actually needs.",
  disciplineList: ["Strategy", "Naming", "Identity", "Storytelling", "Design"],
  contactLine: "Start a poster, or just email. We’ll take it from there.",
  place: "Wentworth Falls, Blue Mountains",
  opening:
    "You’ve built something real. But somewhere along the way, the brand stopped reflecting where it’s heading.",
  work: "That’s where we work.",
  role: "Our role is to create clarity where there’s noise and shape where there’s ambiguity, so what follows can be built with intention.",
  partners:
    "We partner with founders and teams at moments of change, when something needs to be understood, aligned or redefined.",
  glimpse: "Our role is to create clarity where there’s noise and shape where there’s ambiguity.",
  independent: [
    "How by Why is an independent brand and design practice led by Mark Blackler.",
    "I work directly with founders and teams, bringing strategy and creative direction into the same conversation.",
    "A brief might begin with a name, an identity, packaging, a website or simply the feeling that something isn’t quite right. We use that as a starting point, then work out what the brand actually needs.",
  ],
  philosophy: [
    "The answer is rarely in the brief alone.",
    "We ask why before deciding how — looking beyond the immediate request to understand the problem, opportunity or change behind it.",
  ],
  howIntro: "Our work begins with understanding.",
  howTools:
    "We don’t run a set process. Strategy, naming, identity, writing, design: we use what the job needs.",
  steps: [
    {
      id: "01",
      title: "Clarify",
      copy: "Understand what exists, what’s changing and what actually needs to be solved.",
    },
    {
      id: "02",
      title: "Shape",
      copy: "Find the position, idea or organising principle that gives the brand direction.",
    },
    {
      id: "03",
      title: "Express",
      copy: "Design the identity, and everything it needs to work day to day.",
    },
    {
      id: "04",
      title: "Support",
      copy: "Stick around after launch, so the brand can grow without losing what made it work.",
    },
  ],
  contact: "If you think we should work together, reach out: mark@hbw.works",
  manifestoLabel: "HBW Manifesto",
} as const;

export const MANIFESTO_COPY = {
  opening: ["Brand is not what you see.", "It’s what you feel."],
  reduced: [
    "Brand is often reduced to what’s visible, a logo, a colour palette, a system at the end.",
    "But that was never the point.",
    "Brand is the feeling that remains after the interaction.",
  ],
  body: [
    ["Strong brands don’t begin with design.", "They begin with clarity."],
    ["What do you stand for?", "Why does it matter?", "What should people feel?"],
    ["When that’s clear, everything that follows becomes intentional."],
    ["There is no gap between what you say and what people experience."],
    ["When they align, trust builds.", "When they don’t, people notice."],
    ["Consistency is what turns moments into memory."],
    ["We start with understanding.", "We shape what it becomes.", "We express it with intent."],
    ["Not as a deliverable,", "but as something people feel."],
  ],
  close: ["By asking why, we discover how.", "How by why"],
} as const;
