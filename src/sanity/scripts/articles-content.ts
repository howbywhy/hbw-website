/** Talk's writing, as seeded. The CMS is the record once it is there. */

export type ArticleSeed = {
  documentId: string;
  slug: string;
  title: string;
  standfirst: string;
  /** ISO date. */
  published: string;
  /** Paragraphs in order. A string starting "## " is a subheading. */
  body: string[];
};

export const ARTICLES: ArticleSeed[] = [
  {
    documentId: "article-what-are-we-actually-designing",
    slug: "what-are-we-actually-designing",
    title: "What are we actually designing?",
    standfirst:
      "A visual identity is something we can create and hand over. A brand is something a business has to keep building. Where does that leave the brand designer?",
    published: "2026-10-18",
    body: [
      "I've held back from sharing my opinions publicly for a long time. Putting something out there means people can push back, and I've always been more comfortable being the quiet one in the room. But I'm opinionated, and anyone who's sat with me over a few beers knows it.",
      "So here's my first go at sharing.",
      "I've been thinking about what it means to be a brand designer, and whether handing over a visual identity is really where our role ends.",
      "As brand designers, we spend a lot of time thinking about how a business looks. The logo, typography, colours and how everything works together. And rightly so, those things matter. But I think there's an opportunity to contribute to something much bigger.",
      "Because a brand isn't just what we design. It's what people come to recognise, associate with and expect from a business. That's shaped by what they see, hear, experience and come to understand over time. Some of it is intentional. Some of it happens whether the business realises it or not.",
      "You can decide what you want your brand to stand for, but you can't completely control what people take away from it.",
      "What if a space had no logo, no prescribed colour palette or typeface? Could it still communicate something recognisable about the business?",
      "I think it could.",
      "Through the materials, the music, the way people are greeted, even the smell when you walk through the door. Those details can become familiar, especially to someone who's been there before.",
      "That's not to say logos or visual identities aren't important. They absolutely are. Recognition matters. Consistency matters. But I think it's worth questioning how much of a brand we can actually communicate through graphic design alone.",
      "A business might talk about being thoughtful and considered, but what happens when someone needs help? How easy is it to return something? How does the team respond when they've made a mistake?",
      "The identity might communicate one thing, but the business can behave in a completely different way.",
      "Every interaction is another opportunity to reinforce or contradict what people have come to expect. And over time, those interactions add up.",
      "Brand should be influencing decisions that might not traditionally sit within a design brief. Who do we collaborate with? What products do we introduce? What do we stop doing? Not every decision needs to be emotional or memorable. Sometimes being reliable, convenient or easy to deal with is enough.",
      "## So where does the brand designer sit?",
      "If a brand is shaped by how a business behaves over time, a studio can't simply hand it over in a PDF. What we can do is help establish the direction and build the systems that support it.",
      "I think about it like architecture. Before you build a house, you need to understand how someone is going to live in it. How they'll move through it, what needs to be flexible and what needs to stay fixed. I think the same should apply to building an identity. Understand how the business works and how people experience it before deciding what to design.",
      "Where does someone first meet the business? What happens next? What do they see, hear, use or interact with? What needs to feel consistent, and where should things be allowed to change?",
      "Once you understand those things, you can start making better decisions about what actually needs to be designed. Maybe that's a visual identity. Maybe it's packaging, signage, language, a digital experience or an entirely different way of organising a service. And yes, sometimes it really is just a logo and a few supporting elements.",
      "But maybe our role doesn't always end when those things are delivered. There could be more value in helping businesses apply those ideas, question decisions and adapt the system as they grow.",
      "But even the most carefully considered strategy can't guarantee how people will feel. We can help create the conditions, but the business has to live them, and the audience will make up its own mind.",
      "I think we need to be clearer about what we're actually designing, and what our role is in the process.",
      "A visual identity is something we can create and hand over. But a brand is something a business has to keep building, through the decisions it makes and the experiences it creates.",
      "Maybe our role as brand designers is to help connect those two things, not just at the beginning, but as the business grows.",
      "Cheers.",
    ],
  },
];
