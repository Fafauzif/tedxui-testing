/** Synthetic local review data. This script never connects to Supabase. Stop npm start first. */
import { localStore } from '../server/local-store.mjs';
if (process.env.SUPABASE_URL || process.env.VERCEL) throw new Error('Synthetic fixtures run only in an isolated local database.');
const store = await localStore();
await store.db.query(`insert into public.letters(id,origin,salutation,paragraphs,signoff,excerpt,excerpts)
 values($1,'community',$2,$3,$4,$5,$6) on conflict(id) do nothing`, [
  'd86a557e-50b5-44c2-a50c-85139e458de3',
  'To someone taking their time,',
  [
    'I used to leave my sketchbook closed whenever I could not think of something good enough to draw. Last week I opened it on the bus and drew the window instead.',
    'The lines shook at every corner. I kept them. It felt good to finish something without fixing every part of it.',
    'Today I drew the cup beside my desk. Tomorrow might be another window. I am learning to let a small beginning be enough.',
  ],
  'A slow beginner',
  'I am learning to let a small beginning be enough.',
  ['I am learning to let a small beginning be enough.', 'The lines shook at every corner. I kept them.'],
]);
await store.db.close();
console.log('Added one synthetic community letter to the isolated local database.');
