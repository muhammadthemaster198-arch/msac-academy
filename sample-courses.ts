// DEMONSTRATION DATA. Replaced by the `courses` table in Stage 3/4.
export type Course = { slug: string; title: string; description: string; level: "Beginner" | "Intermediate" | "Advanced"; duration: string; lessons: number; priceNgn: number; hue: string };
export const sampleCourses: Course[] = [
  { slug: "intro-graphic-design", title: "Introduction to Graphic Design", description: "Colour, type, layout and the principles behind every good design.", level: "Beginner", duration: "4 weeks", lessons: 20, priceNgn: 15000, hue: "from-violet to-azure" },
  { slug: "canva-beginners", title: "Canva for Beginners", description: "Make polished designs fast with no prior experience.", level: "Beginner", duration: "3 weeks", lessons: 15, priceNgn: 10000, hue: "from-azure to-mint" },
  { slug: "flyer-design", title: "Professional Flyer Design", description: "Design event and business flyers that get noticed.", level: "Intermediate", duration: "3 weeks", lessons: 14, priceNgn: 12000, hue: "from-coral to-sun" },
  { slug: "logo-brand-identity", title: "Logo Design and Brand Identity", description: "Build logos and brand systems clients will pay for.", level: "Intermediate", duration: "6 weeks", lessons: 28, priceNgn: 25000, hue: "from-ink to-violet" },
  { slug: "adobe-photoshop", title: "Adobe Photoshop", description: "Retouching, compositing and design workflows in Photoshop.", level: "Intermediate", duration: "8 weeks", lessons: 36, priceNgn: 30000, hue: "from-azure to-ink" },
  { slug: "coreldraw", title: "CorelDRAW", description: "Vector design for print: signage, branding and layouts.", level: "Intermediate", duration: "6 weeks", lessons: 26, priceNgn: 25000, hue: "from-mint to-azure" },
  { slug: "social-media-graphics", title: "Social Media Graphics", description: "Posts, carousels and stories that build an audience.", level: "Beginner", duration: "3 weeks", lessons: 16, priceNgn: 12000, hue: "from-violet to-coral" },
  { slug: "business-cards", title: "Business Card Design", description: "Print-ready business cards, from idea to press.", level: "Beginner", duration: "2 weeks", lessons: 10, priceNgn: 8000, hue: "from-sun to-coral" },
  { slug: "poster-banner", title: "Poster and Banner Design", description: "Large-format design for events, ads and campaigns.", level: "Intermediate", duration: "3 weeks", lessons: 14, priceNgn: 12000, hue: "from-ink to-azure" },
  { slug: "pro-projects", title: "Professional Graphic Design Projects", description: "Real client-style briefs to build a portfolio.", level: "Advanced", duration: "8 weeks", lessons: 24, priceNgn: 35000, hue: "from-violet to-ink" },
];
export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
