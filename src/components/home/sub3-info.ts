export const SUB3_INFO = {
  name: "SUB:3",
  positioning: "Bending Time & Space",
  year: "2025",
  credit:
    "Brand identity, packaging design, and art direction by How by Why (HBW). Developed with The Colour Club.",
  sections: [
    {
      id: "idea" as const,
      heading: "The idea",
      copy: "Named after the holy grail of marathon running, breaking the three-hour mark, SUB:3 is built on discipline, obsession, and the pursuit of possibility. At its core is the notion of Bending Time & Space, where time stretches, compresses, and distorts through effort.",
    },
    {
      id: "shift" as const,
      heading: "The shift",
      copy: "Performance nutrition is a category driven by function, electrolytes, carbs, recovery, often communicated through complexity. Brands compete on what products do, not what they mean, leaving the space feeling technical and interchangeable. The challenge wasn’t the product, it was perspective. There was no clear way to express the mindset of a runner. The shift came in recognising that runners don’t chase products, they chase time.",
    },
    {
      id: "system" as const,
      heading: "The system",
      copy: "Bending Time & Space anchors SUB:3, turning time into something felt. Typography moves with pace, timecodes lead the system, and packaging captures moments within the run. A reflective surface carries the same behaviour, shifting with light to extend motion beyond form.",
    },
    {
      id: "outcome" as const,
      heading: "The outcome",
      copy: "SUB:3 shifts from product to mindset, establishing a distinct position in a crowded category and a system that connects through shared ambition, not just function. By turning time into the foundation of the brand, it becomes a marker of intent for those who run against the clock.",
    },
  ],
};

export type Sub3SectionId = (typeof SUB3_INFO.sections)[number]["id"];
