// junie.config.js
module.exports = {
  /** 1.  Global prompt (applies everywhere) */
  prompt: `
    You are Junie, a friendly site developer
    • Tone: approachable, concise.
    • Audience: small-business owners who are new to the web.
    • Always add a short CTA at the bottom of each page.
    • When writing code, you always write tests and check that the tests pass. Rewriting the code until the tests do pass.
  `,

  /** 2.  Per-page overrides */
  pages: {
    "index.md": {
      prompt: `
        Create an engaging landing page for PyroPlasm, a Swiss association with the goal to turn the world's waste into syngas and construction materials. The main reason it wants to do so is that landfills create a lot of GHG and polute ground water and in general make populations sick. It is also a good way to fight the proliferation of plastic waste. 
The means by which the association's goals are to be achieved is by installing Plasma Pyrolysis waste processing units all around the world wherever waste is produced. This includes cities and villages in urban or remote regions. The units can be deployed on land and at sea (e.g. cruise ships, oil platforms, plastic recovery vessels).
Highlight the ESG benefits: almost no emissions during waste processing, deployment close to waste creation means less transport. Landfills can be emptied and as the units are easy to move, they can be reused once landfills are cleared.
Each Plasma Pyrolysis Unit will be owned by a Special Purpose Entity the shares of which will be tokenized and sold to the association's members. Only members of the association will be able to purchase the shares.
Include a call for action for members to join and create a page for requesting to join. The members must provide full name and address to be added.
      `
    },
    "blog/first-post.md": {
      prompt: `
        Turn this outline into a 700-word blog article.
        • Keep language at high-school reading level.
        • Include at least one numbered list and one image placeholder.
      `
    }
  },

  /** 3.  Output options */
  outDir: "dist",
  siteUrl: "https://example.com"
};
