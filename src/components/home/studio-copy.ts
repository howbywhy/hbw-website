/** Practice, Studio, and Manifesto copy. Manifesto is the belief layer — do not duplicate it in Studio. */

export const STUDIO_COPY = {
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
    "Strategy, identity, naming, storytelling and design are tools rather than a fixed sequence. We use what the problem requires.",
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
      copy: "Turn that thinking into a distinctive identity and the systems it needs to live.",
    },
    {
      id: "04",
      title: "Support",
      copy: "Stay involved where useful, helping the brand evolve without losing what made it coherent in the first place.",
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
