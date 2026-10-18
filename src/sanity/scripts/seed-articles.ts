/**
 * Seed Talk's writing.
 * Run: npx sanity exec src/sanity/scripts/seed-articles.ts --with-user-token
 *
 * Writes the articles in articles-content.ts and leaves anything else in the
 * dataset alone. Unlike the project seeds there is no "all of them must be
 * present" guard: articles are a growing list, not a fixed six, so the test
 * those guards make — does this dataset look like the one I expect — has
 * nothing to count. It checks for the work instead, which is what tells a
 * production dataset apart from an empty one.
 */
import { getCliClient } from "sanity/cli";
import { ARTICLES } from "./articles-content";

const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 120000 });

/** A paragraph, or a subheading when it is written as one. */
function block(key: string, text: string) {
  const sub = text.startsWith("## ");
  return {
    _type: "block",
    _key: key,
    style: sub ? "h2" : "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text: sub ? text.slice(3) : text, marks: [] }],
  };
}

async function main() {
  /* The dataset we think it is: the work is here, so this is not an empty
     or unfamiliar one. */
  const projects = await client.fetch<number>(`count(*[_type == "project"])`);
  if (!projects) {
    throw new Error("Refusing to seed: no projects in this dataset, so it is not the one expected");
  }

  for (const article of ARTICLES) {
    const document = {
      _id: article.documentId,
      _type: "article",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      published: article.published,
      standfirst: article.standfirst,
      body: article.body.map((text, i) => block(`b${i}`, text)),
    };
    await client.createOrReplace(document);
    const subs = article.body.filter((text) => text.startsWith("## ")).length;
    console.log(
      `wrote ${article.documentId} — ${article.body.length - subs} paragraphs, ${subs} subheading${subs === 1 ? "" : "s"}`
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
