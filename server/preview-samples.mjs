const sampleLetters = [
  {
    id: 'preview-sample-01-early',
    salutation: 'To the person who gets here too early,',
    paragraphs: [
      'I used to get to class twenty minutes early and walk past the room three times so nobody would see me waiting outside it. There’s another person who gets there before me now. We didn’t speak for most of the semester.',
      'On Tuesday she asked me to hold her iced tea while she tied her shoe. Today she held the door and said, “Your seat’s free.” I didn’t know I had one.',
    ],
    signoff: 'The one by the window',
    excerpt: 'Today she held the door and said, “Your seat’s free.” I didn’t know I had one.',
  },
  {
    id: 'preview-sample-02-name-tag',
    salutation: 'To whoever still has their old name tag,',
    paragraphs: [
      'Mine says LOGISTICS in marker. I kept it in my wallet for a year after I left the committee. Last week I pulled it out by accident while paying for noodles. The cashier turned it over and asked if I still needed it.',
      'I said yes. Then I went home and took it out of my wallet. It’s on my desk now, underneath a receipt for the noodles. Apparently that’s as far as I’m getting this week.',
    ],
    signoff: 'Formerly on logistics',
    excerpt: 'It’s on my desk now, underneath a receipt for the noodles. Apparently that’s as far as I’m getting this week.',
  },
  {
    id: 'preview-sample-03-hi-ma',
    salutation: 'Hi, Ma,',
    paragraphs: [
      'You asked whether I’ve been eating properly. Last night I ate rice straight from the cooker because the bowl was still in the sink. I almost sent you a picture. You would’ve asked why I didn’t just wash the bowl, which is a fair question.',
      'I finally bought the little strainer you told me to get. It fits. I can hear exactly how you’d say “See?”',
    ],
    signoff: 'Your kid',
    excerpt: 'I finally bought the little strainer you told me to get. It fits. I can hear exactly how you’d say “See?”',
  },
  {
    id: 'preview-sample-04-whatever-works',
    salutation: 'To the person who said “whatever works,”',
    paragraphs: [
      'We were picking a place to eat. I said “whatever works,” too. Then we spent forty minutes at a restaurant neither of us liked. On the walk home you said you actually wanted dumplings. So did I.',
      'Next Friday I’m sending you the pin for the dumpling place at noon. You can still say you want something else. I’d actually love it if you did.',
    ],
    signoff: 'The one who ordered fries',
    excerpt: 'On the walk home you said you actually wanted dumplings. So did I.',
  },
  {
    id: 'preview-sample-05-lab-partner',
    salutation: 'To my old lab partner,',
    paragraphs: [
      'I still reach for the calculator on the left side of the table. That’s where you used to leave yours when mine ran out of battery. I bought a new one this week. I put it on the left without thinking.',
      'Anyway, the third drawer still sticks. I gave it the little kick you used to give it and it opened on the first try. I thought you’d want to know.',
    ],
    signoff: 'Your lab partner',
    excerpt: 'I bought a new one this week. I put it on the left without thinking.',
  },
].map(letter => ({
  ...letter,
  origin: 'community',
  excerpts: [letter.excerpt],
  topic: '',
  paths: [],
  createdAt: '2026-11-21T00:00:00.000Z',
}));

const samplesById = new Map(sampleLetters.map(letter => [letter.id, letter]));

export function withPreviewSamples(store, env = process.env, { local = false } = {}) {
  const isPreview = local ? !env.VERCEL && !env.VERCEL_ENV : env.VERCEL_ENV === 'preview';
  if (!isPreview || env.SAMPLE_LETTERS_ENABLED !== 'true') return store;

  return {
    ...store,
    async rpc(name, parameters) {
      if (name === 'ltg_letter') {
        const sample = samplesById.get(parameters.p_id);
        if (sample) return sample;
      }

      if (name === 'ltg_community') {
        const lastSample = sampleLetters.findIndex(letter => letter.id === parameters.p_id);
        if (!parameters.p_before || lastSample >= 0) {
          // Put samples before real letters without changing the real database cursor order.
          const remainingSamples = sampleLetters.slice(lastSample + 1);
          const limit = parameters.p_limit;
          if (remainingSamples.length >= limit) return remainingSamples.slice(0, limit);
          const rows = await store.rpc(name, {
            ...parameters,
            p_before: null,
            p_id: '',
            p_limit: limit - remainingSamples.length,
          });
          return [...remainingSamples, ...rows];
        }
      }

      return store.rpc(name, parameters);
    },
  };
}
