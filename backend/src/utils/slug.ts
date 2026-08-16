import slugify from 'slugify';

export function makeSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true });
}

export async function uniqueSlug<T extends { slug: string }>(
  Model: { findOne: (q: object) => Promise<T | null> },
  base: string,
  excludeId?: string
): Promise<string> {
  let slug = makeSlug(base);
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const query: any = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query);
    if (!existing) return candidate;
    counter++;
  }
}
