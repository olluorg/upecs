import type { Translations } from "./index";

const en: Translations = {
  lang: "EN",
  langFull: "English",
  pageTitle: "PECS Builder — free cards for augmentative and alternative communication",

  nav: {
    library: "Library",
    librarySub: "All cards",
    myset: "My Set",
    mysetSub: "Selected cards",
    sets: "My Sets",
    setsSub: "Create and switch",
    settings: "Print Settings",
    settingsSub: "Size, labels, orientation",
    instructions: "Documentation",
    instructionsSub: "What is PECS, phases, tips",
    promo: "PECS helps children express their needs",
    promoText:
      "Start with 2–3 cards your child really wants. Gradually add more over time.",
    footerTitle: "Made with care",
    footerSub: "A free tool to help children and parents",
  },

  mobile: {
    library: "Library",
    myset: "Set",
    sets: "Sets",
    settings: "Print",
    help: "Help",
  },

  header: {
    logoSub: "CONSTRUCTOR",
    howItWorks: "How it works?",
    printTips: "Print & tips",
  },

  common: {
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    delete: "Delete",
    rename: "Rename",
    duplicate: "Duplicate",
    open: "Open",
    close: "Close",
    current: "Current",
    edit: "Edit",
    cardOne: "card",
    cardFew: "cards",
    cardMany: "cards",
  },

  cardLabels: {
    cookie:   "Cookie",
    candy:    "Candy",
    chips:    "Chips",
    apple:    "Apple",
    banana:   "Banana",
    bread:    "Bread",
    cheese:   "Cheese",
    carrot:   "Carrot",
    chicken:  "Chicken",
    pasta:    "Pasta",
    icecream: "Ice cream",
    juice:    "Juice",
    water:    "Water",
    yogurt:   "Yogurt",
    ball:     "Ball",
    car:      "Toy car",
    tablet:   "Tablet",
    cartoons: "Cartoons",
    give:     "Give",
    more:     "More",
    open:     "Open",
    help:     "Help",
    stop:     "Stop",
    want:     "I want",
    play:     "Play",
    walk:     "Walk",
    look:     "Look",
    mom:      "Mom",
    dad:      "Dad",
    drink_v:  "Drink",
    eat:      "Eat",
    toilet:   "Toilet",
    sleep:    "Sleep",
    happy:    "Happy",
    sad:      "Sad",
    angry:    "Angry",
    fear:     "Fear",
  },

  categories: {
    all: "All",
    food: "Food",
    drink: "Drinks",
    actions: "Actions",
    people: "People",
    toys: "Toys",
    needs: "Needs",
    emotions: "Emotions",
    other: "Other",
  },

  library: {
    title: "Card Library",
    subtitle: "Choose cards and add them to your set",
    searchPlaceholder: "Search cards...",
    nothingFound: "Nothing found",
    tip: "Start with 2–3 cards your child really wants. Remove the rest and gradually add new ones.",
    showing: (from: number, to: number, total: number) =>
      `Showing ${from}–${to} of ${total}`,
    addToSet: "Add to set",
    removeFromSet: "Remove from set",
    cardActions: "Card actions",
    editCard: "Edit card",
    deleteCard: "Delete card",
  },

  myset: {
    subtitle: (n: number) => `(${n})`,
    dragHint: "Drag cards to reorder",
    arrowHint: "Use the arrow buttons on cards to reorder",
    empty: "Your set is empty. Go to the library and add some cards.",
    clear: "Clear",
    preview: "Preview",
    print: "Print",
    download: "Download PDF",
    addCard: "Add card",
    moveLeft: "Move left",
    moveRight: "Move right",
    remove: "Remove",
  },

  sets: {
    title: "My Sets",
    subtitle:
      "Create separate sets for different situations — breakfast, a walk, school.",
    newSet: "New set",
    setName: (n: number) => `Set ${n}`,
    deleteConfirm: (name: string) =>
      `Delete set "${name}"? Cards inside will remain in the library.`,
  },

  settings: {
    title: "Print Settings",
    subtitle: "Choose grid size, orientation and labels",
    cardSize: "Card size on page",
    large: "large",
    standard: "standard",
    small: "small",
    labelsField: "Labels",
    withLabels: "With labels",
    withoutLabels: "Without labels",
    orientation: "Orientation",
    portrait: "Portrait",
    landscape: "Landscape",
    inSet: "In set:",
    cards: "cards",
    preview: "Preview PDF",
    print: "Print",
    download: "Download PDF",
  },

  pdfModal: {
    title: "PDF Preview",
    withLabels: "with labels",
    withoutLabels: "without labels",
    portrait: "portrait",
    landscape: "landscape",
    loading: "Preparing preview…",
    empty: "Add cards to your set first.",
    back: "Back",
    print: "Print",
    download: "Download PDF",
  },

  selected: {
    fallbackName: "My Set",
    dragHint: "Drag cards from the library or reorder them here",
    addCard: "Add card",
    selectedCount: (n: number) => `Selected: ${n} cards`,
    download: "Download PDF",
    print: "Print",
    preview: "Preview PDF",
    clear: "Clear",
  },

  addCard: {
    titleAdd: "Add custom card",
    titleEdit: "Edit card",
    uploadPrompt: "Click to upload an image",
    uploadHint: "JPEG, PNG, any size",
    scale: "Scale",
    rotation: "Rotation",
    rotate90: "Rotate 90°",
    reset: "Reset",
    replaceFile: "Replace file",
    previewLabel: "Card preview",
    previewHint: "This is how the card will look in the set and in the PDF",
    previewName: "Name",
    nameLabel: "Name",
    namePlaceholder: "E.g.: Mom",
    categoryLabel: "Category",
    noImageNote:
      "Without an image the card will appear as a grey placeholder with the label.",
    cancel: "Cancel",
    add: "Add",
    save: "Save",
  },

  welcome: {
    title: "Welcome to PECS Builder",
    intro:
      "This is a free PECS card builder — a picture exchange communication system. Designed for children with autism, speech delays, or any situation where words aren't working yet but requests need to be expressed.",
    step1Title: "Choose cards",
    step1Text: "From the ready-made library or upload your own photos",
    step2Title: "Build your set",
    step2Text: "Drag cards to the right panel and reorder them",
    step3Title: "Print as PDF",
    step3Text: "2×2, 3×3 or 4×4 grid, with or without labels — on standard A4",
    learnMore: "Learn more about PECS",
    start: "Get started",
  },

  howItWorks: {
    title: "How it works?",
    steps: [
      {
        title: "1. Choose cards",
        text: "Open the library and add cards that your child really wants.",
      },
      {
        title: "2. Set up printing",
        text: "Choose a grid size (2×2, 3×3 or 4×4), orientation and whether to include labels.",
      },
      {
        title: "3. Download PDF",
        text: "Click 'Download PDF' and print the set. You can open a preview first.",
      },
      {
        title: "4. Use with your child",
        text: "Cut out, laminate and use with velcro or in a PECS binder.",
      },
    ],
  },

  printTips: {
    title: "Print & tips",
    paperTitle: "Paper & weight",
    paperText:
      "Print on heavy matte paper (160–250 g/m²) or photo paper. This will make the cards last longer.",
    laminateTitle: "Lamination",
    laminateText:
      "After printing, laminate the cards or cover them with clear tape — they will become water and crease resistant.",
    mountTitle: "Mounting",
    mountText:
      "Attach velcro to the back. This allows you to build sentences from cards and move them between a binder and a board.",
    sizeTitle: "Grid size",
    size2x2: "large cards, great for beginners.",
    size3x3: "standard, a good balance.",
    size4x4: "compact, for older children.",
    tipTitle: "Tip",
    tipText:
      "Start with 2–3 favourite cards. Gradually add new ones as your child masters them, to avoid overwhelming them.",
  },

  commboard: {
    title: "Communication Board",
    back: "Back",
    speak: "Speak",
    say: "Say",
    clear: "Clear",
    promptTitle: "I want...",
    promptSub: "Select cards to build a message",
    openBoard: "Open board",
    empty: "No cards in this set. Add cards to your set to use the board.",
  },

  instructions: {
    title: "Documentation",
    subtitle: "What is PECS, how it works and where to start",
    toc: "Contents",
    disclaimer:
      "This page gives a general overview of PECS. For an individual programme, consult a speech therapist, special education teacher or ABA therapist — they will tailor the materials and pace to your child.",
    footer:
      "Gradually add new cards and expand communication. The key is consistency and respecting your child's pace.",
    sections: [
      {
        id: "what",
        tocLabel: "What is PECS",
        heading: "1. What is PECS",
        body: [
          "PECS (Picture Exchange Communication System) is an augmentative and alternative communication (AAC) method. It was developed by Andy Bondy and Lori Frost in 1985. Originally created for children with autism spectrum disorders, it is now used for other conditions that hinder spoken language development.",
          "The core idea is simple: the child learns to communicate desires by <b>handing</b> a picture card to a communication partner. Initiative and understanding of the communicative act develop before words appear.",
        ],
      },
      {
        id: "whom",
        tocLabel: "Who it's for",
        heading: "2. Who it's for",
        intro: "PECS may be helpful if the child has:",
        list: [
          "a limited vocabulary or does not use speech to communicate;",
          "autism spectrum disorder, cerebral palsy, apraxia, genetic syndromes affecting speech;",
          "an understanding that objects can be obtained, but no tool to request them.",
        ],
        outro:
          "Age restrictions are flexible: the method is used with toddlers around 18 months, teenagers and non-verbal adults alike.",
      },
      {
        id: "phases",
        tocLabel: "Six phases of PECS",
        heading: "3. Six phases of PECS",
        intro:
          "Training is built step by step. Do not move to the next phase until the child has confidently mastered the previous one.",
        phases: [
          {
            title: "Phase I — Physical exchange",
            text: "The child learns the exchange action itself: picking up a card and placing it in the adult's hand to receive the desired item. This phase usually involves two adults — one as the communication partner, one as the physical prompter.",
          },
          {
            title: "Phase II — Distance and persistence",
            text: "The child learns to bring the card even when the adult has moved away, turned their back or is busy. They learn to get attention.",
          },
          {
            title: "Phase III — Picture discrimination",
            text: "The child chooses the correct card from two, then three, and so on. The set gradually expands here.",
          },
          {
            title: "Phase IV — Sentence structure",
            text: "A sentence strip appears: 'I want ___'. The child builds a phrase from two cards: 'I want' + the item.",
          },
          {
            title: 'Phase V — Responding to "What do you want?"',
            text: 'The child answers a direct question with cards. Before this phase, the question is deliberately not asked, to avoid suppressing spontaneous initiation.',
          },
          {
            title: "Phase VI — Commenting",
            text: 'The child learns not only to request but to comment: "I see ___", "I hear ___", "That is ___". Communication becomes two-way.',
          },
        ],
      },
      {
        id: "start",
        tocLabel: "How to start at home",
        heading: "4. How to start at home",
        steps: [
          {
            strong: "Find motivation.",
            text: "Observe for a few days what your child really wants: a specific treat, toy or cartoon. These will be the first cards.",
          },
          {
            strong: "Make 2–3 cards.",
            text: "Print them, laminate or cover with clear tape, and attach velcro to the back.",
          },
          {
            strong: "Prepare two adults.",
            text: "In early sessions it helps to have a communication partner (with the treat) and a physical prompter (who helps the child pick up and hand over the card). Prompting is gradually faded.",
          },
          {
            strong: "Don't ask 'what do you want?' in early phases.",
            text: "Let the child initiate spontaneously — that is the key point of the method.",
          },
          {
            strong: "Deliver immediately.",
            text: "Once you receive the card, give the item without delay and say aloud: 'Cookie! Well done, you asked for a cookie.'",
          },
        ],
      },
      {
        id: "tips",
        tocLabel: "Tips for parents",
        heading: "5. Tips for parents",
        list: [
          {
            strong: "Bring cards everywhere.",
            text: "PECS only works when the child has access to cards at the right moment — in the kitchen, on a walk, in the car.",
          },
          {
            strong: "Involve family members.",
            text: "Grandparents, babysitters, siblings all need to understand the system — otherwise the exchange will only work with one adult.",
          },
          {
            strong: "Don't take items away for 'practice'.",
            text: "If the child requested — they receive. Otherwise the exchange loses meaning and motivation drops.",
          },
          {
            strong: "Pair with speech.",
            text: "Say the name every time. Speech often begins to emerge alongside card exchange.",
          },
          {
            strong: "Regularity beats duration.",
            text: "10 short episodes a day is more effective than one hour-long 'session'.",
          },
          {
            strong: "Don't rush to give up cards.",
            text: "A card is not a 'crutch' — it is an independent communication tool. Moving away from it will come naturally when speech becomes more reliable.",
          },
        ],
      },
      {
        id: "tool",
        tocLabel: "How to use the builder",
        heading: "6. How to use the builder",
        note: "If the image you need isn't in the library, click 'Add card' in the right panel and upload your own. Without an image the card will appear as a grey placeholder with the label — it can still be printed.",
        steps: [
          {
            title: "1. Build your set",
            text: "In the 'Library', click '+' on the card you want or drag it to the 'My Set' panel on the right.",
          },
          {
            title: "2. Reorder",
            text: "In the set, cards can be dragged to arrange them as your child finds most comfortable.",
          },
          {
            title: "3. Configure printing",
            text: "Choose a grid size (2×2, 3×3 or 4×4), orientation and whether to include labels.",
          },
          {
            title: "4. Download and print",
            text: "Click 'Preview PDF' to check the layout or go straight to 'Download PDF'. Print on heavy paper, laminate and attach velcro.",
          },
        ],
      },
      {
        id: "faq",
        tocLabel: "FAQ",
        heading: "7. FAQ",
        items: [
          {
            q: "What age can you start?",
            a: "There are no formal age limits. In practice PECS is most often started at 1.5–2 years, but the method remains effective at older ages too.",
          },
          {
            q: "When can you expect first results?",
            a: "The first successful exchange (Phase I) often happens within a few sessions. Moving through subsequent phases takes weeks or months — every child has their own pace.",
          },
          {
            q: "Will PECS delay speech development?",
            a: "Research shows the opposite: augmentative communication helps speech emerge. Cards remove pressure and help the child understand the purpose of communication.",
          },
          {
            q: "How many cards do you need to start?",
            a: "Start with 2–3. Too large a set is overwhelming and makes discrimination harder, especially in early phases.",
          },
          {
            q: "Where can I find good pictograms?",
            a: "This builder includes a ready-made set. You can also use your own photos of objects familiar to the child — sometimes that's even clearer. Upload them via 'Add card'.",
          },
        ],
      },
    ],
  },
};

export default en;
