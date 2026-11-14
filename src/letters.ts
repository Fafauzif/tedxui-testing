/** Fictional editorial examples for this frontend proof of concept.
 * Replace with permissioned contributions before presenting these as real letters.
 */
export interface Letter {
  id: string;
  salutation: string;
  paragraphs: string[];
  signoff: string;
  excerpt: string;
  topic: string;
}

export const letters: Letter[] = [
  {
    id: "the-old-staircase",
    salutation: "To anyone starting over,",
    topic: "Starting over",
    paragraphs: [
      "On the first Monday after I changed courses, I walked into the wrong building. I made it halfway up the stairs before I noticed. My feet had remembered a timetable I no longer had.",
      "I sat outside for ten minutes because I was early for the wrong class and late for the right one. In my bag was a notebook with the old course name written on the cover. I had crossed it out so firmly that the next three pages were dented.",
      "People kept asking whether I was happier now. I wanted a smaller question. Did I understand the assignment? Had I found somewhere to sit at lunch? Could I admit that I missed a subject I had chosen to leave?",
      "Last week, someone from my old class sent me a photograph of a ridiculous slide from a lecture. I laughed and asked what else I had missed. It was a relief to find that I could still be interested without taking that as an instruction to go back.",
      "I have stopped crossing things out quite so hard. The notebook still works. On Mondays, though, I have to pay attention at the gate.",
    ],
    signoff: "Someone who still takes the old staircase",
    excerpt:
      "It was a relief to find that I could still be interested without taking that as an instruction to go back.",
  },
  {
    id: "the-last-page",
    salutation: "To the person thinking about staying,",
    topic: "Commitment",
    paragraphs: [
      "Our student magazine had a folder called FINAL. Inside it were eleven files, none of them final. I spent most of a Sunday fixing other people's captions and composing a message saying I was leaving.",
      "Before I sent it, the person doing the layout called. She asked whether I wanted to leave the magazine or stop being the person who checked everything. I found the question irritating. Then I read the message again. Nearly every sentence mentioned a task.",
      "At the next meeting, I brought a list of those tasks. Someone else took the captions. We agreed to print fewer pages. I kept the interviews, which were the reason I had joined in the first place. The following issue had a typo I noticed after printing. Nobody appeared to suffer lasting harm.",
      "I still wonder whether we made the arrangement work because I finally asked, or because I had the option of leaving. That matters to me. Not everyone can make the same threat, even silently.",
      "For now, I have an interview on Thursday. I am looking forward to it. I have also stopped calling a folder FINAL.",
    ],
    signoff: "The person who kept the interviews",
    excerpt:
      "I still wonder whether we made the arrangement work because I finally asked, or because I had the option of leaving.",
  },
  {
    id: "outside-the-feed",
    salutation: "To someone with a very familiar feed,",
    topic: "Technology",
    paragraphs: [
      "A friend borrowed my phone to look up a recipe. Before handing it back, she asked why every recommended video involved someone reorganising a desk. I had no explanation. I own one desk, and it remains a mess.",
      "That evening I looked through the accounts I followed. There were people whose opinions I could predict before pressing play. There were subjects I knew only through people arguing about them. A neighbourhood five minutes from mine appeared mostly when something had gone wrong there.",
      "I started following its community noticeboard. The first week brought a missing cat, a blood donation request and a disagreement about where to put a speed bump. None of it made an impressive conversation topic. But when I passed that street, I knew why there were new marks on the road.",
      "My feed still contains desks. I have added things rather than attempting a dramatic digital clean-up. Sometimes I cannot tell whether I am becoming curious or simply training a different set of recommendations.",
      "The cat came home, by the way. Someone posted a photograph of it asleep beside a shoe rack. I was pleased to have seen that part of the story too.",
    ],
    signoff: "Someone whose desk is still a mess",
    excerpt:
      "A neighbourhood five minutes from mine appeared mostly when something had gone wrong there.",
  },
  {
    id: "one-stop-earlier",
    salutation: "To anyone who knows the quickest route,",
    topic: "Everyday life",
    paragraphs: [
      "I spent a month arguing that our bus stop should move closer to the station. The walk looked inefficient on the map. I had measured it twice and arrived at the meeting with a screenshot.",
      "A woman sitting beside me asked where the pavement became wide enough for two people to walk together. I did not know. She travelled with her father, who needed someone beside him. The shorter route had a narrow section where one of them had to step into the road.",
      "After the meeting, I walked both routes. I kept noticing things my screenshot had left out: a broken drain cover, a tree root, a stretch with no shade. I also noticed that I could step over the problems without thinking about them for very long.",
      "The stop has not moved. There are other reasons for that, including reasons nobody explained particularly well. I would still like a faster connection, especially when it rains. But I have become less confident about describing those extra minutes as wasted.",
      "My screenshot is still in the group chat. I added photographs of the pavement underneath it. I wish I had taken them first.",
    ],
    signoff: "A passenger with a slightly different map",
    excerpt:
      "I also noticed that I could step over the problems without thinking about them for very long.",
  },
  {
    id: "the-extra-chairs",
    salutation: "To someone who wants to help,",
    topic: "Community",
    paragraphs: [
      "We arrived at the reading room carrying three boxes of books. We had collected them for weeks, made a poster and photographed the boxes before sealing them. The volunteer who opened the door thanked us and asked whether anyone could stay until four.",
      "Two regular volunteers were away. The children needed someone to sit with them while they read. We had planned twenty minutes for the handover and an hour for lunch. I remember looking at our schedule as if it had authority over the room.",
      "We stayed. One child wanted to read the same page three times. Another asked me the meaning of a word I could not explain without looking it up. Most of the books we had brought stayed in their boxes that afternoon.",
      "I went back the following week without bringing anything. This felt awkward. I had become comfortable arriving with objects that made my usefulness visible. Sitting in a small chair and getting through six pages offered less material for an update.",
      "They did need some new books eventually. They also needed a shelf repaired. I am trying to ask before making the next poster. It sounds straightforward when I write it down; I still catch myself planning the answer first.",
    ],
    signoff: "Someone learning to ask before packing",
    excerpt:
      "It sounds straightforward when I write it down; I still catch myself planning the answer first.",
  },
  {
    id: "the-question-about-the-moon",
    salutation: "To the person who checks the score first,",
    topic: "Achievement",
    paragraphs: [
      "My younger sister showed me a drawing of the moon. I asked whether it was for school. She said no. I asked whether she had used a reference. She said she had looked out of the window.",
      "I was about to suggest something about shading when she asked which bit I liked. There was a tiny person at the bottom, holding what looked like a shopping bag. I had barely noticed him. Apparently he had gone out for milk and become distracted.",
      "We talked about what would happen to the milk. It was the longest conversation I had had about something unfinished in weeks without trying to improve it. Later, I realised how often I asked my friends about results before asking what they had actually been doing.",
      "I have not stopped caring about marks. There is an exam timetable above my desk, and I still calculate averages when I should be sleeping. But when a friend sent me a photograph from a rehearsal, I asked what they were playing before asking about the competition.",
      "The moon drawing is on our fridge. The little person never made it to the shop. My sister says this is allowed.",
    ],
    signoff: "An older sibling still learning how to look",
    excerpt:
      "It was the longest conversation I had had about something unfinished in weeks without trying to improve it.",
  },
  {
    id: "the-word-on-the-board",
    salutation: "To anyone holding back a question,",
    topic: "Learning",
    paragraphs: [
      "For three meetings, I wrote the same word in my notebook and underlined it. Everyone in our project group used it. I could follow enough of the conversation to nod at appropriate moments, so I kept postponing the question.",
      "Eventually someone asked me to put together a page about it. This was an unfortunate consequence of looking attentive. I spent that evening searching definitions, which disagreed with one another in ways I did not understand.",
      "At the next meeting, I asked what we meant by the word in this particular project. One person answered. Another said that was not how she had been using it. We spent twenty minutes discovering that our shared vocabulary had been hiding three different plans.",
      "I would like to report that I now ask questions without hesitation. Yesterday I let an unfamiliar abbreviation pass because the meeting was already running late. There are practical limits, and there is also the familiar wish to seem prepared.",
      "What has changed is my notebook. Beside words I cannot explain, I put a question mark instead of an underline. It is a small difference on the page. It makes the unfinished work easier to find.",
    ],
    signoff: "The person with questions in the margin",
    excerpt:
      "We spent twenty minutes discovering that our shared vocabulary had been hiding three different plans.",
  },
  {
    id: "a-different-table",
    salutation: "To someone finding their place at the table,",
    topic: "Belonging",
    paragraphs: [
      "At lunch, my new classmates talked about people I had never met. I learned names before faces and laughed whenever everyone else laughed. On the walk home, I replayed small things I had said, checking them for mistakes.",
      "One afternoon, the canteen was crowded and I ended up sitting beside someone from a different class. We complained about a printer. Then we ate for a while without talking. I remember finishing my food while it was still warm.",
      "I had been treating every lunch as an audition. This other person did not know the cast, so I could not perform the role I had been practising. We had almost nothing to discuss. It was an unexpectedly comfortable meal.",
      "I still sit with my classmates. Their old stories make more sense now, and I have discovered that some of them were filling silences because they were nervous too. I also sometimes choose the quieter table. I am trying to notice the difference between wanting company and wanting evidence that I have been included.",
      "Last week, I brought up a story nobody else knew. They asked questions. I left a few details out because I wanted to finish eating, which felt like progress of a very ordinary kind.",
    ],
    signoff: "Someone who sometimes chooses the quieter table",
    excerpt:
      "I am trying to notice the difference between wanting company and wanting evidence that I have been included.",
  },
];
