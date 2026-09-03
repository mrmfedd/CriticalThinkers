import { designTees } from "@/lib/design-tees";

export type ProductCategory = "T-shirts" | "Apparel" | "Accessories" | "Drinkware";

export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductViews = {
  front: string;
  back: string;
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description: string;
  details: string[];
  sizes: string[];
  colors: ProductColor[];
  views?: Record<string, ProductViews>;
  featured?: boolean;
  blendMode?: "multiply" | "color-burn";
};

export function imageFor(
  product: Product,
  colorName = product.colors[0]?.name,
  view: keyof ProductViews = "front",
) {
  return product.views?.[colorName]?.[view] || product.image;
}

export const products: Product[] = [
  {
    slug: "make-america-think-again-tee",
    name: "Make America Think Again Tee",
    price: 32,
    category: "Apparel",
    image: "/products/mata-tee-navy.png",
    description:
      "The flagship shirt. Heavyweight cotton, a chest-front slogan, and enough presence to start the conversation before you even sit down.",
    details: [
      "6.5 oz ringspun cotton",
      "Ribbed collar that holds its shape",
      "Printed in the USA",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#111111" },
      { name: "Red", hex: "#b91c1c" },
      { name: "White", hex: "#f4f4f4" },
    ],
    featured: true,
    blendMode: "multiply",
  },
  {
    slug: "think-again-white-tee",
    name: "Think Again White Tee",
    price: 32,
    category: "Apparel",
    image: "/products/mata-tee-white.png",
    description:
      "A clean white field with navy and red type. Built for daylight rallies, cookouts, and any room that needs a better argument.",
    details: [
      "Soft-washed cotton",
      "Pre-shrunk",
      "Side-seamed for a sharper drape",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#f7f7f7" },
      { name: "Ash", hex: "#d9d4cc" },
      { name: "Ice Blue", hex: "#c5d4e8" },
    ],
    featured: true,
    blendMode: "color-burn",
  },
  {
    slug: "critical-thinkers-hoodie",
    name: "Critical Thinkers Hoodie",
    price: 68,
    category: "Apparel",
    image: "/products/mata-hoodie.png",
    description:
      "A heavyweight hoodie with metallic chest type. Warm, stubborn, and built for long arguments on cold mornings.",
    details: [
      "Fleece-lined kangaroo pocket",
      "Double-needle stitching",
      "Drawcord hood",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#101010" },
      { name: "Navy", hex: "#17233b" },
      { name: "Charcoal", hex: "#3a3f46" },
    ],
    featured: true,
    blendMode: "multiply",
  },
  {
    slug: "womens-think-again-tee",
    name: "Women's Think Again Tee",
    price: 30,
    category: "Apparel",
    image: "/products/mata-womens-tee.png",
    description:
      "A fitted cut with the same slogan, scaled for a cleaner shoulder and a shorter sleeve. Same message. Sharper silhouette.",
    details: ["Semi-fitted women's cut", "Soft heather cotton blend", "Tear-away label"],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Charcoal", hex: "#4b4f55" },
      { name: "Navy", hex: "#1c2a44" },
      { name: "Red", hex: "#a3182d" },
    ],
    featured: true,
    blendMode: "multiply",
  },
  {
    slug: "think-again-polo",
    name: "Think Again Polo",
    price: 48,
    category: "Apparel",
    image: "/products/mata-polo.png",
    description:
      "The civic uniform. Navy pique polo with a discreet flag at the chest and THINK AGAIN on the opposite side.",
    details: ["Cotton pique", "Three-button placket", "Side vents"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "White", hex: "#f3f3f3" },
      { name: "Black", hex: "#141414" },
    ],
    blendMode: "multiply",
  },
  {
    slug: "critical-thinkers-long-sleeve",
    name: "Critical Thinkers Long Sleeve",
    price: 38,
    category: "Apparel",
    image: "/products/mata-longsleeve.png",
    description:
      "Chrome-style chest type with a flag on the sleeve. The layer you throw on when the weather, and the debate, both turn.",
    details: ["Midweight cotton", "Rib cuffs", "Shoulder taping"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#18233a" },
      { name: "Olive", hex: "#3f4a3a" },
    ],
    blendMode: "multiply",
  },
  {
    slug: "think-again-cap",
    name: "Think Again Cap",
    price: 28,
    category: "Accessories",
    image: "/products/mata-cap.png",
    description:
      "Structured navy cap with raised THINK AGAIN embroidery and a flag patch on the side. One size. Adjustable. Unapologetic.",
    details: ["Structured mid-profile", "Adjustable snapback", "Embroidered front"],
    sizes: ["One Size"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#111111" },
      { name: "Red", hex: "#b91c1c" },
    ],
    featured: true,
    blendMode: "multiply",
  },
  {
    slug: "think-again-tote",
    name: "Think Again Tote",
    price: 24,
    category: "Accessories",
    image: "/products/mata-tote.png",
    description:
      "A canvas tote that carries books, ballots, and groceries with the same slogan on the front.",
    details: ["12 oz cotton canvas", "Reinforced handles", "Interior slip pocket"],
    sizes: ["One Size"],
    colors: [
      { name: "Natural", hex: "#e6dcc8" },
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#1b1b1b" },
    ],
    blendMode: "multiply",
  },
  {
    slug: "critical-thinkers-sticker-pack",
    name: "Critical Thinkers Sticker Pack",
    price: 8,
    category: "Accessories",
    image: "/products/mata-stickers.png",
    description:
      "A five-piece vinyl pack: slogan banner, flag shield, star bar, chrome wordmark, and Think Again badge.",
    details: ["Weatherproof vinyl", "Five unique designs", "Laptop and bumper ready"],
    sizes: ["Pack of 5"],
    colors: [{ name: "Assorted", hex: "#c8102e" }],
    blendMode: "multiply",
  },
  {
    slug: "think-again-mug",
    name: "Think Again Mug",
    price: 18,
    category: "Drinkware",
    image: "/products/mata-mug.png",
    description:
      "Navy ceramic mug with a red rim stripe. For coffee, tea, and the first argument of the morning.",
    details: ["11 oz ceramic", "Dishwasher safe", "Printed wrap design"],
    sizes: ["11 oz"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#151515" },
      { name: "White", hex: "#f5f5f5" },
    ],
    featured: true,
    blendMode: "multiply",
  },
  {
    slug: "think-again-tumbler",
    name: "Think Again Tumbler",
    price: 32,
    category: "Drinkware",
    image: "/products/mata-tumbler.png",
    description:
      "Insulated stainless steel, navy powder coat, and a wrap slogan that survives the commute.",
    details: ["20 oz double-wall steel", "Keeps drinks hot or cold", "Slide lid"],
    sizes: ["20 oz"],
    colors: [
      { name: "Navy", hex: "#1a2744" },
      { name: "Black", hex: "#111111" },
      { name: "Red", hex: "#b91c1c" },
    ],
    blendMode: "multiply",
  },
  ...designTees,
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
