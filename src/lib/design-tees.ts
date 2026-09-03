import type { Product, ProductColor } from "@/lib/products";

const teeColors: ProductColor[] = [
  { name: "Heather Grey", hex: "#9aa3ad" },
  { name: "Black", hex: "#111111" },
  { name: "White", hex: "#f4f4f4" },
];

const teeDetails = [
  "Jerzees crew-neck tee",
  "Left-chest CriticalThinkers.us mark",
  "Full back graphic",
  "Printed in the USA",
];

function views(id: number) {
  const slug = `design-${id}`;
  return {
    "Heather Grey": {
      front: `/designs/${slug}-grey-front.png`,
      back: `/designs/${slug}-grey-back.png`,
    },
    Black: {
      front: `/designs/${slug}-black-front.png`,
      back: `/designs/${slug}-black-back.png`,
    },
    White: {
      front: `/designs/${slug}-white-front.png`,
      back: `/designs/${slug}-white-back.png`,
    },
  };
}

function tee(
  id: number,
  name: string,
  description: string,
  featured = false,
): Product {
  const colorViews = views(id);
  return {
    slug: `design-${id}-tee`,
    name,
    price: 32,
    category: "T-shirts",
    image: colorViews["Heather Grey"].front,
    description,
    details: teeDetails,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: teeColors,
    views: colorViews,
    featured,
  };
}

export const designTees: Product[] = [
  tee(
    1,
    "GITMO Tee",
    "A tropical-resort satire on the back, CriticalThinkers.us on the chest. Grey, black, or white.",
    true,
  ),
  tee(
    2,
    "William Casey Quote Tee",
    "The 1981 Casey line about disinformation, printed on the back with the chest mark up front.",
    true,
  ),
  tee(
    3,
    "CIA Memo Tee",
    "Conspiracy theory as a dismissal tactic. CIA memo 1035-960 on the back.",
  ),
  tee(
    4,
    "George Soros Quote Tee",
    "A back-print quote attributed to George Soros, with the CriticalThinkers.us chest mark.",
  ),
  tee(
    5,
    "JFK Plot Tee",
    "The plot quote attributed to John F. Kennedy, dated seven days before Dallas.",
    true,
  ),
  tee(
    6,
    "Kissinger Quote Tee",
    "Once the herd accepts it, they will accept anything. Kissinger on the back.",
  ),
  tee(
    7,
    "Julian Assange Tee",
    "A nation cannot solve what the press will not let it perceive.",
  ),
  tee(
    8,
    "Andrew Jackson Banking Tee",
    "If the people understood the money system, there would be revolution before morning.",
  ),
  tee(
    9,
    "Lincoln Constitution Tee",
    "We the people are the rightful masters of Congress and the courts. Lincoln on the back.",
  ),
  tee(
    10,
    "Edward Bernays Tee",
    "Propaganda is the executive arm of the invisible government. Father of propaganda, 1930.",
  ),
  tee(
    11,
    "Department of Health Tee",
    "2021 versus 2025. A two-panel back graphic with the chest mark up front.",
  ),
  tee(
    12,
    "Nothing Can Stop What's Coming Tee",
    "My next piece is called… nothing can stop what's coming.",
  ),
  tee(
    13,
    "False Knowledge Tee",
    "Beware of false knowledge. It is more dangerous than ignorance. Shaw, over the news logos.",
  ),
  tee(
    14,
    "I See Dead People Voting Tee",
    "The Sixth Sense still, rewritten for election season.",
  ),
  tee(
    15,
    "Orwell Truth Tee",
    "The further a society drifts from the truth, the more it will hate those that speak it.",
  ),
  tee(
    16,
    "Best Defense Tee",
    "The best defense against propaganda is more propaganda. Bernays, over the news logos.",
  ),
];
