import { config } from 'dotenv';
config();

import '@/ai/flows/ai-parse-dje-publication.ts';
import '@/ai/flows/ai-assist-document-drafting.ts';
import '@/ai/flows/ai-generate-case-summary.ts';
import '@/ai/flows/ai-summarize-interview-case-details.ts';
import '@/ai/flows/ai-search-court-address.ts';
import '@/ai/flows/ai-analyze-full-interview.ts';
