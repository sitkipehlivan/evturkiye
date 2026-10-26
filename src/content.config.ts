import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const haberler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/haberler' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['turkiye', 'dunya', 'rehber']),
    date: z.coerce.date(),
    image: z.string().optional(),
    source: z.string().optional(),
    sourceUrl: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const firsatlar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/firsatlar' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['arac', 'sarj']),
    brand: z.string(),
    summary: z.string(),
    endDate: z.coerce.date().optional(),
    date: z.coerce.date(),
    sourceUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { haberler, firsatlar };
