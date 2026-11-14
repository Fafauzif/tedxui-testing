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
      "I changed courses last semester. On the first Monday, I went to my old building by mistake. Got halfway up the stairs, checked my phone, and had to turn around. Great start.",
      "I thought the difficult bit would be explaining the decision to my parents. That was difficult, but so was walking into a class where everyone already knew where to sit. I missed having someone save me a seat. I even missed a lecturer I'd spent months complaining about.",
      "People kept asking if I was happier. I didn't know how to answer without making the whole decision sound like a mistake. I liked the new subjects. I was also having a pretty lonely Tuesday. Both things were happening.",
      "Then a friend from my old class sent me a terrible joke from their group chat. We ended up getting lunch. I told her about the new course, and she told me what I was missing. Mostly a deadline nobody understood.",
      "We've kept the lunch thing going. I've found someone to sit with in the new class too. I still miss bits of the old course, especially when the new one gets hard. This morning I went to the right building, though. Didn't even check my phone.",
    ],
    signoff: "Someone who still takes the old staircase",
    excerpt:
      "I liked the new subjects. I was also having a pretty lonely Tuesday. Both things were happening.",
  },
  {
    id: "the-last-page",
    salutation: "To the person thinking about staying,",
    topic: "Commitment",
    paragraphs: [
      "Our student magazine had eleven files called some version of FINAL. I was checking captions on a Sunday night when someone uploaded FINAL_ACTUALLY_FINAL. I nearly threw my phone.",
      "I'd joined because I wanted to interview people. Somehow I'd become the person who checked the spelling, chased the photos and remembered whose surname we'd got wrong last time. I'd written most of a message saying I was leaving.",
      "The friend doing our layout called before I sent it. She asked what I'd miss. The interviews, I said. She asked what I wouldn't miss. I talked for quite a while.",
      "At the next meeting we split up the jobs I'd collected. It was awkward. A couple of people said they hadn't known I was doing those things. I wanted to say they should've noticed, but I also hadn't told them. We cut four pages from the next issue. Someone else took the captions.",
      "I'm still on the team. I'm not completely sure whether this arrangement will last when deadlines get bad again. For now, I've got an interview on Thursday and somebody else is chasing the photograph. The latest folder is called final2. I'm leaving it alone.",
    ],
    signoff: "The person who kept the interviews",
    excerpt:
      "A couple of people said they hadn't known I was doing those things. I wanted to say they should've noticed, but I also hadn't told them.",
  },
  {
    id: "outside-the-feed",
    salutation: "To someone with a very familiar feed,",
    topic: "Technology",
    paragraphs: [
      "A friend borrowed my phone to find a recipe and asked why I watched so many videos of people tidying desks. Fair question. My own desk has a cup on it that I'm scared to investigate.",
      "I looked at the rest of my feed that night. Loads of people saying things I already agreed with. Places I'd never been, but somehow had opinions about. The neighbourhood next to mine only seemed to show up when something bad happened there. I could've told you about its traffic problems. Couldn't have told you much else.",
      "I followed its community page. First came a missing cat, then a blood donation request, then about forty comments arguing over a speed bump. Someone kept posting pictures of the same tree. At first I thought that account was a bit boring. Now I look for the tree when I pass that street.",
      "I'm not doing a big phone detox. There are still desks. There's also a woman posting updates about her dad's food stall, and I went there last weekend. The noodles were good. The portions were ridiculous.",
      "The missing cat came home, by the way. It was hiding behind a shoe rack two doors down. I'd been checking.",
    ],
    signoff: "Someone whose desk is still a mess",
    excerpt:
      "I could've told you about its traffic problems. Couldn't have told you much else. I followed its community page.",
  },
  {
    id: "one-stop-earlier",
    salutation: "To anyone who knows the quickest route,",
    topic: "Everyday life",
    paragraphs: [
      "I was very annoying about moving our bus stop. It was too far from the station, and I'd found a shorter route. I put a screenshot in the passengers' group chat. Then I put it there again.",
      "At a meeting about the route, a woman asked if I'd walked the shortcut with anyone who needed help walking. I hadn't. She took that bus with her dad. On the narrow bit of pavement, she couldn't stay beside him without stepping into the road.",
      "I walked it afterwards. There was a broken drain cover I'd never paid attention to, and a stretch where the pavement pretty much disappeared. I'd been getting past it by walking in the road for a few seconds. Easy for me. I'd left that part out of my helpful screenshot.",
      "I still want a quicker connection. The long way is horrible when it's raining, and the timetable doesn't give you much room to be late. But I'm asking different questions in the group now. I added some photos of the shortcut too.",
      "Nothing's moved yet. Last week somebody suggested fixing the pavement before arguing about the stop again. Quite a few of us liked that message.",
    ],
    signoff: "A passenger who keeps sending screenshots",
    excerpt:
      "I'd been getting past it by walking in the road for a few seconds. Easy for me. I'd left that part out of my helpful screenshot.",
  },
  {
    id: "the-extra-chairs",
    salutation: "To someone who wants to help,",
    topic: "Community",
    paragraphs: [
      "We spent longer making the book donation poster than we did talking to the reading room. I know because I made the poster. There were several font discussions.",
      "We turned up with three boxes of books. The volunteer thanked us, then asked if anyone could stay until four. Two regular volunteers were away, and the children needed people to read with them. We'd planned a quick handover, a photo and lunch. We looked at each other. Then somebody put their bag down.",
      "I sat with a kid who wanted to read the same page three times. I kept trying to turn it. He kept turning it back. Eventually I stopped, and we looked at all the things in the picture. There was a dog I'd completely missed. He thought this was very funny.",
      "I went back the next week without bringing anything. Felt strange coming through the door empty-handed. I wasn't sure what to put in our project update either. 'Read six pages, got corrected by an eight-year-old' didn't sound very impressive.",
      "They do need books, just particular ones. There's a list now. I'm going again on Saturday. Apparently the dog turns up in the next chapter wearing a hat.",
    ],
    signoff: "Someone who spent too long on the poster",
    excerpt:
      "I wasn't sure what to put in our project update either. 'Read six pages, got corrected by an eight-year-old' didn't sound very impressive.",
  },
  {
    id: "the-question-about-the-moon",
    salutation: "To the person who checks the score first,",
    topic: "Achievement",
    paragraphs: [
      "My little sister showed me a drawing of the moon. I asked if it was homework. Nope. A competition? Also nope. She'd just felt like drawing the moon.",
      "I was about to suggest something about the shading when she asked which part I liked. There was a tiny person at the bottom with a shopping bag. I'd missed him. He was supposed to be buying milk, she said, but he'd stopped to look up.",
      "We spent ages discussing whether the milk would go warm. She said he hadn't bought it yet. I said the shop might close. She said I was ruining the story.",
      "She had a point.",
      "I've noticed I do this with my friends too. Someone mentions a rehearsal, I ask about the competition. Someone starts running, I ask about their time. I don't mean to make everything into a test. I'm genuinely interested. But those are the questions that come out first.",
      "I still care about my marks. I'm calculating what I need in the next exam, which probably isn't helping me revise. The moon drawing's on our fridge now. Sometimes my sister adds things to it. The man has a dog this week. Neither of them has bought the milk.",
    ],
    signoff: "An older sibling who's been told to stop advising",
    excerpt:
      "Someone mentions a rehearsal, I ask about the competition. Someone starts running, I ask about their time.",
  },
  {
    id: "the-word-on-the-board",
    salutation: "To anyone holding back a question,",
    topic: "Learning",
    paragraphs: [
      "For three project meetings, everyone kept saying 'impact'. More impact. Measure the impact. Great impact. I wrote it down every time and hoped we'd eventually get specific.",
      "Then someone asked me to write the impact section. That's what I got for nodding so much. I opened a blank document, typed the heading and went to make toast. Came back, changed the font, made more toast. I hadn't got a clue what we were claiming.",
      "At the next meeting I asked what we meant. One person meant how many people we'd reach. Another meant whether those people would actually change what they did. A third thought we were talking about money. We'd been agreeing with each other for weeks. We spent most of that meeting working out what we'd agreed to.",
      "I'd love to say I'm now the person who asks whenever something's unclear. I'm not. Yesterday somebody used an abbreviation I didn't know and I let it go because we were nearly finished. I've written it in my phone to ask about next time.",
      "The document does have words in it now. We changed the project a bit as well. I still think we should change the title, but I've used up my meeting time for this week.",
    ],
    signoff: "The person who nodded a bit too much",
    excerpt:
      "We'd been agreeing with each other for weeks. We spent most of that meeting working out what we'd agreed to.",
  },
  {
    id: "a-different-table",
    salutation: "To someone finding their place at the table,",
    topic: "Belonging",
    paragraphs: [
      "When I joined my new class, lunch was exhausting. Everyone had stories about people I didn't know. I'd laugh when they laughed, then spend the walk home wondering if I'd laughed at the wrong bit.",
      "One day the canteen was full and I sat with someone from another class. We complained about a printer, then ate. There wasn't much else to say. I expected the silence to get awkward, but he was busy with his noodles and I was busy with mine.",
      "I finished my lunch while it was still warm. That hadn't happened much lately.",
      "I still sit with my classmates. I know who most of the people in their stories are now. Sometimes I ask them to explain an old joke, and sometimes I don't feel like listening to the whole history of it. They're fine with that. I think I'd been assuming they were judging me much more closely than they were.",
      "The other guy and I still say hi. We don't have each other's numbers. I quite like having someone I can sit next to without arranging anything. Last time we talked about his broken umbrella for ten minutes. He'd brought it in to see if the workshop could fix it.",
    ],
    signoff: "Someone who sometimes chooses the quieter table",
    excerpt:
      "I quite like having someone I can sit next to without arranging anything. Last time we talked about his broken umbrella for ten minutes.",
  },
];
