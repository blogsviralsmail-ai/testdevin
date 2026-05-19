/* ========================================================
   RICH CONTENT DATA — Videos, Charts, PDF Notes, Interactive
   Key format: "classId-subjectId-chapterId"
   ======================================================== */

const richContentData = {

  /* ============================================================
     CLASS 6 — SCIENCE
     ============================================================ */
  '6-science-1': {
    videos: [
      { title: 'આહારના ઘટકો - Full Chapter', titleEn: 'Components of Food - Explained', id: 'Jjv-4GWLUQM', duration: '18:45', views: '50K+' },
      { title: 'આહારના ઘટકો - Quick Revision', titleEn: 'Components of Food - Summary', id: 'S4O5voOCqAQ', duration: '8:20', views: '25K+' }
    ],
    charts: [
      {
        title: 'પોષક તત્વોનું વર્ગીકરણ (Nutrients Classification)',
        desc: 'શરીરને જરૂરી પોષક તત્વો અને તેના સ્ત્રોત',
        type: 'table',
        headers: ['પોષક તત્વ', 'Nutrient', 'સ્ત્રોત (Source)', 'કાર્ય (Function)'],
        rows: [
          ['કાર્બોહાઈડ્રેટ', 'Carbohydrates', 'ચોખા, ઘઉં, બટાકા', 'ઊર્જા આપે છે'],
          ['પ્રોટીન', 'Proteins', 'દૂધ, ઈંડા, દાળ', 'શરીર વૃદ્ધિ અને રિપેર'],
          ['ચરબી', 'Fats', 'ઘી, તેલ, માખણ', 'ઊર્જા સંગ્રહ'],
          ['વિટામિન', 'Vitamins', 'ફળો, શાકભાજી', 'રોગ પ્રતિકાર'],
          ['ખનિજ ક્ષાર', 'Minerals', 'દૂધ, લીલા શાક', 'હાડકાં, દાંત મજબૂત'],
          ['પાણી', 'Water', 'પાણી, ફળો', 'શરીરનું તાપમાન નિયંત્રણ']
        ]
      },
      {
        title: 'Vitamins Chart',
        desc: 'વિટામિન અને તેની ઉણપથી થતા રોગો',
        type: 'table',
        headers: ['Vitamin', 'Source', 'Deficiency Disease'],
        rows: [
          ['Vitamin A', 'ગાજર, પપૈયા', 'રાતાંધળાપણું (Night Blindness)'],
          ['Vitamin B1', 'દાળ, whole grains', 'બેરીબેરી (Beriberi)'],
          ['Vitamin C', 'લીંબુ, સંતરા, આમળા', 'સ્કર્વી (Scurvy)'],
          ['Vitamin D', 'સૂર્યપ્રકાશ, દૂધ', 'રિકેટ્સ (Rickets)']
        ]
      },
      {
        title: 'Balanced Diet Diagram',
        type: 'diagram',
        items: [
          { icon: '🍚', label: 'Carbohydrates', sublabel: 'Energy giving' },
          { icon: '🥩', label: 'Proteins', sublabel: 'Body building' },
          { icon: '🧈', label: 'Fats', sublabel: 'Energy storage' },
          { icon: '🥕', label: 'Vitamins', sublabel: 'Protective' },
          { icon: '🥛', label: 'Minerals', sublabel: 'Regulatory' },
          { icon: '💧', label: 'Water', sublabel: 'Essential' },
          { icon: '🌾', label: 'Roughage', sublabel: 'Digestion' }
        ]
      }
    ],
    pdf: {
      title: 'આહારના ઘટકો - Complete Notes',
      sections: [
        { heading: 'પરિચય (Introduction)', body: 'આહાર (Food) એ જીવવા માટે અત્યંત જરૂરી છે. આપણું શરીર ખોરાકમાંથી ઊર્જા, પોષક તત્વો અને પાણી મેળવે છે. સંતુલિત આહાર (Balanced Diet) એ એવો આહાર છે જેમાં બધા જ પોષક તત્વો યોગ્ય પ્રમાણમાં હોય.' },
        { heading: 'પોષક તત્વો (Nutrients)', body: 'આપણા ખોરાકમાં મુખ્ય 6 પોષક તત્વો હોય છે:', list: ['કાર્બોહાઈડ્રેટ (Carbohydrates) — ઊર્જા આપે છે. ચોખા, રોટી, બટાકામાં મળે છે.', 'પ્રોટીન (Proteins) — શરીરની વૃદ્ધિ અને સમારકામ કરે છે. દૂધ, દાળ, ઈંડામાં મળે છે.', 'ચરબી (Fats) — ઊર્જા સંગ્રહ કરે છે. ઘી, તેલ, માખણમાં મળે છે.', 'વિટામિન (Vitamins) — રોગ પ્રતિકારક શક્તિ વધારે છે. ફળો, શાકભાજીમાં મળે છે.', 'ખનિજ ક્ષાર (Minerals) — હાડકાં, દાંત મજબૂત કરે છે. દૂધ, લીલા શાકમાં.', 'પાણી (Water) — શરીરનું તાપમાન નિયંત્રિત કરે છે.'] },
        { heading: 'સંતુલિત આહાર (Balanced Diet)', highlight: 'સંતુલિત આહાર = કાર્બોહાઈડ્રેટ + પ્રોટીન + ચરબી + વિટામિન + ખનિજ + પાણી + રેસા' },
        { heading: 'ઉણપથી થતા રોગો (Deficiency Diseases)', list: ['Vitamin A ની ઉણપ → રાતાંધળાપણું (Night Blindness)', 'Vitamin C ની ઉણપ → સ્કર્વી (Scurvy)', 'Vitamin D ની ઉણપ → રિકેટ્સ (Rickets)', 'Iron ની ઉણપ → એનીમિયા (Anaemia)', 'Iodine ની ઉણપ → ગોઈટર (Goitre)', 'Protein ની ઉણપ → Kwashiorkor / Marasmus'] },
        { heading: 'ખોરાકની ચકાસણી (Food Testing)', body: 'Starch test: Iodine solution → Blue-Black color.\nProtein test: Copper Sulphate + Caustic Soda → Violet color.\nFat test: Paper wrap → Oily patch.', note: 'ખોરાકની ચકાસણી lab માં safely કરવી.' },
        { heading: 'સારાંશ', body: 'આ પ્રકરણમાં આપણે ખોરાકના ઘટકો, પોષક તત્વો, સંતુલિત આહાર અને ઉણપથી થતા રોગો વિશે શીખ્યા.' }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — આહારના ઘટકો',
        desc: 'ખાલી જગ્યા ભરો:',
        items: [
          { before: 'ઊર્જા આપતા પોષક તત્વ ', answer: 'carbohydrates', after: ' કહેવાય છે.' },
          { before: 'Vitamin C ની ઉણપથી ', answer: 'scurvy', after: ' રોગ થાય છે.' },
          { before: 'દૂધ, ઈંડા, દાળમાં ', answer: 'protein', after: ' મળે છે.' },
          { before: 'Iron ની ઉણપથી ', answer: 'anaemia', after: ' થાય છે.' }
        ]
      },
      {
        type: 'matching',
        title: 'Match the Following — Vitamins',
        desc: 'Vitamin ને તેની ઉણપથી થતા રોગ સાથે જોડો:',
        pairs: [
          { a: 'Vitamin A', b: 'Night Blindness' },
          { a: 'Vitamin C', b: 'Scurvy' },
          { a: 'Vitamin D', b: 'Rickets' },
          { a: 'Iron', b: 'Anaemia' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True or False — Nutrients',
        desc: 'નીચેના વિધાનો True છે કે False?',
        items: [
          { statement: 'કાર્બોહાઈડ્રેટ ઊર્જા આપે છે.', answer: true },
          { statement: 'Vitamin D સૂર્યપ્રકાશથી મળે છે.', answer: true },
          { statement: 'Protein ની ઉણપથી Scurvy થાય છે.', answer: false },
          { statement: 'ચરબી (Fats) શરીર માટે જરૂરી નથી.', answer: false },
          { statement: 'Iodine ની ઉણપથી Goitre થાય છે.', answer: true }
        ]
      }
    ]
  },

  '6-science-2': {
    videos: [
      { title: 'પદાર્થોનું અલગીકરણ - Full Chapter', titleEn: 'Sorting Materials - Explained', id: 'dYjmGMVqCdE', duration: '16:30', views: '35K+' },
      { title: 'Sorting Materials into Groups - Summary', titleEn: 'Quick Revision', id: 'v0h-sMaA5w0', duration: '7:15', views: '20K+' }
    ],
    charts: [
      {
        title: 'Properties of Materials',
        type: 'table',
        headers: ['Property', 'ગુણધર્મ', 'Example'],
        rows: [
          ['Transparency', 'પારદર્શકતા', 'Glass, Water'],
          ['Hardness', 'કઠિનતા', 'Diamond, Iron'],
          ['Solubility', 'દ્રાવ્યતા', 'Sugar, Salt'],
          ['Lustre', 'ચમક', 'Gold, Silver'],
          ['Floatation', 'તરવું', 'Wood, Cork']
        ]
      },
      {
        title: 'Material Classification',
        type: 'flowchart',
        steps: [
          { label: 'Materials (પદાર્થો)', color: '' },
          { label: 'Natural (કુદરતી) / Man-made (માનવ-નિર્મિત)', color: 'green' },
          { label: 'Appearance: Lustre / No Lustre', color: 'orange' },
          { label: 'Hardness: Hard / Soft', color: 'purple' },
          { label: 'Solubility: Soluble / Insoluble', color: 'teal' },
          { label: 'Transparency: Transparent / Opaque', color: 'red' }
        ]
      }
    ],
    pdf: {
      title: 'પદાર્થોનું અલગીકરણ - Study Notes',
      sections: [
        { heading: 'પરિચય', body: 'આપણી આસપાસ અનેક પ્રકારના પદાર્થો છે. દરેક પદાર્થના ગુણધર્મો (properties) અલગ-અલગ હોય છે.' },
        { heading: 'પદાર્થોના ગુણધર્મો', list: ['Appearance (દેખાવ): ચમકીલો (Lustrous) કે ન ચમકીલો', 'Hardness (કઠિનતા): કઠિન (Hard) કે નરમ (Soft)', 'Solubility (દ્રાવ્યતા): પાણીમાં ઓગળે છે (Soluble) કે નહીં (Insoluble)', 'Transparency: પારદર્શક (Transparent), અર્ધપારદર્શક (Translucent), અપારદર્શક (Opaque)', 'Float or Sink: તરે છે (Float) કે ડૂબે છે (Sink)'] },
        { heading: 'મહત્વના Points', highlight: 'એક જ પદાર્થના અનેક ગુણધર્મો હોઈ શકે છે. ગુણધર્મોના આધારે પદાર્થોનું જૂથીકરણ થાય છે.' },
        { heading: 'સારાંશ', body: 'પદાર્થોને તેમના ગુણધર્મો (appearance, hardness, solubility, transparency) ના આધારે અલગ-અલગ જૂથોમાં વર્ગીકૃત કરી શકાય છે.' }
      ]
    },
    interactive: [
      {
        type: 'truefalse',
        title: 'True or False — Materials',
        desc: 'નીચેના વિધાનો True છે કે False?',
        items: [
          { statement: 'Glass is transparent.', answer: true },
          { statement: 'Iron is soft.', answer: false },
          { statement: 'Sugar is soluble in water.', answer: true },
          { statement: 'Wood sinks in water.', answer: false },
          { statement: 'Gold has lustre.', answer: true }
        ]
      },
      {
        type: 'matching',
        title: 'Match Property with Example',
        desc: 'ગુણધર્મ ને ઉદાહરણ સાથે જોડો:',
        pairs: [
          { a: 'Transparent', b: 'Glass' },
          { a: 'Hard', b: 'Diamond' },
          { a: 'Soluble', b: 'Sugar' },
          { a: 'Lustrous', b: 'Gold' }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 6 — MATHS
     ============================================================ */
  '6-maths-1': {
    videos: [
      { title: 'સંખ્યાઓ ઓળખીએ - Full Chapter', titleEn: 'Knowing Our Numbers', id: 'qnkWLUSxLCk', duration: '22:10', views: '60K+' },
      { title: 'Indian & International Place Value', titleEn: 'Quick Revision', id: 'NHy87Ls_VQM', duration: '10:00', views: '30K+' }
    ],
    charts: [
      {
        title: 'Indian Place Value System',
        type: 'table',
        headers: ['Place', 'ગુજરાતી', 'Value'],
        rows: [
          ['Ones', 'એકમ', '1'],
          ['Tens', 'દશક', '10'],
          ['Hundreds', 'સો', '100'],
          ['Thousands', 'હજાર', '1,000'],
          ['Ten Thousands', 'દશ હજાર', '10,000'],
          ['Lakhs', 'લાખ', '1,00,000'],
          ['Ten Lakhs', 'દશ લાખ', '10,00,000'],
          ['Crores', 'કરોડ', '1,00,00,000']
        ]
      },
      {
        title: 'Indian vs International System',
        type: 'table',
        headers: ['Indian', 'International', 'Value'],
        rows: [
          ['1 લાખ (Lakh)', '100 Thousand', '1,00,000'],
          ['10 લાખ', '1 Million', '10,00,000'],
          ['1 કરોડ (Crore)', '10 Million', '1,00,00,000'],
          ['10 કરોડ', '100 Million', '10,00,00,000'],
          ['1 અબજ (Arab)', '1 Billion', '1,00,00,00,000']
        ]
      }
    ],
    pdf: {
      title: 'સંખ્યાઓ ઓળખીએ - Complete Notes',
      sections: [
        { heading: 'સ્થાનકિંમત (Place Value)', body: 'દરેક સંખ્યામાં અંકની સ્થાનકિંમત તેની position પર depend કરે છે. ઉદાહરણ: 5,432 માં 5 ની સ્થાનકિંમત 5,000 છે.' },
        { heading: 'Indian Number System', body: 'Indian system માં commas ના placement: 1,23,45,678\nRight to left: 3 digits, 2 digits, 2 digits...', highlight: 'Example: 3,25,47,891 = ત્રણ કરોડ, પચ્ચીસ લાખ, સુડતાલીસ હજાર, આઠ સો એકાણું' },
        { heading: 'International Number System', body: 'International system: 32,547,891 = Thirty-two million, five hundred forty-seven thousand, eight hundred ninety-one' },
        { heading: 'Estimation (અંદાજ)', body: 'Estimation = approximate value. Round off to nearest 10, 100, or 1000.', formula: '4,367 ≈ 4,400 (nearest hundred) ≈ 4,000 (nearest thousand)' },
        { heading: 'Roman Numerals', list: ['I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000', 'Rule: Smaller before larger = subtract (IV = 4)', 'Larger before smaller = add (VI = 6)', 'Same numeral max 3 times (III = 3, but not IIII)'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Place Value',
        desc: 'ખાલી જગ્યા ભરો:',
        items: [
          { before: '1 Lakh = ', answer: '100000', after: '' },
          { before: '1 Crore = ', answer: '10000000', after: '' },
          { before: '1 Million = ', answer: '1000000', after: '' },
          { before: 'Roman numeral for 9 is ', answer: 'IX', after: '' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Number System',
        desc: '',
        items: [
          { statement: '1 Crore = 10 Million', answer: true },
          { statement: '1 Lakh = 1 Million', answer: false },
          { statement: 'Roman numeral for 4 is IIII', answer: false },
          { statement: 'In Indian system, first comma comes after 3 digits from right', answer: true }
        ]
      }
    ]
  },

  '6-maths-2': {
    videos: [
      { title: 'પૂર્ણ સંખ્યાઓ - Full Chapter', titleEn: 'Whole Numbers', id: '_bBz3K-fqoU', duration: '20:00', views: '40K+' }
    ],
    charts: [
      {
        title: 'Number Line',
        type: 'flowchart',
        steps: [
          { label: 'Natural Numbers: 1, 2, 3, 4, ...', color: 'green' },
          { label: 'Whole Numbers: 0, 1, 2, 3, ...', color: '' },
          { label: 'Integers: ..., -2, -1, 0, 1, 2, ...', color: 'purple' }
        ]
      },
      {
        title: 'Properties of Whole Numbers',
        type: 'table',
        headers: ['Property', 'Addition', 'Multiplication'],
        rows: [
          ['Closure', 'a + b = Whole Number', 'a × b = Whole Number'],
          ['Commutative', 'a + b = b + a', 'a × b = b × a'],
          ['Associative', '(a+b)+c = a+(b+c)', '(a×b)×c = a×(b×c)'],
          ['Identity', 'a + 0 = a', 'a × 1 = a'],
          ['Distributive', '—', 'a×(b+c) = a×b + a×c']
        ]
      }
    ],
    pdf: {
      title: 'પૂર્ણ સંખ્યાઓ - Study Notes',
      sections: [
        { heading: 'Natural Numbers vs Whole Numbers', body: 'Natural Numbers = 1, 2, 3, 4, ...\nWhole Numbers = 0, 1, 2, 3, 4, ...\nWhole Numbers = Natural Numbers + 0', highlight: 'Every Natural Number is a Whole Number, but 0 is a Whole Number and NOT a Natural Number.' },
        { heading: 'Properties', list: ['Closure Property: Two whole numbers ka sum/product always whole number hota hai', 'Commutative Property: a + b = b + a, a × b = b × a', 'Associative Property: (a + b) + c = a + (b + c)', 'Distributive Property: a × (b + c) = a×b + a×c', 'Identity: 0 for addition, 1 for multiplication'] },
        { heading: 'Number Line', body: 'Number line par whole numbers ko represent kar sakte hain. Addition = right move, Subtraction = left move.' }
      ]
    },
    interactive: [
      {
        type: 'truefalse',
        title: 'True/False — Whole Numbers',
        items: [
          { statement: 'Zero is a natural number.', answer: false },
          { statement: 'Every whole number is a natural number.', answer: false },
          { statement: 'a + b = b + a for whole numbers.', answer: true },
          { statement: 'Division is closed for whole numbers.', answer: false }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 6 — GUJARATI
     ============================================================ */
  '6-gujarati-1': {
    videos: [
      { title: 'પર્વત તારા - કવિતા', titleEn: 'Mountain Stars - Poem', id: 'wL2K8lhYs9E', duration: '12:00', views: '15K+' }
    ],
    charts: [
      {
        title: 'કવિતાના મુખ્ય મુદ્દાઓ',
        type: 'diagram',
        items: [
          { icon: '🏔️', label: 'પર્વત', sublabel: 'Mountain' },
          { icon: '⭐', label: 'તારા', sublabel: 'Stars' },
          { icon: '🌙', label: 'ચંદ્ર', sublabel: 'Moon' },
          { icon: '🌊', label: 'નદી', sublabel: 'River' },
          { icon: '🌸', label: 'પુષ્પ', sublabel: 'Flowers' }
        ]
      }
    ],
    pdf: {
      title: 'પર્વત તારા - Study Notes',
      sections: [
        { heading: 'કવિ પરિચય', body: 'આ કવિતા ગુજરાતી ભાષાની પ્રસિદ્ધ કવિતા છે. કવિએ પ્રકૃતિના સુંદર વર્ણન દ્વારા પર્વત અને તારાઓની સુંદરતા વ્યક્ત કરી છે.' },
        { heading: 'કવિતાનો સાર', body: 'કવિ પર્વતોની ઊંચાઈ અને તારાઓની ચમકને જોડીને પ્રકૃતિની મહાનતા દર્શાવે છે. રાત્રે આકાશમાં ચમકતા તારાઓ પર્વતોની ટોચ પરથી વધુ સુંદર લાગે છે.' },
        { heading: 'શબ્દાર્થ', list: ['પર્વત = Mountain', 'તારા = Stars', 'ચંદ્ર = Moon', 'આકાશ = Sky', 'સૌંદર્ય = Beauty'] },
        { heading: 'વ્યાકરણ', list: ['સંજ્ઞા (Noun): પર્વત, તારા, ચંદ્ર', 'વિશેષણ (Adjective): ઊંચા, સુંદર, ચમકતા', 'ક્રિયાપદ (Verb): ચમકે, ફરે, ઉગે'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'ખાલી જગ્યા ભરો — પર્વત તારા',
        items: [
          { before: 'પર્વત ઉપરથી ', answer: 'તારા', after: ' દેખાય છે.' },
          { before: 'રાત્રે આકાશમાં ', answer: 'ચંદ્ર', after: ' ચમકે છે.' }
        ]
      },
      {
        type: 'matching',
        title: 'શબ્દ જોડો — Gujarati to English',
        pairs: [
          { a: 'પર્વત', b: 'Mountain' },
          { a: 'તારા', b: 'Stars' },
          { a: 'ચંદ્ર', b: 'Moon' },
          { a: 'આકાશ', b: 'Sky' }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 7 — SCIENCE
     ============================================================ */
  '7-science-1': {
    videos: [
      { title: 'પોષણ અને પાચન - Full Chapter', titleEn: 'Nutrition in Plants', id: 'RF3gYxMaP7A', duration: '20:00', views: '45K+' },
      { title: 'Photosynthesis Explained', titleEn: 'Quick Revision', id: '2_d12_6oTBg', duration: '9:30', views: '28K+' }
    ],
    charts: [
      {
        title: 'Photosynthesis Process',
        type: 'flowchart',
        steps: [
          { label: 'Sunlight (સૂર્યપ્રકાશ)', color: 'orange' },
          { label: 'CO₂ + H₂O → Chlorophyll', color: 'green' },
          { label: 'Glucose (C₆H₁₂O₆) + O₂', color: '' },
          { label: 'Food stored as Starch', color: 'teal' }
        ]
      },
      {
        title: 'Modes of Nutrition',
        type: 'table',
        headers: ['Mode', 'Type', 'Example'],
        rows: [
          ['Autotrophic', 'સ્વપોષી', 'Green Plants'],
          ['Heterotrophic', 'પરપોષી', 'Animals, Fungi'],
          ['Parasitic', 'પરજીવી', 'Cuscuta (અમરવેલ)'],
          ['Saprophytic', 'મૃતોપજીવી', 'Mushroom'],
          ['Symbiotic', 'સહજીવી', 'Lichen']
        ]
      }
    ],
    pdf: {
      title: 'છોડમાં પોષણ - Complete Notes',
      sections: [
        { heading: 'Photosynthesis (પ્રકાશસંશ્લેષણ)', body: 'છોડ સૂર્યપ્રકાશની મદદથી CO₂ અને H₂O નો ઉપયોગ કરીને ખોરાક (Glucose) બનાવે છે. આ પ્રક્રિયા Chlorophyll ની હાજરીમાં થાય છે.', formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (sunlight + chlorophyll)' },
        { heading: 'Stomata (રંધ્ર)', body: 'પાંદડાની સપાટી પર નાના છિદ્રો હોય છે જેને Stomata કહે છે. CO₂ stomata દ્વારા પાંદડામાં પ્રવેશે છે.' },
        { heading: 'પોષણના પ્રકારો', list: ['Autotrophic (સ્વપોષી): છોડ પોતાનો ખોરાક બનાવે છે', 'Heterotrophic (પરપોષી): પ્રાણીઓ ખોરાક બીજા પાસેથી મેળવે છે', 'Parasitic: બીજા જીવ પર આધારિત (Cuscuta)', 'Saprophytic: મૃત પદાર્થોમાંથી ખોરાક (Mushroom)', 'Insectivorous Plants: જીવજંતુ ખાય છે (Venus Flytrap)'] },
        { heading: 'Nitrogen Fixation', body: 'Rhizobium bacteria leguminous plants (દાળ) ના મૂળમાં રહે છે અને atmospheric nitrogen ને fix કરે છે.', note: 'Farmers alternate leguminous crops to naturally add nitrogen to soil.' }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Photosynthesis',
        items: [
          { before: 'Photosynthesis માં છોડ ', answer: 'glucose', after: ' બનાવે છે.' },
          { before: 'Chlorophyll ', answer: 'green', after: ' color નો હોય છે.' },
          { before: 'CO₂ પાંદડામાં ', answer: 'stomata', after: ' દ્વારા પ્રવેશે છે.' }
        ]
      },
      {
        type: 'ordering',
        title: 'Photosynthesis Steps — Correct Order',
        desc: 'Photosynthesis ના steps ને સાચા ક્રમમાં ગોઠવો:',
        items: [
          { text: 'Sunlight falls on leaf', order: 1 },
          { text: 'CO₂ enters through stomata', order: 2 },
          { text: 'Water absorbed by roots', order: 3 },
          { text: 'Chlorophyll captures light energy', order: 4 },
          { text: 'Glucose is produced', order: 5 },
          { text: 'O₂ is released', order: 6 }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Nutrition',
        items: [
          { statement: 'All plants are autotrophs.', answer: false },
          { statement: 'Mushroom makes its own food.', answer: false },
          { statement: 'Cuscuta is a parasite.', answer: true },
          { statement: 'Rhizobium fixes nitrogen.', answer: true }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 8 — SCIENCE
     ============================================================ */
  '8-science-1': {
    videos: [
      { title: 'પાક ઉત્પાદન અને વ્યવસ્થાપન', titleEn: 'Crop Production & Management', id: 'QmjPnHG5FCo', duration: '19:00', views: '40K+' }
    ],
    charts: [
      {
        title: 'Agricultural Practices (ખેતી પ્રક્રિયાઓ)',
        type: 'flowchart',
        steps: [
          { label: '1. જમીન તૈયારી (Soil Preparation)', color: '' },
          { label: '2. વાવણી (Sowing)', color: 'green' },
          { label: '3. ખાતર/ઉર્વરક (Manure/Fertilizer)', color: 'orange' },
          { label: '4. સિંચાઈ (Irrigation)', color: 'teal' },
          { label: '5. નિંદામણ (Weeding)', color: 'purple' },
          { label: '6. લણણી (Harvesting)', color: 'red' },
          { label: '7. સંગ્રહ (Storage)', color: 'pink' }
        ]
      },
      {
        title: 'Kharif vs Rabi Crops',
        type: 'table',
        headers: ['Feature', 'Kharif (ખરીફ)', 'Rabi (રવી)'],
        rows: [
          ['Season', 'Rainy (June-Oct)', 'Winter (Oct-March)'],
          ['Sowing', 'June-July', 'October-November'],
          ['Harvesting', 'Sept-Oct', 'March-April'],
          ['Examples', 'Paddy, Maize, Cotton', 'Wheat, Gram, Mustard'],
          ['ગુજરાતી ઉદાહરણ', 'ડાંગર, મકાઈ, કપાસ', 'ઘઉં, ચણા, રાઈ']
        ]
      }
    ],
    pdf: {
      title: 'પાક ઉત્પાદન - Complete Notes',
      sections: [
        { heading: 'ખેતી પ્રક્રિયાઓ (Agricultural Practices)', list: ['1. જમીન તૈયારી — Ploughing, Levelling, Manuring', '2. વાવણી — Seed Drill, Broadcasting', '3. ખાતર અને ઉર્વરક — Manure (organic), Fertilizer (chemical)', '4. સિંચાઈ — Sprinkler, Drip irrigation', '5. નિંદામણ — Weeds removal (manual/chemical)', '6. લણણી — Cutting, Threshing, Winnowing', '7. સંગ્રહ — Silos, Granaries'] },
        { heading: 'Manure vs Fertilizer', body: 'Manure (ખાતર): Organic, made from decomposed waste. Improves soil quality.\nFertilizer (ઉર્વરક): Chemical, factory-made. Provides specific nutrients (NPK).', note: 'Overuse of fertilizers degrades soil quality.' },
        { heading: 'Irrigation Methods', list: ['Traditional: Moat (pulleys), Chain pump, Dhekli, Rahat', 'Modern: Sprinkler system, Drip irrigation'] }
      ]
    },
    interactive: [
      {
        type: 'matching',
        title: 'Match the Crop with Season',
        pairs: [
          { a: 'Paddy (ડાંગર)', b: 'Kharif' },
          { a: 'Wheat (ઘઉં)', b: 'Rabi' },
          { a: 'Cotton (કપાસ)', b: 'Kharif' },
          { a: 'Mustard (રાઈ)', b: 'Rabi' }
        ]
      },
      {
        type: 'ordering',
        title: 'Agricultural Steps — Correct Order',
        items: [
          { text: 'Soil Preparation (જમીન તૈયારી)', order: 1 },
          { text: 'Sowing (વાવણી)', order: 2 },
          { text: 'Adding Manure/Fertilizer', order: 3 },
          { text: 'Irrigation (સિંચાઈ)', order: 4 },
          { text: 'Weeding (નિંદામણ)', order: 5 },
          { text: 'Harvesting (લણણી)', order: 6 },
          { text: 'Storage (સંગ્રહ)', order: 7 }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 9 — SCIENCE
     ============================================================ */
  '9-science-1': {
    videos: [
      { title: 'આપણી આસપાસના દ્રવ્યો', titleEn: 'Matter in Our Surroundings', id: 'S5SCO1rVGsY', duration: '25:00', views: '80K+' },
      { title: 'States of Matter - Animation', titleEn: 'Quick Revision', id: 'B0dcI3LrpPM', duration: '12:00', views: '50K+' }
    ],
    charts: [
      {
        title: 'States of Matter — Comparison',
        type: 'table',
        headers: ['Property', 'Solid (ઘન)', 'Liquid (પ્રવાહી)', 'Gas (વાયુ)'],
        rows: [
          ['Shape', 'Fixed (નિશ્ચિત)', 'No fixed shape', 'No fixed shape'],
          ['Volume', 'Fixed', 'Fixed', 'Not fixed'],
          ['Compressibility', 'Very low', 'Low', 'High'],
          ['Particle Distance', 'Very close', 'Close', 'Far apart'],
          ['Particle Energy', 'Least', 'Medium', 'Maximum'],
          ['Flow', 'Cannot flow', 'Flows', 'Flows in all directions'],
          ['Density', 'Highest', 'Medium', 'Lowest']
        ]
      },
      {
        title: 'Change of State',
        type: 'flowchart',
        steps: [
          { label: 'Solid (ઘન)', color: '' },
          { label: '→ Melting (ગલન) → Liquid', color: 'orange' },
          { label: '→ Boiling (ઉત્કલન) → Gas', color: 'red' },
          { label: 'Gas → Condensation → Liquid', color: 'teal' },
          { label: 'Liquid → Freezing → Solid', color: 'purple' },
          { label: 'Solid → Sublimation → Gas (directly)', color: 'green' }
        ]
      },
      {
        title: 'Important Temperatures',
        type: 'table',
        headers: ['Process', 'Temperature', 'Example'],
        rows: [
          ['Melting Point of Ice', '0°C (273K)', 'Ice → Water'],
          ['Boiling Point of Water', '100°C (373K)', 'Water → Steam'],
          ['Room Temperature', '25°C (298K)', 'Normal conditions'],
          ['Absolute Zero', '-273°C (0K)', 'Particles stop moving']
        ]
      }
    ],
    pdf: {
      title: 'દ્રવ્ય અને તેના ગુણધર્મો - Complete Notes',
      sections: [
        { heading: 'દ્રવ્ય શું છે? (What is Matter?)', body: 'જે વસ્તુ જગ્યા રોકે છે અને જેનું વજન છે તેને દ્રવ્ય (Matter) કહે છે. દ્રવ્ય નાના-નાના કણો (Particles) થી બનેલું છે.' },
        { heading: 'દ્રવ્યના ગુણધર્મો', list: ['કણો વચ્ચે ખાલી જગ્યા (Space between particles)', 'કણો સતત ગતિમાં છે (Kinetic energy)', 'કણો એકબીજાને આકર્ષે છે (Force of attraction)'] },
        { heading: 'States of Matter', body: 'Solid: Fixed shape + volume. Strong intermolecular forces.\nLiquid: No fixed shape, fixed volume. Medium forces.\nGas: No fixed shape/volume. Weakest forces.' },
        { heading: 'Change of State', list: ['Melting (ગલન): Solid → Liquid (heat absorption)', 'Boiling (ઉત્કલન): Liquid → Gas', 'Condensation (ઘનીકરણ): Gas → Liquid', 'Freezing (હિમીકરણ): Liquid → Solid', 'Sublimation (ઉર્ધ્વપાતન): Solid → Gas directly (Camphor, Dry ice)', 'Deposition: Gas → Solid directly'] },
        { heading: 'Latent Heat', body: 'State change માં temperature constant રહે છે. Heat energy bonds તોડવામાં/બનાવવામાં વપરાય છે.', formula: 'Latent Heat of Fusion (Ice) = 334 J/g\nLatent Heat of Vaporization (Water) = 2260 J/g', note: 'Latent = Hidden. Temperature change વગર heat absorb/release થાય છે.' },
        { heading: 'Evaporation', body: 'Evaporation surface phenomenon છે — boiling point કરતા ઓછા temperature પર થાય છે.', list: ['Surface area વધે → Evaporation વધે', 'Temperature વધે → Evaporation વધે', 'Humidity ઓછી → Evaporation વધે', 'Wind speed વધે → Evaporation વધે'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Matter',
        items: [
          { before: 'Solid ને ગરમ કરવાથી ', answer: 'liquid', after: ' બને છે.' },
          { before: 'પાણીનું Boiling point ', answer: '100', after: '°C છે.' },
          { before: 'Camphor નું સીધું Gas માં રૂપાંતર ', answer: 'sublimation', after: ' કહેવાય છે.' },
          { before: 'Absolute zero = ', answer: '-273', after: '°C' }
        ]
      },
      {
        type: 'matching',
        title: 'Match State Change with Process',
        pairs: [
          { a: 'Solid → Liquid', b: 'Melting' },
          { a: 'Liquid → Gas', b: 'Boiling' },
          { a: 'Gas → Liquid', b: 'Condensation' },
          { a: 'Solid → Gas', b: 'Sublimation' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — States of Matter',
        items: [
          { statement: 'Gas can be compressed easily.', answer: true },
          { statement: 'Liquids have fixed shape.', answer: false },
          { statement: 'Evaporation is a surface phenomenon.', answer: true },
          { statement: 'Melting point of ice is 100°C.', answer: false },
          { statement: 'Dry ice undergoes sublimation.', answer: true }
        ]
      },
      {
        type: 'ordering',
        title: 'Order: Least to Most Kinetic Energy',
        items: [
          { text: 'Solid (ઘન) - Least energy', order: 1 },
          { text: 'Liquid (પ્રવાહી) - Medium energy', order: 2 },
          { text: 'Gas (વાયુ) - Most energy', order: 3 }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 10 — SCIENCE
     ============================================================ */
  '10-science-1': {
    videos: [
      { title: 'રાસાયણિક પ્રક્રિયાઓ - Full Chapter', titleEn: 'Chemical Reactions & Equations - GSEB', id: 'ZeBmh4QFOm4', duration: '40:22', views: '36K+' },
      { title: 'Balancing Chemical Equations', titleEn: 'Step by Step Method', id: 'TUuABq95BBM', duration: '14:41', views: '4.8M+' },
      { title: 'Chemical Reactions - Easy Explanation', titleEn: 'Manocha Academy', id: 'm3vGE8YbERQ', duration: '50:16', views: '284K+' }
    ],
    charts: [
      {
        title: 'Types of Chemical Reactions',
        type: 'table',
        headers: ['Type', 'ગુજરાતી', 'General Form', 'Example'],
        rows: [
          ['Combination', 'સંયોજન', 'A + B → AB', '2Mg + O₂ → 2MgO'],
          ['Decomposition', 'વિઘટન', 'AB → A + B', '2H₂O → 2H₂ + O₂'],
          ['Displacement', 'વિસ્થાપન', 'A + BC → AC + B', 'Fe + CuSO₄ → FeSO₄ + Cu'],
          ['Double Displacement', 'દ્વિ-વિસ્થાપન', 'AB + CD → AD + CB', 'NaOH + HCl → NaCl + H₂O'],
          ['Oxidation', 'ઓક્સિડેશન', 'Gaining Oxygen', '2Cu + O₂ → 2CuO'],
          ['Reduction', 'રિડક્શન', 'Losing Oxygen', 'CuO + H₂ → Cu + H₂O']
        ]
      },
      {
        title: 'Reactivity Series',
        type: 'flowchart',
        steps: [
          { label: 'K > Na > Ca > Mg (Most Reactive)', color: 'red' },
          { label: 'Al > Zn > Fe > Ni (Medium)', color: 'orange' },
          { label: 'Sn > Pb > H (Reference)', color: '' },
          { label: 'Cu > Hg > Ag > Au (Least Reactive)', color: 'green' }
        ]
      },
      {
        title: 'Balancing Equations — Steps',
        type: 'flowchart',
        steps: [
          { label: '1. Write unbalanced equation', color: '' },
          { label: '2. Count atoms of each element', color: 'green' },
          { label: '3. Balance one element at a time', color: 'orange' },
          { label: '4. Start with element in least compounds', color: 'purple' },
          { label: '5. Check all atoms are balanced', color: 'teal' },
          { label: '6. Add state symbols (s, l, g, aq)', color: 'red' }
        ]
      }
    ],
    pdf: {
      title: 'રાસાયણિક પ્રક્રિયાઓ - Board Exam Notes',
      sections: [
        { heading: 'Chemical Reaction શું છે?', body: 'જ્યારે કોઈ પદાર્થ (Substance) માં રાસાયણિક ફેરફાર (Chemical Change) થાય ત્યારે તેને Chemical Reaction કહે છે. Reactants → Products' },
        { heading: 'Chemical Reaction ની ઓળખ', list: ['રંગ બદલાય (Change in color)', 'ગેસ બહાર આવે (Gas evolution)', 'તાપમાન બદલાય (Temperature change)', 'અવક્ષેપ બને (Precipitate formation)', 'ગંધ આવે (Change in smell)'] },
        { heading: 'Types of Reactions', list: ['Combination (સંયોજન): A + B → AB. Example: CaO + H₂O → Ca(OH)₂', 'Decomposition (વિઘટન): AB → A + B. Can be thermal, electrolytic, or photolytic', 'Displacement (વિસ્થાપન): More reactive element displaces less reactive', 'Double Displacement (દ્વિ-વિસ્થાપન): Exchange of ions between compounds', 'Redox: Oxidation (O₂ gain / H₂ loss) + Reduction (O₂ loss / H₂ gain)'] },
        { heading: 'Balancing Equations', body: 'Law of Conservation of Mass: Total mass of reactants = Total mass of products. Therefore atoms must be balanced on both sides.', formula: 'Fe + H₂O → Fe₃O₄ + H₂\nBalanced: 3Fe + 4H₂O → Fe₃O₄ + 4H₂' },
        { heading: 'Corrosion & Rancidity', body: 'Corrosion: Iron + O₂ + Water → Rust (Fe₂O₃·xH₂O). Prevention: painting, oiling, galvanization.\nRancidity: Fats + O₂ → bad smell. Prevention: antioxidants, nitrogen flushing, airtight packaging.', note: 'Board exam માં 2-3 marks નો confirmed question આવે છે.' },
        { heading: 'Important Equations for Board', list: ['2Mg + O₂ → 2MgO (Combination)', '2FeSO₄ → Fe₂O₃ + SO₂ + SO₃ (Thermal Decomposition)', '2AgCl → 2Ag + Cl₂ (Photolytic Decomposition)', 'Zn + H₂SO₄ → ZnSO₄ + H₂ (Displacement)', 'Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl (Double Displacement)'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Chemical Reactions',
        items: [
          { before: '2Mg + O₂ → 2', answer: 'MgO', after: '' },
          { before: 'Fe + CuSO₄ → FeSO₄ + ', answer: 'Cu', after: '' },
          { before: 'Iron ને કાટ લાગવો એ ', answer: 'corrosion', after: ' કહેવાય.' },
          { before: 'NaOH + HCl → NaCl + ', answer: 'H2O', after: '' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Reaction Type with Example',
        pairs: [
          { a: 'Combination', b: '2Mg + O₂ → 2MgO' },
          { a: 'Decomposition', b: '2H₂O → 2H₂ + O₂' },
          { a: 'Displacement', b: 'Fe + CuSO₄ → FeSO₄ + Cu' },
          { a: 'Double Displacement', b: 'NaOH + HCl → NaCl + H₂O' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Reactions',
        items: [
          { statement: 'Rusting of iron is a chemical change.', answer: true },
          { statement: 'In a combination reaction, 2 products form from 1 reactant.', answer: false },
          { statement: 'Oxidation means gaining oxygen.', answer: true },
          { statement: 'Gold rusts easily.', answer: false },
          { statement: 'Galvanization prevents rusting.', answer: true }
        ]
      },
      {
        type: 'ordering',
        title: 'Reactivity Series — Most to Least Reactive',
        items: [
          { text: 'Potassium (K)', order: 1 },
          { text: 'Sodium (Na)', order: 2 },
          { text: 'Aluminium (Al)', order: 3 },
          { text: 'Iron (Fe)', order: 4 },
          { text: 'Copper (Cu)', order: 5 },
          { text: 'Gold (Au)', order: 6 }
        ]
      }
    ]
  },

  '10-science-2': {
    videos: [
      { title: 'એસિડ, બેઝ અને ક્ષાર - Full', titleEn: 'Acids, Bases and Salts', id: 'Bv4rkDFhFqo', duration: '28:00', views: '100K+' },
      { title: 'pH Scale Explained', titleEn: 'Quick Revision', id: 'LS67E_NSQZ4', duration: '10:00', views: '55K+' }
    ],
    charts: [
      {
        title: 'pH Scale',
        type: 'table',
        headers: ['pH', 'Nature', 'Examples'],
        rows: [
          ['0-3', 'Strong Acid', 'HCl, H₂SO₄'],
          ['4-6', 'Weak Acid', 'Lemon juice, Vinegar'],
          ['7', 'Neutral', 'Pure Water'],
          ['8-10', 'Weak Base', 'Baking soda, Milk of Magnesia'],
          ['11-14', 'Strong Base', 'NaOH, KOH']
        ]
      },
      {
        title: 'Common Indicators',
        type: 'table',
        headers: ['Indicator', 'In Acid', 'In Base'],
        rows: [
          ['Litmus', 'Red', 'Blue'],
          ['Methyl Orange', 'Red/Pink', 'Yellow'],
          ['Phenolphthalein', 'Colorless', 'Pink'],
          ['Turmeric', 'Yellow', 'Red/Brown']
        ]
      },
      {
        title: 'Important Salts',
        type: 'diagram',
        items: [
          { icon: '🧂', label: 'NaCl', sublabel: 'Common Salt' },
          { icon: '🧪', label: 'NaHCO₃', sublabel: 'Baking Soda' },
          { icon: '🏠', label: 'Na₂CO₃', sublabel: 'Washing Soda' },
          { icon: '🏥', label: 'CaOCl₂', sublabel: 'Bleaching Powder' },
          { icon: '🏗️', label: 'CaSO₄·½H₂O', sublabel: 'Plaster of Paris' }
        ]
      }
    ],
    pdf: {
      title: 'એસિડ, બેઝ અને ક્ષાર - Board Notes',
      sections: [
        { heading: 'Acids (એસિડ)', body: 'Acids = H⁺ ions produce in water. Sour taste, turn blue litmus red.', list: ['HCl — Hydrochloric acid (પેટમાં)', 'H₂SO₄ — Sulphuric acid (Battery)', 'HNO₃ — Nitric acid', 'CH₃COOH — Acetic acid (Vinegar)'] },
        { heading: 'Bases (બેઝ)', body: 'Bases = OH⁻ ions produce in water. Bitter taste, soapy touch, turn red litmus blue.', list: ['NaOH — Sodium Hydroxide (Caustic Soda)', 'KOH — Potassium Hydroxide', 'Ca(OH)₂ — Calcium Hydroxide (Slaked Lime)', 'Mg(OH)₂ — Milk of Magnesia (Antacid)'] },
        { heading: 'Neutralization', formula: 'Acid + Base → Salt + Water\nHCl + NaOH → NaCl + H₂O', note: 'This is an exothermic reaction.' },
        { heading: 'pH Scale', body: 'pH = potential of Hydrogen. Range: 0-14.', highlight: 'pH < 7 = Acidic | pH = 7 = Neutral | pH > 7 = Basic' },
        { heading: 'Important Salts & Uses', list: ['NaCl (Common Salt): Cooking, preservation, raw material for NaOH, Cl₂', 'NaHCO₃ (Baking Soda): Baking, antacid, fire extinguisher', 'Na₂CO₃ (Washing Soda): Cleaning, glass manufacturing, water softening', 'CaOCl₂ (Bleaching Powder): Water treatment, disinfection', 'CaSO₄·½H₂O (Plaster of Paris): Fracture casts, moulds, toys'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Acids & Bases',
        items: [
          { before: 'pH of pure water is ', answer: '7', after: '' },
          { before: 'HCl + NaOH → NaCl + ', answer: 'H2O', after: '' },
          { before: 'Baking Soda formula: ', answer: 'NaHCO3', after: '' },
          { before: 'Acid turns blue litmus ', answer: 'red', after: '' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Chemical with Common Name',
        pairs: [
          { a: 'NaCl', b: 'Common Salt' },
          { a: 'NaHCO₃', b: 'Baking Soda' },
          { a: 'CaOCl₂', b: 'Bleaching Powder' },
          { a: 'CaSO₄·½H₂O', b: 'Plaster of Paris' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — pH Scale',
        items: [
          { statement: 'pH of lemon juice is greater than 7.', answer: false },
          { statement: 'NaOH is a strong base.', answer: true },
          { statement: 'Phenolphthalein turns pink in acid.', answer: false },
          { statement: 'Neutralization produces salt and water.', answer: true }
        ]
      }
    ]
  },

  '10-science-8': {
    videos: [
      { title: 'વિદ્યુત - Full Chapter', titleEn: 'Electricity', id: 'DOjCmWsyehY', duration: '35:00', views: '150K+' },
      { title: 'Ohm\'s Law - Explained', titleEn: 'V = IR', id: '8jB6hDUqN0Y', duration: '15:00', views: '80K+' }
    ],
    charts: [
      {
        title: 'Ohm\'s Law & Formulas',
        type: 'table',
        headers: ['Quantity', 'Symbol', 'Unit', 'Formula'],
        rows: [
          ['Voltage', 'V', 'Volt (V)', 'V = IR'],
          ['Current', 'I', 'Ampere (A)', 'I = V/R'],
          ['Resistance', 'R', 'Ohm (Ω)', 'R = V/I'],
          ['Power', 'P', 'Watt (W)', 'P = VI = I²R'],
          ['Energy', 'E', 'Joule (J)', 'E = Pt = VIt']
        ]
      },
      {
        title: 'Series vs Parallel Circuits',
        type: 'table',
        headers: ['Property', 'Series (શ્રેણી)', 'Parallel (સમાંતર)'],
        rows: [
          ['Current', 'Same (I₁=I₂=I)', 'Divided (I=I₁+I₂)'],
          ['Voltage', 'Divided (V=V₁+V₂)', 'Same (V₁=V₂=V)'],
          ['Resistance', 'R = R₁+R₂+R₃', '1/R = 1/R₁+1/R₂+1/R₃'],
          ['If one fails', 'All stop', 'Others continue'],
          ['Use', 'Decorative lights', 'Home wiring']
        ]
      }
    ],
    pdf: {
      title: 'વિદ્યુત - Board Exam Notes',
      sections: [
        { heading: 'Electric Current', body: 'Electric charge ના flow ને electric current કહે છે. Direction: positive to negative (conventional). Unit: Ampere (A).', formula: 'I = Q/t (Current = Charge/Time)' },
        { heading: 'Potential Difference', body: 'બે points વચ્ચે per unit charge ને move કરવા માટેનું work.', formula: 'V = W/Q (Voltage = Work/Charge)' },
        { heading: 'Ohm\'s Law', body: 'Temperature constant હોય ત્યારે, Conductor માંથી પસાર થતો Current, Potential Difference ના proportional હોય છે.', formula: 'V = IR\nV = Voltage (V), I = Current (A), R = Resistance (Ω)', highlight: 'Ohm\'s Law graph: V vs I → Straight line through origin' },
        { heading: 'Resistance', body: 'Conductor current flow ને oppose કરે છે. આ opposition ને Resistance કહે છે.', formula: 'R = ρL/A\nρ = Resistivity, L = Length, A = Cross-section area', list: ['Length વધે → R વધે', 'Area વધે → R ઘટે', 'Temperature વધે → R વધે (metals)'] },
        { heading: 'Power & Energy', formula: 'P = VI = I²R = V²/R (Watts)\nE = Pt = VIt (Joules)\n1 kWh = 3.6 × 10⁶ J', note: 'Electricity bill kWh (unit) માં measure થાય છે. 1 unit = 1000W × 1 hour.' }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Electricity',
        items: [
          { before: 'Ohm\'s Law: V = ', answer: 'IR', after: '' },
          { before: 'Unit of resistance is ', answer: 'ohm', after: '' },
          { before: 'Power formula: P = ', answer: 'VI', after: '' },
          { before: '1 kWh = ', answer: '3600000', after: ' Joules' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Quantity with Unit',
        pairs: [
          { a: 'Current', b: 'Ampere (A)' },
          { a: 'Voltage', b: 'Volt (V)' },
          { a: 'Resistance', b: 'Ohm (Ω)' },
          { a: 'Power', b: 'Watt (W)' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Circuits',
        items: [
          { statement: 'In series circuit, current is same everywhere.', answer: true },
          { statement: 'In parallel circuit, voltage is divided.', answer: false },
          { statement: 'If one bulb fails in series, all go off.', answer: true },
          { statement: 'Home appliances are connected in series.', answer: false },
          { statement: 'Resistance increases with length.', answer: true }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 10 — MATHS
     ============================================================ */
  '10-maths-1': {
    videos: [
      { title: 'વાસ્તવિક સંખ્યાઓ - Full Chapter', titleEn: 'Real Numbers', id: 'bUmAFO8U2DU', duration: '25:00', views: '90K+' },
      { title: 'Euclid\'s Division Lemma', titleEn: 'HCF by Division Method', id: 'AJn843kplDw', duration: '12:00', views: '50K+' }
    ],
    charts: [
      {
        title: 'Number System Classification',
        type: 'flowchart',
        steps: [
          { label: 'Real Numbers (વાસ્તવિક સંખ્યાઓ)', color: '' },
          { label: 'Rational (પરિમેય) | Irrational (અપરિમેય)', color: 'green' },
          { label: 'Integers (...-2,-1,0,1,2...)', color: 'purple' },
          { label: 'Whole Numbers (0,1,2,3...)', color: 'teal' },
          { label: 'Natural Numbers (1,2,3...)', color: 'orange' }
        ]
      },
      {
        title: 'Important Theorems',
        type: 'table',
        headers: ['Theorem', 'Statement'],
        rows: [
          ['Euclid\'s Division Lemma', 'a = bq + r, where 0 ≤ r < b'],
          ['Fundamental Theorem of Arithmetic', 'Every composite number = unique product of primes'],
          ['Irrational Number Proof', '√2, √3, √5 are irrational (proof by contradiction)']
        ]
      }
    ],
    pdf: {
      title: 'વાસ્તવિક સંખ્યાઓ - Board Notes',
      sections: [
        { heading: 'Euclid\'s Division Lemma', body: 'For any two positive integers a and b, there exist unique integers q and r such that:', formula: 'a = bq + r, where 0 ≤ r < b', body2: 'Application: Finding HCF of two numbers.' },
        { heading: 'HCF by Euclid\'s Method — Example', body: 'Find HCF of 455 and 42:\n455 = 42 × 10 + 35\n42 = 35 × 1 + 7\n35 = 7 × 5 + 0\nHCF = 7', highlight: 'Last non-zero remainder = HCF' },
        { heading: 'Fundamental Theorem of Arithmetic', body: 'Every composite number can be expressed as a product of primes in a unique way (except for order).', formula: '420 = 2 × 2 × 3 × 5 × 7 = 2² × 3 × 5 × 7' },
        { heading: 'Irrational Numbers', body: '√2, √3, √5 are irrational. Proof by contradiction method:', note: 'Assume √2 = p/q (rational), then show contradiction. Therefore √2 is irrational.' },
        { heading: 'Decimal Expansion', list: ['Terminating decimal: p/q where q = 2ⁿ × 5ᵐ (e.g., 1/8 = 0.125)', 'Non-terminating repeating: p/q where q ≠ 2ⁿ × 5ᵐ (e.g., 1/3 = 0.333...)', 'Non-terminating non-repeating: Irrational numbers (e.g., √2 = 1.41421356...)'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Real Numbers',
        items: [
          { before: 'Euclid\'s Lemma: a = bq + ', answer: 'r', after: '' },
          { before: 'HCF of 12 and 18 = ', answer: '6', after: '' },
          { before: 'LCM of 4 and 6 = ', answer: '12', after: '' },
          { before: '√2 is an ', answer: 'irrational', after: ' number.' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Real Numbers',
        items: [
          { statement: 'Every rational number is a real number.', answer: true },
          { statement: '√4 is irrational.', answer: false },
          { statement: 'HCF × LCM = Product of two numbers.', answer: true },
          { statement: '1/3 has a terminating decimal.', answer: false },
          { statement: 'π is a rational number.', answer: false }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 9 — MATHS
     ============================================================ */
  '9-maths-1': {
    videos: [
      { title: 'સંખ્યા પદ્ધતિ - Full Chapter', titleEn: 'Number Systems', id: 'MqBfAJojfMA', duration: '22:00', views: '70K+' }
    ],
    charts: [
      {
        title: 'Number Classification',
        type: 'diagram',
        items: [
          { icon: '🔢', label: 'Natural (N)', sublabel: '1, 2, 3, ...' },
          { icon: '0️⃣', label: 'Whole (W)', sublabel: '0, 1, 2, 3, ...' },
          { icon: '➖', label: 'Integer (Z)', sublabel: '..., -1, 0, 1, ...' },
          { icon: '📊', label: 'Rational (Q)', sublabel: 'p/q form' },
          { icon: '🌀', label: 'Irrational', sublabel: '√2, π' },
          { icon: '📐', label: 'Real (R)', sublabel: 'Q + Irrational' }
        ]
      }
    ],
    pdf: {
      title: 'સંખ્યા પદ્ધતિ - Study Notes',
      sections: [
        { heading: 'Number Types', list: ['Natural Numbers (N): 1, 2, 3, ... (counting numbers)', 'Whole Numbers (W): 0, 1, 2, 3, ... (N + 0)', 'Integers (Z): ..., -3, -2, -1, 0, 1, 2, 3, ...', 'Rational Numbers (Q): p/q form, q ≠ 0. Examples: 1/2, -3/4, 5', 'Irrational Numbers: Cannot be written as p/q. Examples: √2, √3, π', 'Real Numbers (R): All rational + irrational numbers'] },
        { heading: 'Representation on Number Line', body: 'Every real number has a unique point on the number line. We can represent √2 on number line using Pythagoras theorem.', formula: '√2 = hypotenuse of right triangle with sides 1, 1' },
        { heading: 'Laws of Exponents for Real Numbers', list: ['aᵐ × aⁿ = aᵐ⁺ⁿ', 'aᵐ / aⁿ = aᵐ⁻ⁿ', '(aᵐ)ⁿ = aᵐⁿ', 'a⁰ = 1', 'a⁻ⁿ = 1/aⁿ'] }
      ]
    },
    interactive: [
      {
        type: 'truefalse',
        title: 'True/False — Number Systems',
        items: [
          { statement: 'Every integer is a rational number.', answer: true },
          { statement: '√9 is irrational.', answer: false },
          { statement: 'π is a rational number.', answer: false },
          { statement: '0 is a natural number.', answer: false }
        ]
      },
      {
        type: 'matching',
        title: 'Match Number with Type',
        pairs: [
          { a: '√2', b: 'Irrational' },
          { a: '3/4', b: 'Rational' },
          { a: '-5', b: 'Integer' },
          { a: 'π', b: 'Irrational' }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 7 — MATHS
     ============================================================ */
  '7-maths-1': {
    videos: [
      { title: 'પૂર્ણાંકો - Full Chapter', titleEn: 'Integers', id: 'xo4BrFdEsVU', duration: '18:00', views: '35K+' }
    ],
    charts: [
      {
        title: 'Integer Operations Rules',
        type: 'table',
        headers: ['Operation', 'Same Signs', 'Different Signs'],
        rows: [
          ['Addition', 'Add, keep sign', 'Subtract, keep bigger\'s sign'],
          ['Subtraction', 'Add opposite', 'Add opposite'],
          ['Multiplication', 'Positive result', 'Negative result'],
          ['Division', 'Positive result', 'Negative result']
        ]
      }
    ],
    pdf: {
      title: 'પૂર્ણાંકો - Study Notes',
      sections: [
        { heading: 'Integer Rules', list: ['(+) × (+) = (+)', '(+) × (-) = (-)', '(-) × (+) = (-)', '(-) × (-) = (+)', 'Same rules apply for division'] },
        { heading: 'Properties', list: ['Closure: a + b, a × b always integers', 'Commutative: a + b = b + a, a × b = b × a', 'Associative: (a+b)+c = a+(b+c)', 'Distributive: a × (b+c) = ab + ac', 'Identity: 0 for addition, 1 for multiplication'] }
      ]
    },
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks — Integers',
        items: [
          { before: '(-3) × (-4) = ', answer: '12', after: '' },
          { before: '(-15) + 8 = ', answer: '-7', after: '' },
          { before: '(-20) ÷ 4 = ', answer: '-5', after: '' }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 8 — MATHS
     ============================================================ */
  '8-maths-1': {
    videos: [
      { title: 'પરિમેય સંખ્યાઓ - Full', titleEn: 'Rational Numbers', id: 'w75_0FVPxhM', duration: '20:00', views: '40K+' }
    ],
    charts: [
      {
        title: 'Properties of Rational Numbers',
        type: 'table',
        headers: ['Property', 'Addition', 'Multiplication'],
        rows: [
          ['Closure', 'Yes', 'Yes'],
          ['Commutative', 'Yes', 'Yes'],
          ['Associative', 'Yes', 'Yes'],
          ['Identity', '0', '1'],
          ['Inverse', '-a/b', 'b/a (reciprocal)'],
          ['Distributive', '—', 'a(b+c) = ab+ac']
        ]
      }
    ],
    pdf: {
      title: 'પરિમેય સંખ્યાઓ - Study Notes',
      sections: [
        { heading: 'Rational Numbers', body: 'A number of the form p/q where q ≠ 0 is called a rational number. Examples: 1/2, -3/4, 5/1, 0/1' },
        { heading: 'Between Two Rational Numbers', body: 'There are infinite rational numbers between any two rational numbers.', formula: 'Between 1/2 and 1/3: Mean = (1/2 + 1/3)/2 = 5/12' },
        { heading: 'Representation on Number Line', body: 'Rational numbers can be represented on a number line. Divide the unit length into equal parts based on denominator.' }
      ]
    },
    interactive: [
      {
        type: 'truefalse',
        title: 'True/False — Rational Numbers',
        items: [
          { statement: '0 is a rational number.', answer: true },
          { statement: 'There are finite rational numbers between 1 and 2.', answer: false },
          { statement: 'Every integer is a rational number.', answer: true },
          { statement: 'The reciprocal of 0 exists.', answer: false }
        ]
      }
    ]
  },

  /* ============================================================
     CLASS 10 — SOCIAL SCIENCE
     ============================================================ */
  '10-social-1': {
    videos: [
      { title: 'ભારતમાં રાષ્ટ્રવાદ - Full', titleEn: 'Rise of Nationalism in India', id: 'b3VjpLIhSWI', duration: '30:00', views: '95K+' }
    ],
    charts: [
      {
        title: 'Important Events & Movements',
        type: 'table',
        headers: ['Year', 'Event', 'Leader/Detail'],
        rows: [
          ['1905', 'Swadeshi Movement', 'Bengal Partition'],
          ['1919', 'Rowlatt Act', 'British oppression'],
          ['1919', 'Jallianwala Bagh', 'General Dyer massacre'],
          ['1920', 'Non-Cooperation', 'Mahatma Gandhi'],
          ['1930', 'Civil Disobedience', 'Dandi March (Salt March)'],
          ['1942', 'Quit India', '"Do or Die" - Gandhi'],
          ['1947', 'Independence', 'August 15, 1947']
        ]
      }
    ],
    pdf: {
      title: 'ભારતમાં રાષ્ટ્રવાદ - Board Notes',
      sections: [
        { heading: 'Non-Cooperation Movement (1920)', body: 'Mahatma Gandhi led the Non-Cooperation Movement against British rule. People boycotted foreign goods, returned titles, resigned from government posts.', list: ['Khilafat Movement combined with Non-Cooperation', 'Students left government schools/colleges', 'Lawyers boycotted courts', 'Foreign cloth burnt', 'Chauri Chaura incident (1922) → Gandhi called off movement'] },
        { heading: 'Civil Disobedience Movement (1930)', body: 'Started with the famous Dandi March (Salt March) on 12 March 1930. Gandhi walked 240 miles from Sabarmati to Dandi to break the salt law.', highlight: '"With this salt, I am shaking the foundations of the British Empire" — Mahatma Gandhi' },
        { heading: 'Quit India Movement (1942)', body: '"Do or Die" slogan given by Gandhi. Demanded immediate independence from British rule. Leaders were arrested but movement continued.' }
      ]
    },
    interactive: [
      {
        type: 'matching',
        title: 'Match Year with Event',
        pairs: [
          { a: '1919', b: 'Jallianwala Bagh' },
          { a: '1920', b: 'Non-Cooperation Movement' },
          { a: '1930', b: 'Dandi March' },
          { a: '1942', b: 'Quit India Movement' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True/False — Indian Nationalism',
        items: [
          { statement: 'Dandi March was in 1930.', answer: true },
          { statement: 'Quit India slogan was "Jai Hind".', answer: false },
          { statement: 'Gandhi called off Non-Cooperation after Chauri Chaura.', answer: true },
          { statement: 'India got independence in 1950.', answer: false }
        ]
      }
    ]
  }
};
