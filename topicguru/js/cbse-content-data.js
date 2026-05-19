/* ========================================================
   CBSE RICH CONTENT DATA — Videos, Charts, PDFs, Interactive
   Complete content for NCERT Classes 6-10
   ======================================================== */

const cbseRichContentData = {

  // ========== CLASS 10 SCIENCE ==========
  'cbse-10-science-1': {
    videos: [
      { title: 'Chemical Reactions & Equations - Full Chapter', titleEn: 'NCERT Class 10 Chemistry', id: 'eQf_EAYGo-k', duration: '45:12', views: '2.5M+' },
      { title: 'Balancing Chemical Equations', titleEn: 'Step by Step Method', id: 'TUuABq95BBM', duration: '14:41', views: '4.8M+' },
      { title: 'Types of Chemical Reactions', titleEn: 'With Examples', id: 'RLGW5RDSN6M', duration: '25:30', views: '1.2M+' }
    ],
    charts: [
      {
        title: 'Types of Chemical Reactions',
        type: 'table',
        headers: ['Type', 'Hindi', 'General Form', 'Example'],
        rows: [
          ['Combination', 'संयोजन', 'A + B → AB', '2Mg + O₂ → 2MgO'],
          ['Decomposition', 'अपघटन', 'AB → A + B', 'CaCO₃ → CaO + CO₂'],
          ['Displacement', 'विस्थापन', 'A + BC → AC + B', 'Fe + CuSO₄ → FeSO₄ + Cu'],
          ['Double Displacement', 'द्वि-विस्थापन', 'AB + CD → AD + CB', 'NaOH + HCl → NaCl + H₂O'],
          ['Redox', 'उपचयन-अपचयन', 'Oxidation + Reduction', 'CuO + H₂ → Cu + H₂O']
        ]
      },
      {
        title: 'Indicators of Chemical Reaction',
        type: 'flowchart',
        steps: ['Change in colour', 'Change in state', 'Change in temperature', 'Evolution of gas', 'Change in smell']
      }
    ],
    pdf: {
      title: 'Chemical Reactions & Equations - Board Exam Notes',
      sections: [
        { heading: 'Chemical Reaction क्या है?', body: 'जब किसी पदार्थ में रासायनिक परिवर्तन होता है तो उसे रासायनिक अभिक्रिया कहते हैं। इसमें नए पदार्थ बनते हैं जिनके गुण मूल पदार्थों से भिन्न होते हैं।' },
        { heading: 'रासायनिक समीकरण', body: 'किसी रासायनिक अभिक्रिया को संकेतों और सूत्रों द्वारा व्यक्त करना रासायनिक समीकरण कहलाता है।\nReactants → Products\nअभिकारक → उत्पाद' },
        { heading: 'समीकरण को संतुलित करना', list: ['दोनों ओर प्रत्येक तत्व के परमाणुओं की संख्या बराबर होनी चाहिए', 'Hit and Trial Method सबसे आसान तरीका है', 'पहले जटिल अणुओं को संतुलित करें'] },
        { heading: 'Important Formulas', formula: 'CaCO₃ →(heat) CaO + CO₂\n2Pb(NO₃)₂ →(heat) 2PbO + 4NO₂ + O₂\nZn + H₂SO₄ → ZnSO₄ + H₂↑' }
      ]
    },
    quiz: [
      { q: 'Which is an example of a decomposition reaction?', options: ['CaCO₃ → CaO + CO₂', '2Mg + O₂ → 2MgO', 'Fe + CuSO₄ → FeSO₄ + Cu', 'NaOH + HCl → NaCl + H₂O'], answer: 0 },
      { q: 'What type of reaction is: Fe + CuSO₄ → FeSO₄ + Cu?', options: ['Combination', 'Decomposition', 'Displacement', 'Double displacement'], answer: 2 },
      { q: 'Rusting of iron is an example of:', options: ['Combination reaction', 'Oxidation reaction', 'Displacement reaction', 'Decomposition reaction'], answer: 1 },
      { q: 'In a balanced equation, total mass of reactants equals:', options: ['Total mass of products', 'Double the products', 'Half the products', 'None of these'], answer: 0 },
      { q: 'Which gas is evolved when zinc reacts with dilute HCl?', options: ['Oxygen', 'Hydrogen', 'Nitrogen', 'Chlorine'], answer: 1 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Chemical Equations',
        items: [
          { text: 'CaCO₃ → CaO + ___', answer: 'CO₂' },
          { text: 'Fe + CuSO₄ → FeSO₄ + ___', answer: 'Cu' },
          { text: '2Mg + O₂ → ___', answer: '2MgO' },
          { text: 'Zn + H₂SO₄ → ZnSO₄ + ___↑', answer: 'H₂' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Reaction Types',
        left: ['Combination', 'Decomposition', 'Displacement', 'Redox'],
        right: ['AB → A + B', 'A + B → AB', 'A + BC → AC + B', 'Oxidation + Reduction']
      },
      {
        type: 'truefalse',
        title: 'True or False - Chemical Reactions',
        items: [
          { statement: 'Rusting is a chemical change', answer: true },
          { statement: 'Burning of candle is a physical change', answer: false },
          { statement: 'Photosynthesis is a decomposition reaction', answer: false },
          { statement: 'Respiration is an exothermic reaction', answer: true }
        ]
      }
    ]
  },

  'cbse-10-science-2': {
    videos: [
      { title: 'Acids, Bases and Salts - Full Chapter', titleEn: 'NCERT Class 10', id: 'uxHFsbjKmVg', duration: '52:15', views: '1.8M+' },
      { title: 'pH Scale Explained', titleEn: 'Understanding pH', id: 'LS67E9kR9O4', duration: '12:30', views: '800K+' },
      { title: 'Salts and their Properties', titleEn: 'Common Salts', id: 'DpnDYPFEFfU', duration: '18:45', views: '500K+' }
    ],
    charts: [
      {
        title: 'pH Scale',
        type: 'table',
        headers: ['pH', 'Nature', 'Example', 'Hindi'],
        rows: [
          ['0-3', 'Strong Acid', 'HCl, H₂SO₄', 'प्रबल अम्ल'],
          ['4-6', 'Weak Acid', 'Vinegar, Lemon', 'दुर्बल अम्ल'],
          ['7', 'Neutral', 'Pure Water', 'उदासीन'],
          ['8-10', 'Weak Base', 'Baking Soda', 'दुर्बल क्षार'],
          ['11-14', 'Strong Base', 'NaOH, KOH', 'प्रबल क्षार']
        ]
      },
      {
        title: 'Indicators and Colour Changes',
        type: 'table',
        headers: ['Indicator', 'In Acid', 'In Base', 'Neutral'],
        rows: [
          ['Litmus', 'Red', 'Blue', 'Purple'],
          ['Phenolphthalein', 'Colourless', 'Pink', 'Colourless'],
          ['Methyl Orange', 'Red', 'Yellow', 'Orange']
        ]
      }
    ],
    pdf: {
      title: 'Acids, Bases & Salts - Complete Notes',
      sections: [
        { heading: 'अम्ल (Acids)', body: 'अम्ल वे पदार्थ हैं जो जल में घुलकर H⁺ (hydrogen ions) देते हैं।\nExamples: HCl, H₂SO₄, HNO₃, CH₃COOH' },
        { heading: 'क्षार (Bases)', body: 'क्षार वे पदार्थ हैं जो जल में घुलकर OH⁻ (hydroxide ions) देते हैं।\nExamples: NaOH, KOH, Ca(OH)₂, Mg(OH)₂' },
        { heading: 'लवण (Salts)', body: 'अम्ल और क्षार की अभिक्रिया से लवण और जल बनता है।\nAcid + Base → Salt + Water\nHCl + NaOH → NaCl + H₂O' },
        { heading: 'Important Reactions', formula: 'NaOH + HCl → NaCl + H₂O (Neutralization)\n2NaOH + H₂SO₄ → Na₂SO₄ + 2H₂O\nNa₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑' }
      ]
    },
    quiz: [
      { q: 'pH of pure water is:', options: ['0', '7', '14', '1'], answer: 1 },
      { q: 'Which turns blue litmus red?', options: ['NaOH', 'KOH', 'HCl', 'NaCl'], answer: 2 },
      { q: 'Baking soda is:', options: ['NaHCO₃', 'Na₂CO₃', 'NaCl', 'CaCO₃'], answer: 0 },
      { q: 'Plaster of Paris formula is:', options: ['CaSO₄.½H₂O', 'CaSO₄.2H₂O', 'CaCO₃', 'Ca(OH)₂'], answer: 0 },
      { q: 'Acid + Base →', options: ['Salt + Water', 'Salt + Gas', 'Gas + Water', 'Only Salt'], answer: 0 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Reactions',
        items: [
          { text: 'NaOH + HCl → NaCl + ___', answer: 'H₂O' },
          { text: 'pH of lemon juice is approximately ___', answer: '2' },
          { text: 'Blue litmus turns ___ in acid', answer: 'red' },
          { text: 'Washing soda formula: Na₂CO₃.___H₂O', answer: '10' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Acids with Sources',
        left: ['Citric Acid', 'Acetic Acid', 'Lactic Acid', 'Tartaric Acid'],
        right: ['Vinegar', 'Lemon', 'Curd', 'Tamarind']
      }
    ]
  },

  'cbse-10-science-5': {
    videos: [
      { title: 'Life Processes - Full Chapter', titleEn: 'NCERT Class 10 Biology', id: 'uwiFsKCnfXg', duration: '55:00', views: '1.5M+' },
      { title: 'Human Digestive System', titleEn: 'Complete Explanation', id: 'nM5kMnEfaRQ', duration: '18:30', views: '3.2M+' },
      { title: 'Photosynthesis Explained', titleEn: 'In Hindi', id: 'hj_WKgnL6MI', duration: '15:45', views: '900K+' }
    ],
    charts: [
      {
        title: 'Human Digestive System',
        type: 'flowchart',
        steps: ['Mouth (Ingestion)', 'Oesophagus (Peristalsis)', 'Stomach (HCl + Pepsin)', 'Small Intestine (Absorption)', 'Large Intestine (Water absorption)', 'Anus (Egestion)']
      },
      {
        title: 'Types of Nutrition',
        type: 'table',
        headers: ['Type', 'Hindi', 'Organisms', 'Method'],
        rows: [
          ['Autotrophic', 'स्वपोषी', 'Green Plants', 'Photosynthesis'],
          ['Heterotrophic', 'परपोषी', 'Animals, Fungi', 'Ingestion/Absorption'],
          ['Saprophytic', 'मृतोपजीवी', 'Fungi, Bacteria', 'Dead organic matter'],
          ['Parasitic', 'परजीवी', 'Tapeworm, Cuscuta', 'Living host']
        ]
      }
    ],
    pdf: {
      title: 'Life Processes - Board Exam Notes',
      sections: [
        { heading: 'जीवन प्रक्रम', body: 'वे सभी प्रक्रियाएँ जो जीवों को जीवित रखने के लिए आवश्यक हैं, जीवन प्रक्रम कहलाती हैं।\nमुख्य जीवन प्रक्रम: पोषण, श्वसन, परिवहन, उत्सर्जन' },
        { heading: 'प्रकाश संश्लेषण (Photosynthesis)', body: '6CO₂ + 6H₂O →(सूर्य प्रकाश + क्लोरोफिल) C₆H₁₂O₆ + 6O₂\nCarbon dioxide + Water → Glucose + Oxygen' },
        { heading: 'मानव पाचन तंत्र', list: ['मुख गुहा - लार ग्रंथियाँ, amylase enzyme', 'अमाशय - HCl, Pepsin enzyme', 'छोटी आँत - पित्त रस, अग्न्याशय रस, अवशोषण', 'बड़ी आँत - जल का अवशोषण'] },
        { heading: 'श्वसन (Respiration)', formula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (ATP)\nAnaerobic: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + Energy' }
      ]
    },
    quiz: [
      { q: 'Photosynthesis takes place in:', options: ['Mitochondria', 'Chloroplast', 'Nucleus', 'Ribosome'], answer: 1 },
      { q: 'HCl is secreted in:', options: ['Mouth', 'Stomach', 'Small intestine', 'Large intestine'], answer: 1 },
      { q: 'End product of anaerobic respiration in yeast:', options: ['Lactic acid', 'Ethanol + CO₂', 'Water + CO₂', 'Glucose'], answer: 1 },
      { q: 'Which enzyme breaks starch?', options: ['Pepsin', 'Trypsin', 'Amylase', 'Lipase'], answer: 2 },
      { q: 'Excretory unit of kidney is:', options: ['Neuron', 'Nephron', 'Alveoli', 'Villi'], answer: 1 }
    ],
    interactive: [
      {
        type: 'ordering',
        title: 'Arrange the Digestive Process in Order',
        items: ['Ingestion in mouth', 'Breakdown by HCl in stomach', 'Digestion in small intestine', 'Absorption of nutrients', 'Water absorption in large intestine', 'Egestion'],
        correctOrder: [0, 1, 2, 3, 4, 5]
      },
      {
        type: 'truefalse',
        title: 'True or False - Life Processes',
        items: [
          { statement: 'Plants perform only photosynthesis, not respiration', answer: false },
          { statement: 'Villi increase surface area for absorption', answer: true },
          { statement: 'Arteries carry blood away from heart', answer: true },
          { statement: 'Stomata are present on roots', answer: false }
        ]
      }
    ]
  },

  'cbse-10-science-11': {
    videos: [
      { title: 'Electricity - Full Chapter', titleEn: 'NCERT Class 10 Physics', id: 'DON_z1Vu3is', duration: '48:30', views: '2.1M+' },
      { title: 'Ohm\'s Law Explained', titleEn: 'With Numericals', id: '8jB6hDUqN0Y', duration: '20:15', views: '1.5M+' },
      { title: 'Series and Parallel Circuits', titleEn: 'Complete Explanation', id: 'x2EuYqj_0Ww', duration: '22:00', views: '980K+' }
    ],
    charts: [
      {
        title: 'Comparison: Series vs Parallel',
        type: 'table',
        headers: ['Property', 'Series Circuit', 'Parallel Circuit'],
        rows: [
          ['Current (I)', 'Same through all', 'Divides among branches'],
          ['Voltage (V)', 'Divides among components', 'Same across all'],
          ['Resistance', 'R = R₁ + R₂ + R₃', '1/R = 1/R₁ + 1/R₂ + 1/R₃'],
          ['If one fails', 'All stop working', 'Others keep working'],
          ['Use', 'Decorative lights', 'House wiring']
        ]
      },
      {
        title: 'Important Formulas',
        type: 'table',
        headers: ['Formula', 'Quantity', 'Unit'],
        rows: [
          ['V = IR', 'Ohm\'s Law', 'V, A, Ω'],
          ['P = VI', 'Power', 'Watt (W)'],
          ['P = I²R', 'Power', 'Watt (W)'],
          ['P = V²/R', 'Power', 'Watt (W)'],
          ['H = I²Rt', 'Heat (Joule\'s Law)', 'Joule (J)'],
          ['E = Pt', 'Energy', 'kWh']
        ]
      }
    ],
    pdf: {
      title: 'Electricity - Complete Notes',
      sections: [
        { heading: 'Electric Current (विद्युत धारा)', body: 'I = Q/t\nCurrent = Charge/Time\nUnit: Ampere (A)\n1 A = 1 C/s' },
        { heading: 'Ohm\'s Law (ओम का नियम)', body: 'V = IR\nVoltage = Current × Resistance\nस्थिर ताप पर, किसी चालक में बहने वाली धारा उसके सिरों पर लगाए गए विभवांतर के समानुपाती होती है।' },
        { heading: 'Resistance (प्रतिरोध)', list: ['R = ρl/A', 'ρ = resistivity (प्रतिरोधकता)', 'l = length (लंबाई)', 'A = cross-section area (अनुप्रस्थ काट)'] },
        { heading: 'Electric Power', formula: 'P = VI = I²R = V²/R\n1 kWh = 3.6 × 10⁶ J\nElectric bill = kWh × rate per unit' }
      ]
    },
    quiz: [
      { q: 'SI unit of electric current is:', options: ['Volt', 'Ohm', 'Ampere', 'Watt'], answer: 2 },
      { q: 'Ohm\'s Law: V = ?', options: ['IR', 'I/R', 'R/I', 'I+R'], answer: 0 },
      { q: 'In parallel circuit, voltage is:', options: ['Different', 'Same', 'Zero', 'Doubled'], answer: 1 },
      { q: '1 kWh equals:', options: ['3600 J', '36000 J', '3.6 × 10⁶ J', '360 J'], answer: 2 },
      { q: 'Resistance of a conductor depends on:', options: ['Length', 'Area', 'Material', 'All of these'], answer: 3 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Formulas',
        items: [
          { text: 'V = I × ___', answer: 'R' },
          { text: 'Power P = V × ___', answer: 'I' },
          { text: 'Heat H = I² × R × ___', answer: 't' },
          { text: '1 kWh = ___ × 10⁶ Joules', answer: '3.6' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Quantities with Units',
        left: ['Current', 'Voltage', 'Resistance', 'Power'],
        right: ['Ohm (Ω)', 'Ampere (A)', 'Watt (W)', 'Volt (V)']
      }
    ]
  },

  // ========== CLASS 10 MATHS ==========
  'cbse-10-maths-1': {
    videos: [
      { title: 'Real Numbers - Full Chapter', titleEn: 'NCERT Class 10', id: 'qlJnhgV-fLQ', duration: '42:00', views: '1.8M+' },
      { title: 'Euclid\'s Division Lemma', titleEn: 'With Examples', id: 'nGbSaBFSfZ4', duration: '18:30', views: '900K+' },
      { title: 'Fundamental Theorem of Arithmetic', titleEn: 'HCF & LCM', id: 'XjRFLzOFaDs', duration: '20:15', views: '750K+' }
    ],
    charts: [
      {
        title: 'Number System Classification',
        type: 'flowchart',
        steps: ['Real Numbers (वास्तविक संख्याएँ)', '├── Rational (परिमेय) — p/q form', '│   ├── Integers (पूर्णांक)', '│   │   ├── Natural Numbers', '│   │   └── Whole Numbers', '│   └── Fractions', '└── Irrational (अपरिमेय) — √2, π']
      },
      {
        title: 'HCF & LCM Methods',
        type: 'table',
        headers: ['Method', 'Formula/Rule', 'Example'],
        rows: [
          ['Euclid\'s Division', 'a = bq + r, 0 ≤ r < b', 'HCF(455, 42)'],
          ['Prime Factorisation', 'Product of common primes', '12 = 2² × 3'],
          ['HCF × LCM', '= Product of numbers', 'HCF(12,18) × LCM(12,18) = 12×18']
        ]
      }
    ],
    pdf: {
      title: 'Real Numbers - Board Exam Notes',
      sections: [
        { heading: 'Euclid\'s Division Lemma', body: 'For any positive integers a and b:\na = bq + r, where 0 ≤ r < b\nUsed to find HCF of two positive integers.' },
        { heading: 'Fundamental Theorem of Arithmetic', body: 'Every composite number can be expressed as a product of primes in a unique way (apart from order).\nExample: 140 = 2² × 5 × 7' },
        { heading: 'Irrational Numbers', list: ['√2, √3, √5 are irrational', 'Sum/product of rational and irrational is irrational', 'π is irrational', 'Decimal expansion is non-terminating non-repeating'] },
        { heading: 'Important Results', formula: 'HCF(a,b) × LCM(a,b) = a × b\nTerminating decimal: denominator = 2ⁿ × 5ᵐ\nNon-terminating repeating: otherwise' }
      ]
    },
    quiz: [
      { q: 'HCF(12, 18) = ?', options: ['6', '36', '3', '12'], answer: 0 },
      { q: '√2 is:', options: ['Rational', 'Irrational', 'Integer', 'Whole number'], answer: 1 },
      { q: 'LCM(4, 6) = ?', options: ['12', '24', '2', '6'], answer: 0 },
      { q: 'Terminating decimal has denominator of form:', options: ['2ⁿ × 5ᵐ', '2ⁿ × 3ᵐ', '3ⁿ × 5ᵐ', 'Any form'], answer: 0 },
      { q: 'Euclid\'s Division Lemma: a = bq + r, condition on r:', options: ['r > b', '0 ≤ r < b', 'r = b', 'r < 0'], answer: 1 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Statements',
        items: [
          { text: 'HCF(12, 18) × LCM(12, 18) = 12 × ___', answer: '18' },
          { text: '√___ is the simplest irrational number', answer: '2' },
          { text: 'Prime factorisation of 140 = 2² × 5 × ___', answer: '7' },
          { text: 'In a = bq + r, the value of r satisfies 0 ≤ r < ___', answer: 'b' }
        ]
      },
      {
        type: 'truefalse',
        title: 'True or False - Real Numbers',
        items: [
          { statement: 'Every integer is a rational number', answer: true },
          { statement: '√4 is an irrational number', answer: false },
          { statement: 'Product of two irrational numbers is always irrational', answer: false },
          { statement: 'HCF of two prime numbers is always 1', answer: true }
        ]
      }
    ]
  },

  'cbse-10-maths-8': {
    videos: [
      { title: 'Introduction to Trigonometry - Full Chapter', titleEn: 'NCERT Class 10', id: 'PUB0TaZ7bhA', duration: '50:00', views: '2.3M+' },
      { title: 'Trigonometric Ratios', titleEn: 'Sin, Cos, Tan Explained', id: 'T9lt2CPphnc', duration: '22:15', views: '1.5M+' },
      { title: 'Trigonometric Identities', titleEn: 'With Proofs', id: 'DG4HdlMYfzY', duration: '18:30', views: '800K+' }
    ],
    charts: [
      {
        title: 'Trigonometric Ratios',
        type: 'table',
        headers: ['Ratio', 'Formula', 'Reciprocal'],
        rows: [
          ['sin θ', 'Opposite/Hypotenuse', 'cosec θ = 1/sin θ'],
          ['cos θ', 'Adjacent/Hypotenuse', 'sec θ = 1/cos θ'],
          ['tan θ', 'Opposite/Adjacent', 'cot θ = 1/tan θ']
        ]
      },
      {
        title: 'Standard Angle Values',
        type: 'table',
        headers: ['Angle', 'sin', 'cos', 'tan'],
        rows: [
          ['0°', '0', '1', '0'],
          ['30°', '1/2', '√3/2', '1/√3'],
          ['45°', '1/√2', '1/√2', '1'],
          ['60°', '√3/2', '1/2', '√3'],
          ['90°', '1', '0', 'undefined']
        ]
      }
    ],
    pdf: {
      title: 'Trigonometry - Complete Notes',
      sections: [
        { heading: 'त्रिकोणमितीय अनुपात', body: 'समकोण त्रिभुज में:\nsin θ = लंब/कर्ण = P/H\ncos θ = आधार/कर्ण = B/H\ntan θ = लंब/आधार = P/B' },
        { heading: 'Trigonometric Identities', formula: 'sin²θ + cos²θ = 1\n1 + tan²θ = sec²θ\n1 + cot²θ = cosec²θ' },
        { heading: 'Remember (SOH-CAH-TOA)', list: ['Sin = Opposite/Hypotenuse', 'Cos = Adjacent/Hypotenuse', 'Tan = Opposite/Adjacent'] },
        { heading: 'Complementary Angles', formula: 'sin(90° - θ) = cos θ\ncos(90° - θ) = sin θ\ntan(90° - θ) = cot θ' }
      ]
    },
    quiz: [
      { q: 'sin 30° = ?', options: ['1/2', '√3/2', '1', '0'], answer: 0 },
      { q: 'cos 0° = ?', options: ['0', '1', '1/2', 'undefined'], answer: 1 },
      { q: 'tan 45° = ?', options: ['0', '1', '√3', 'undefined'], answer: 1 },
      { q: 'sin²θ + cos²θ = ?', options: ['0', '1', '2', 'tan²θ'], answer: 1 },
      { q: 'sin(90° - θ) = ?', options: ['sin θ', 'cos θ', 'tan θ', '-sin θ'], answer: 1 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Values',
        items: [
          { text: 'sin 60° = √3/___', answer: '2' },
          { text: 'cos 45° = 1/√___', answer: '2' },
          { text: 'tan 30° = 1/√___', answer: '3' },
          { text: 'sin²30° + cos²30° = ___', answer: '1' }
        ]
      },
      {
        type: 'matching',
        title: 'Match the Values',
        left: ['sin 0°', 'cos 90°', 'tan 45°', 'sin 90°'],
        right: ['1', '0', '0', '1']
      }
    ]
  },

  // ========== CLASS 9 SCIENCE ==========
  'cbse-9-science-7': {
    videos: [
      { title: 'Motion - Full Chapter', titleEn: 'NCERT Class 9 Physics', id: 'bIFcaL3jOZY', duration: '45:00', views: '2.0M+' },
      { title: 'Equations of Motion Derivation', titleEn: 'All 3 Equations', id: 'VY7JACnDJHg', duration: '20:30', views: '1.2M+' },
      { title: 'Distance-Time and Velocity-Time Graphs', titleEn: 'Graph Analysis', id: 'Ym6D7OoJZ2U', duration: '15:45', views: '800K+' }
    ],
    charts: [
      {
        title: 'Equations of Motion',
        type: 'table',
        headers: ['Equation', 'Formula', 'Variables'],
        rows: [
          ['First', 'v = u + at', 'v=final vel, u=initial vel'],
          ['Second', 's = ut + ½at²', 's=displacement, t=time'],
          ['Third', 'v² = u² + 2as', 'a=acceleration']
        ]
      },
      {
        title: 'Types of Motion',
        type: 'table',
        headers: ['Type', 'Hindi', 'Speed', 'Example'],
        rows: [
          ['Uniform', 'एकसमान', 'Constant', 'Car at constant speed'],
          ['Non-uniform', 'असमान', 'Variable', 'Bus starting from stop'],
          ['Circular', 'वृत्तीय', 'Constant (direction changes)', 'Earth around Sun']
        ]
      }
    ],
    pdf: {
      title: 'Motion - Complete Notes',
      sections: [
        { heading: 'गति (Motion)', body: 'जब कोई वस्तु समय के साथ अपनी स्थिति बदलती है, तो कहते हैं कि वस्तु गति में है।\nDistance (दूरी): Scalar quantity\nDisplacement (विस्थापन): Vector quantity' },
        { heading: 'Speed & Velocity', body: 'Speed = Distance/Time (चाल = दूरी/समय)\nVelocity = Displacement/Time (वेग = विस्थापन/समय)\nAcceleration = (v-u)/t (त्वरण)' },
        { heading: 'Equations of Motion', formula: 'v = u + at\ns = ut + ½at²\nv² = u² + 2as\nv² - u² = 2as' },
        { heading: 'Uniform Circular Motion', body: 'When an object moves in a circular path with constant speed.\nSpeed is constant but velocity changes (direction changes).\nAcceleration is directed towards the centre (centripetal).' }
      ]
    },
    quiz: [
      { q: 'SI unit of velocity is:', options: ['m/s', 'km/h', 'm/s²', 'km/s'], answer: 0 },
      { q: 'v = u + at is the:', options: ['First equation', 'Second equation', 'Third equation', 'None'], answer: 0 },
      { q: 'Displacement is:', options: ['Scalar', 'Vector', 'Neither', 'Both'], answer: 1 },
      { q: 'If a body starts from rest, u = ?', options: ['0', '1', 'v', 'a'], answer: 0 },
      { q: 'Area under v-t graph gives:', options: ['Velocity', 'Acceleration', 'Displacement', 'Speed'], answer: 2 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Equations',
        items: [
          { text: 'v = u + a×___', answer: 't' },
          { text: 's = ut + ½×a×t___', answer: '²' },
          { text: 'Acceleration = (v - u)/___', answer: 't' },
          { text: 'Speed = Distance/___', answer: 'Time' }
        ]
      },
      {
        type: 'ordering',
        title: 'Arrange from Slowest to Fastest',
        items: ['Walking (5 km/h)', 'Cycling (15 km/h)', 'Car (60 km/h)', 'Train (120 km/h)', 'Airplane (800 km/h)', 'Light (3×10⁸ m/s)'],
        correctOrder: [0, 1, 2, 3, 4, 5]
      }
    ]
  },

  'cbse-9-science-1': {
    videos: [
      { title: 'Matter in Our Surroundings - Full Chapter', titleEn: 'Class 9 Chemistry', id: 'KosmOWV0yss', duration: '38:00', views: '1.5M+' },
      { title: 'States of Matter', titleEn: 'Solid, Liquid, Gas', id: 'pKvo0XWZtjo', duration: '15:20', views: '900K+' },
      { title: 'Change of State', titleEn: 'Melting, Boiling, Evaporation', id: 'aQMdkvKs1mA', duration: '12:45', views: '600K+' }
    ],
    charts: [
      {
        title: 'Properties of States of Matter',
        type: 'table',
        headers: ['Property', 'Solid (ठोस)', 'Liquid (द्रव)', 'Gas (गैस)'],
        rows: [
          ['Shape', 'Fixed', 'Not fixed', 'Not fixed'],
          ['Volume', 'Fixed', 'Fixed', 'Not fixed'],
          ['Compressibility', 'Very low', 'Low', 'High'],
          ['Density', 'High', 'Medium', 'Low'],
          ['Particle Distance', 'Very close', 'Close', 'Far apart']
        ]
      },
      {
        title: 'Change of State',
        type: 'flowchart',
        steps: ['Solid →(Melting)→ Liquid', 'Liquid →(Evaporation/Boiling)→ Gas', 'Gas →(Condensation)→ Liquid', 'Liquid →(Freezing)→ Solid', 'Solid →(Sublimation)→ Gas']
      }
    ],
    pdf: {
      title: 'Matter in Our Surroundings - Notes',
      sections: [
        { heading: 'पदार्थ (Matter)', body: 'कुछ भी जो स्थान घेरता हो और जिसमें द्रव्यमान हो, पदार्थ कहलाता है।\nMatter is made up of particles.\nParticles have spaces between them.' },
        { heading: 'States of Matter', list: ['Solid: कण बहुत पास-पास, fixed shape & volume', 'Liquid: कण थोड़े दूर, fixed volume but no fixed shape', 'Gas: कण बहुत दूर, no fixed shape or volume'] },
        { heading: 'Change of State', body: 'Melting Point (गलनांक): Solid → Liquid\nBoiling Point (क्वथनांक): Liquid → Gas\nSublimation (ऊर्ध्वपातन): Solid → Gas directly' },
        { heading: 'Important Terms', formula: 'Latent Heat of Fusion = 334 J/g (ice)\nLatent Heat of Vaporization = 2260 J/g (water)\nBoiling Point of Water = 100°C = 373 K' }
      ]
    },
    quiz: [
      { q: 'Which has fixed shape and volume?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], answer: 0 },
      { q: 'Sublimation is:', options: ['Solid to liquid', 'Liquid to gas', 'Solid to gas', 'Gas to solid'], answer: 2 },
      { q: 'Boiling point of water in Kelvin:', options: ['100 K', '273 K', '373 K', '0 K'], answer: 2 },
      { q: 'Which state is most compressible?', options: ['Solid', 'Liquid', 'Gas', 'All equal'], answer: 2 },
      { q: 'Dry ice is an example of:', options: ['Melting', 'Evaporation', 'Sublimation', 'Condensation'], answer: 2 }
    ],
    interactive: [
      {
        type: 'matching',
        title: 'Match State Changes',
        left: ['Melting', 'Evaporation', 'Condensation', 'Sublimation'],
        right: ['Solid→Gas', 'Gas→Liquid', 'Solid→Liquid', 'Liquid→Gas']
      },
      {
        type: 'truefalse',
        title: 'True or False - Matter',
        items: [
          { statement: 'Gases can be compressed easily', answer: true },
          { statement: 'Liquids have a fixed shape', answer: false },
          { statement: 'Temperature does not affect state of matter', answer: false },
          { statement: 'Particles of matter are always in motion', answer: true }
        ]
      }
    ]
  },

  // ========== CLASS 9 MATHS ==========
  'cbse-9-maths-1': {
    videos: [
      { title: 'Number Systems - Full Chapter', titleEn: 'Class 9 NCERT', id: 'I2f3bFJhric', duration: '40:00', views: '1.5M+' },
      { title: 'Irrational Numbers on Number Line', titleEn: 'Representation', id: 'eSf6FswriD4', duration: '15:30', views: '700K+' },
      { title: 'Laws of Exponents for Real Numbers', titleEn: 'With Examples', id: 'TTp8Kk4PUxM', duration: '18:00', views: '500K+' }
    ],
    charts: [
      {
        title: 'Classification of Numbers',
        type: 'flowchart',
        steps: ['Real Numbers (R)', '├── Rational (Q) — p/q, q≠0', '│   ├── Integers (Z) — ...,-2,-1,0,1,2,...', '│   │   ├── Whole (W) — 0,1,2,3,...', '│   │   │   └── Natural (N) — 1,2,3,...', '│   └── Fractions — 1/2, 3/4', '└── Irrational — √2, √3, π, e']
      },
      {
        title: 'Laws of Exponents',
        type: 'table',
        headers: ['Law', 'Formula', 'Example'],
        rows: [
          ['Product', 'aᵐ × aⁿ = aᵐ⁺ⁿ', '2³ × 2² = 2⁵ = 32'],
          ['Quotient', 'aᵐ/aⁿ = aᵐ⁻ⁿ', '3⁵/3² = 3³ = 27'],
          ['Power of Power', '(aᵐ)ⁿ = aᵐⁿ', '(2²)³ = 2⁶ = 64'],
          ['Zero Exponent', 'a⁰ = 1', '5⁰ = 1'],
          ['Negative', 'a⁻ⁿ = 1/aⁿ', '2⁻³ = 1/8']
        ]
      }
    ],
    pdf: {
      title: 'Number Systems - Notes',
      sections: [
        { heading: 'Rational Numbers (परिमेय संख्याएँ)', body: 'p/q form where q ≠ 0, p and q are integers.\nDecimal: Either terminating or repeating.\nExamples: 1/2 = 0.5, 1/3 = 0.333...' },
        { heading: 'Irrational Numbers (अपरिमेय)', body: 'Cannot be written as p/q.\nDecimal: Non-terminating, non-repeating.\nExamples: √2 = 1.41421356..., π = 3.14159...' },
        { heading: 'Representing on Number Line', list: ['Successive magnification method', 'For √2: draw unit square, diagonal = √2', 'For √3: use √2 as base, construct'] },
        { heading: 'Rationalisation', formula: '1/(a+√b) × (a-√b)/(a-√b) = (a-√b)/(a²-b)\n1/√2 = √2/2\n1/(√3+√2) = √3-√2' }
      ]
    },
    quiz: [
      { q: '√2 is:', options: ['Rational', 'Irrational', 'Integer', 'Natural'], answer: 1 },
      { q: 'Between any two rationals, there exist:', options: ['No rationals', 'Finite rationals', 'Infinite rationals', 'Only one rational'], answer: 2 },
      { q: '0 is:', options: ['Natural number', 'Whole number', 'Irrational', 'Negative'], answer: 1 },
      { q: 'Rationalising factor of √5 is:', options: ['√5', '5', '1/√5', '√5/5'], answer: 0 },
      { q: '(√2)² = ?', options: ['√2', '2', '4', '2√2'], answer: 1 }
    ],
    interactive: [
      {
        type: 'truefalse',
        title: 'True or False - Numbers',
        items: [
          { statement: 'Every natural number is a whole number', answer: true },
          { statement: '0 is a natural number', answer: false },
          { statement: 'π is a rational number', answer: false },
          { statement: 'Sum of two rationals is always rational', answer: true }
        ]
      },
      {
        type: 'fillblank',
        title: 'Fill in the Blanks',
        items: [
          { text: '√2 × √2 = ___', answer: '2' },
          { text: 'Every integer is a ___ number', answer: 'rational' },
          { text: 'Decimal expansion of 1/3 = 0.___', answer: '333...' },
          { text: 'a⁰ = ___ (for any non-zero a)', answer: '1' }
        ]
      }
    ]
  },

  // ========== CLASS 10 SOCIAL SCIENCE ==========
  'cbse-10-social-2': {
    videos: [
      { title: 'Nationalism in India - Full Chapter', titleEn: 'Class 10 History', id: 'DF5sY1Oxi5k', duration: '50:00', views: '1.8M+' },
      { title: 'Non-Cooperation Movement', titleEn: 'Gandhiji\'s Role', id: 'RcPTgV6wO30', duration: '22:15', views: '900K+' },
      { title: 'Civil Disobedience Movement', titleEn: 'Salt March & Beyond', id: 'dUXZ2m7oRvQ', duration: '18:30', views: '700K+' }
    ],
    charts: [
      {
        title: 'Timeline of Indian National Movement',
        type: 'table',
        headers: ['Year', 'Event', 'Leader', 'Hindi'],
        rows: [
          ['1919', 'Rowlatt Act / Jallianwala Bagh', 'General Dyer', 'रॉलेट एक्ट'],
          ['1920', 'Non-Cooperation Movement', 'Mahatma Gandhi', 'असहयोग आंदोलन'],
          ['1922', 'Chauri Chaura - Movement called off', 'Gandhi', 'चौरी चौरा कांड'],
          ['1930', 'Civil Disobedience / Dandi March', 'Gandhi', 'सविनय अवज्ञा / दांडी मार्च'],
          ['1930', 'Simon Commission Boycott', 'Lala Lajpat Rai', 'साइमन कमीशन'],
          ['1942', 'Quit India Movement', 'Gandhi', 'भारत छोड़ो आंदोलन']
        ]
      }
    ],
    pdf: {
      title: 'Nationalism in India - Notes',
      sections: [
        { heading: 'असहयोग आंदोलन (1920)', body: 'कारण: रॉलेट एक्ट, जलियाँवाला बाग, खिलाफत मुद्दा\nतरीके: विदेशी वस्त्रों का बहिष्कार, स्कूल-कॉलेज छोड़ना, सरकारी उपाधियाँ वापस करना\nसमाप्ति: चौरी चौरा कांड (1922) के बाद गांधीजी ने वापस लिया' },
        { heading: 'सविनय अवज्ञा आंदोलन (1930)', body: 'दांडी मार्च: 12 मार्च 1930, साबरमती से दांडी तक 240 मील\nनमक कानून तोड़ा\nविदेशी वस्तुओं का बहिष्कार, कर न देना' },
        { heading: 'भारत छोड़ो आंदोलन (1942)', body: 'नारा: "करो या मरो" (Do or Die)\n8 अगस्त 1942 को शुरू\nसभी बड़े नेता गिरफ्तार' }
      ]
    },
    quiz: [
      { q: 'Dandi March was in which year?', options: ['1920', '1930', '1942', '1919'], answer: 1 },
      { q: 'Non-Cooperation was called off due to:', options: ['Chauri Chaura', 'World War', 'Simon Commission', 'Rowlatt Act'], answer: 0 },
      { q: '"Do or Die" slogan was for:', options: ['Non-Cooperation', 'Civil Disobedience', 'Quit India', 'Khilafat'], answer: 2 },
      { q: 'Jallianwala Bagh massacre year:', options: ['1919', '1920', '1930', '1942'], answer: 0 },
      { q: 'Salt March distance:', options: ['240 miles', '100 km', '500 miles', '24 km'], answer: 0 }
    ],
    interactive: [
      {
        type: 'ordering',
        title: 'Arrange Events Chronologically',
        items: ['Rowlatt Act (1919)', 'Non-Cooperation Movement (1920)', 'Chauri Chaura (1922)', 'Dandi March (1930)', 'Quit India Movement (1942)', 'Independence (1947)'],
        correctOrder: [0, 1, 2, 3, 4, 5]
      },
      {
        type: 'matching',
        title: 'Match Events with Leaders',
        left: ['Dandi March', 'Simon Commission', 'Chauri Chaura', 'Quit India'],
        right: ['Called off by Gandhi', 'Lala Lajpat Rai protest', 'Mahatma Gandhi (Salt)', 'Do or Die (Gandhi)']
      }
    ]
  },

  // ========== CLASS 10 ENGLISH ==========
  'cbse-10-english-1': {
    videos: [
      { title: 'A Letter to God - Full Explanation', titleEn: 'First Flight Class 10', id: 'SqYCMnxYEbo', duration: '25:00', views: '1.2M+' },
      { title: 'A Letter to God - Summary in Hindi', titleEn: 'Easy Understanding', id: 'PLd0pMU9JGs', duration: '12:30', views: '800K+' }
    ],
    charts: [
      {
        title: 'Character Analysis',
        type: 'table',
        headers: ['Character', 'Trait', 'Role in Story'],
        rows: [
          ['Lencho', 'Simple, faithful farmer', 'Protagonist - writes letter to God'],
          ['Postmaster', 'Kind, helpful', 'Collects money for Lencho'],
          ['Post office staff', 'Generous', 'Contribute money'],
          ['God (in Lencho\'s mind)', 'All-powerful', 'Expected to send money']
        ]
      }
    ],
    pdf: {
      title: 'A Letter to God - Complete Notes',
      sections: [
        { heading: 'Summary', body: 'Lencho is a poor farmer whose crops are destroyed by hailstorm. He has immense faith in God and writes a letter asking for 100 pesos. The postmaster is moved and collects 70 pesos from staff. Lencho receives the money but thinks God sent 100 and the post office people stole 30 pesos.' },
        { heading: 'Theme', body: 'The story highlights the theme of unshakeable faith and irony. Lencho\'s faith is so strong that even when humans help him, he doesn\'t trust them but trusts God blindly.' },
        { heading: 'Important Questions', list: ['What made Lencho angry? — He received only 70 pesos instead of 100', 'What was the postmaster\'s reaction? — He decided to help Lencho to maintain his faith', 'What is the irony in the story? — Lencho calls the helpful post office staff "a bunch of crooks"'] }
      ]
    },
    quiz: [
      { q: 'Lencho asked God for how much money?', options: ['50 pesos', '70 pesos', '100 pesos', '200 pesos'], answer: 2 },
      { q: 'What destroyed Lencho\'s crops?', options: ['Flood', 'Drought', 'Hailstorm', 'Fire'], answer: 2 },
      { q: 'How much money did postmaster collect?', options: ['100 pesos', '70 pesos', '50 pesos', '30 pesos'], answer: 1 },
      { q: 'Lencho called post office staff:', options: ['Angels', 'Friends', 'Bunch of crooks', 'Helpers'], answer: 2 }
    ],
    interactive: [
      {
        type: 'ordering',
        title: 'Arrange Story Events in Order',
        items: ['Lencho expects good harvest', 'Hailstorm destroys crops', 'Lencho writes letter to God', 'Postmaster reads the letter', 'Staff collects 70 pesos', 'Lencho calls staff "crooks"'],
        correctOrder: [0, 1, 2, 3, 4, 5]
      },
      {
        type: 'truefalse',
        title: 'True or False',
        items: [
          { statement: 'Lencho lived in a city', answer: false },
          { statement: 'The postmaster was moved by Lencho\'s faith', answer: true },
          { statement: 'Lencho received exactly 100 pesos', answer: false },
          { statement: 'Lencho was grateful to the post office staff', answer: false }
        ]
      }
    ]
  },

  // ========== CLASS 10 HINDI ==========
  'cbse-10-hindi-6': {
    videos: [
      { title: 'नेताजी का चश्मा - Full Explanation', titleEn: 'Kshitij Class 10', id: 'YxPNdjKvX5s', duration: '30:00', views: '500K+' },
      { title: 'नेताजी का चश्मा - Summary', titleEn: 'Easy Hindi', id: 'q3Lzu5kBfDo', duration: '15:00', views: '300K+' }
    ],
    charts: [
      {
        title: 'पात्र परिचय',
        type: 'table',
        headers: ['पात्र', 'भूमिका', 'विशेषता'],
        rows: [
          ['कैप्टन चश्मेवाला', 'चश्मे बेचने वाला', 'देशभक्त, नेताजी की मूर्ति पर चश्मा लगाता'],
          ['हालदार साहब', 'कथावाचक', 'हर पखवाड़े कस्बे से गुजरता'],
          ['मूर्तिकार', 'नेताजी की मूर्ति बनाने वाला', 'चश्मा बनाना भूल गया'],
          ['पानवाला', 'दुकानदार', 'कैप्टन के बारे में बताता है']
        ]
      }
    ],
    pdf: {
      title: 'नेताजी का चश्मा - पूर्ण नोट्स',
      sections: [
        { heading: 'सारांश', body: 'एक छोटे कस्बे में नेताजी सुभाषचंद्र बोस की मूर्ति लगी है, लेकिन मूर्तिकार ने चश्मा संगमरमर का नहीं बनाया। कैप्टन नाम का एक चश्मे वाला बार-बार मूर्ति पर असली चश्मा लगाता है। जब भी चश्मा टूटता या गायब होता, वह नया लगा देता।' },
        { heading: 'संदेश', body: 'कहानी देशभक्ति और राष्ट्रीय सम्मान का संदेश देती है। कैप्टन जैसे साधारण लोग भी अपने तरीके से देश के प्रति सम्मान प्रकट करते हैं।' },
        { heading: 'महत्वपूर्ण प्रश्न', list: ['कैप्टन कौन था? - एक गरीब चश्मे वाला जो देशभक्त था', 'मूर्ति पर चश्मा क्यों बदलता रहता था? - कैप्टन बार-बार नया चश्मा लगाता था', 'कहानी का संदेश क्या है? - देशभक्ति किसी भी रूप में हो सकती है'] }
      ]
    },
    quiz: [
      { q: 'मूर्ति किसकी थी?', options: ['गांधीजी', 'नेताजी सुभाषचंद्र बोस', 'भगत सिंह', 'नेहरू'], answer: 1 },
      { q: 'कैप्टन क्या बेचता था?', options: ['फूल', 'चश्मे', 'किताबें', 'पान'], answer: 1 },
      { q: 'हालदार साहब कितने दिनों में कस्बे से गुजरते थे?', options: ['हर दिन', 'हर हफ्ते', 'हर पखवाड़े', 'हर महीने'], answer: 2 },
      { q: 'मूर्तिकार ने क्या नहीं बनाया?', options: ['नाक', 'कान', 'चश्मा', 'टोपी'], answer: 2 }
    ],
    interactive: [
      {
        type: 'truefalse',
        title: 'सही या गलत',
        items: [
          { statement: 'कैप्टन एक अमीर आदमी था', answer: false },
          { statement: 'मूर्ति पर हमेशा एक ही चश्मा रहता था', answer: false },
          { statement: 'कहानी देशभक्ति पर आधारित है', answer: true },
          { statement: 'हालदार साहब रोज़ कस्बे में रहते थे', answer: false }
        ]
      }
    ]
  },

  // ========== CLASS 8 SCIENCE ==========
  'cbse-8-science-8': {
    videos: [
      { title: 'Force and Pressure - Full Chapter', titleEn: 'Class 8 NCERT', id: 'y7yBjnxtZ2U', duration: '35:00', views: '1.2M+' },
      { title: 'Types of Forces Explained', titleEn: 'Contact & Non-contact', id: 'Ax3NvjqGkig', duration: '15:30', views: '700K+' },
      { title: 'Pressure in Fluids', titleEn: 'Atmospheric Pressure', id: 'cfSGfUgzRGg', duration: '12:00', views: '400K+' }
    ],
    charts: [
      {
        title: 'Types of Forces',
        type: 'table',
        headers: ['Type', 'Hindi', 'Examples'],
        rows: [
          ['Muscular Force', 'पेशीय बल', 'Pushing, pulling, lifting'],
          ['Friction', 'घर्षण बल', 'Walking, brakes'],
          ['Gravitational', 'गुरुत्वाकर्षण बल', 'Falling objects, weight'],
          ['Magnetic', 'चुम्बकीय बल', 'Compass, magnets'],
          ['Electrostatic', 'स्थिरवैद्युत बल', 'Rubbed comb attracts paper']
        ]
      },
      {
        title: 'Pressure Formula',
        type: 'table',
        headers: ['Concept', 'Formula', 'Unit'],
        rows: [
          ['Pressure', 'P = F/A', 'Pascal (Pa) = N/m²'],
          ['Force', 'F = m × a', 'Newton (N)'],
          ['Atmospheric Pressure', '1 atm = 101325 Pa', 'Pa or atm']
        ]
      }
    ],
    pdf: {
      title: 'Force and Pressure - Notes',
      sections: [
        { heading: 'बल (Force)', body: 'बल वह भौतिक कारण है जो किसी वस्तु की स्थिति, आकार या गति में परिवर्तन ला सकता है।\nContact forces: push, pull, friction\nNon-contact: gravity, magnetic, electrostatic' },
        { heading: 'दाब (Pressure)', body: 'P = Force/Area = F/A\nUnit: Pascal (Pa) = N/m²\nकम क्षेत्रफल पर अधिक दाब होता है (needle vs flat surface)' },
        { heading: 'वायुमंडलीय दाब', body: 'पृथ्वी के चारों ओर वायु का आवरण = वायुमंडल\nAtmospheric pressure = 1.013 × 10⁵ Pa\nHeight बढ़ने पर pressure कम होता है' }
      ]
    },
    quiz: [
      { q: 'Pressure = ?', options: ['F × A', 'F/A', 'A/F', 'F + A'], answer: 1 },
      { q: 'SI unit of pressure:', options: ['Newton', 'Pascal', 'Joule', 'Watt'], answer: 1 },
      { q: 'Gravity is a:', options: ['Contact force', 'Non-contact force', 'Muscular force', 'Frictional force'], answer: 1 },
      { q: 'Sharp knife cuts better because:', options: ['More force', 'Less area, more pressure', 'More area', 'Less pressure'], answer: 1 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Complete the Statements',
        items: [
          { text: 'Pressure = Force / ___', answer: 'Area' },
          { text: 'SI unit of force is ___', answer: 'Newton' },
          { text: 'Gravity is a ___ force', answer: 'non-contact' },
          { text: '1 Pascal = 1 N/___', answer: 'm²' }
        ]
      },
      {
        type: 'matching',
        title: 'Match Forces with Types',
        left: ['Friction', 'Gravity', 'Magnetic', 'Muscular'],
        right: ['Contact force', 'Contact force', 'Non-contact', 'Non-contact']
      }
    ]
  },

  // ========== CLASS 7 SCIENCE ==========
  'cbse-7-science-4': {
    videos: [
      { title: 'Acids, Bases and Salts - Class 7', titleEn: 'NCERT Science', id: 'oa3EoZxWbHI', duration: '28:00', views: '800K+' },
      { title: 'Indicators - Litmus, Turmeric', titleEn: 'Natural Indicators', id: 'fJFBHvmIRYI', duration: '12:30', views: '400K+' }
    ],
    charts: [
      {
        title: 'Natural Indicators',
        type: 'table',
        headers: ['Indicator', 'In Acid', 'In Base', 'Neutral'],
        rows: [
          ['Litmus Paper', 'Blue→Red', 'Red→Blue', 'No change'],
          ['Turmeric', 'Yellow', 'Brown/Red', 'Yellow'],
          ['China Rose', 'Dark Pink', 'Green', 'Light Pink']
        ]
      },
      {
        title: 'Common Acids & Bases',
        type: 'table',
        headers: ['Substance', 'Type', 'Found In'],
        rows: [
          ['Hydrochloric acid', 'Acid', 'Stomach'],
          ['Acetic acid', 'Acid', 'Vinegar'],
          ['Citric acid', 'Acid', 'Lemon, Orange'],
          ['Sodium hydroxide', 'Base', 'Soap'],
          ['Calcium hydroxide', 'Base', 'Lime water'],
          ['Sodium bicarbonate', 'Base', 'Baking soda']
        ]
      }
    ],
    pdf: {
      title: 'Acids, Bases and Salts - Notes',
      sections: [
        { heading: 'Acids (अम्ल)', body: 'Taste: Sour (खट्टा)\nTurn blue litmus red\nExamples: Lemon juice, vinegar, curd' },
        { heading: 'Bases (क्षार)', body: 'Taste: Bitter (कड़वा)\nFeel: Soapy\nTurn red litmus blue\nExamples: Soap, baking soda, lime water' },
        { heading: 'Neutralization', body: 'Acid + Base → Salt + Water\nThis reaction is called neutralization.\nExample: HCl + NaOH → NaCl + H₂O' }
      ]
    },
    quiz: [
      { q: 'Acids taste:', options: ['Sweet', 'Sour', 'Bitter', 'Salty'], answer: 1 },
      { q: 'Which turns red litmus blue?', options: ['Acid', 'Base', 'Salt', 'Water'], answer: 1 },
      { q: 'Acid + Base → ?', options: ['Salt + Water', 'Gas', 'Acid', 'Base'], answer: 0 },
      { q: 'Turmeric in base turns:', options: ['Yellow', 'Red/Brown', 'Green', 'Blue'], answer: 1 }
    ],
    interactive: [
      {
        type: 'matching',
        title: 'Match Substance with Type',
        left: ['Vinegar', 'Soap', 'Lemon Juice', 'Baking Soda'],
        right: ['Base', 'Acid', 'Base', 'Acid']
      },
      {
        type: 'truefalse',
        title: 'True or False',
        items: [
          { statement: 'All acids are sour', answer: true },
          { statement: 'Bases feel rough', answer: false },
          { statement: 'Neutralization produces salt and water', answer: true },
          { statement: 'Turmeric is a natural indicator', answer: true }
        ]
      }
    ]
  },

  // ========== CLASS 6 SCIENCE ==========
  'cbse-6-science-9': {
    videos: [
      { title: 'Electricity and Circuits - Class 6', titleEn: 'NCERT Science', id: 'mc979OhitAg', duration: '22:00', views: '600K+' },
      { title: 'How to Make a Simple Circuit', titleEn: 'DIY Experiment', id: 'VnbiVw_1FNs', duration: '10:15', views: '400K+' }
    ],
    charts: [
      {
        title: 'Components of Electric Circuit',
        type: 'table',
        headers: ['Component', 'Hindi', 'Function'],
        rows: [
          ['Battery/Cell', 'बैटरी/सेल', 'Provides electricity'],
          ['Wire', 'तार', 'Carries current'],
          ['Bulb', 'बल्ब', 'Gives light'],
          ['Switch', 'स्विच', 'Opens/closes circuit']
        ]
      },
      {
        title: 'Conductors vs Insulators',
        type: 'table',
        headers: ['Conductors (चालक)', 'Insulators (कुचालक)'],
        rows: [
          ['Iron', 'Rubber'],
          ['Copper', 'Plastic'],
          ['Aluminium', 'Wood'],
          ['Water (impure)', 'Glass'],
          ['Human body', 'Air']
        ]
      }
    ],
    pdf: {
      title: 'Electricity and Circuits - Notes',
      sections: [
        { heading: 'Electric Cell', body: 'A device that produces electricity from chemicals.\nHas two terminals: positive (+) and negative (-)\nBattery = two or more cells connected together' },
        { heading: 'Electric Circuit', body: 'A complete path through which electricity flows.\nComponents: Cell, wire, bulb, switch\nOpen circuit = switch off, no current flows\nClosed circuit = switch on, current flows' },
        { heading: 'Conductors & Insulators', list: ['Conductors: Materials that allow electricity to pass (metals)', 'Insulators: Materials that do not allow electricity (rubber, plastic)', 'Handles of tools are made of insulators for safety'] }
      ]
    },
    quiz: [
      { q: 'Which allows electricity to pass?', options: ['Rubber', 'Copper', 'Plastic', 'Wood'], answer: 1 },
      { q: 'A battery is made of:', options: ['One cell', 'Two or more cells', 'Only wires', 'Only bulbs'], answer: 1 },
      { q: 'In open circuit:', options: ['Current flows', 'No current flows', 'Bulb glows', 'Switch is on'], answer: 1 },
      { q: 'Switch is used to:', options: ['Give light', 'Open/close circuit', 'Store electricity', 'Measure current'], answer: 1 }
    ],
    interactive: [
      {
        type: 'matching',
        title: 'Conductor or Insulator?',
        left: ['Iron nail', 'Rubber band', 'Copper wire', 'Plastic ruler'],
        right: ['Insulator', 'Conductor', 'Insulator', 'Conductor']
      },
      {
        type: 'truefalse',
        title: 'True or False',
        items: [
          { statement: 'Electricity can flow through a broken circuit', answer: false },
          { statement: 'All metals are conductors', answer: true },
          { statement: 'Rubber is a conductor', answer: false },
          { statement: 'A switch controls the flow of electricity', answer: true }
        ]
      }
    ]
  },

  // ========== CLASS 6 MATHS ==========
  'cbse-6-maths-1': {
    videos: [
      { title: 'Knowing Our Numbers - Class 6', titleEn: 'NCERT Maths', id: 'lGDqBdm6JPA', duration: '32:00', views: '900K+' },
      { title: 'Indian & International Number System', titleEn: 'Place Value', id: 'g3cKDk8Q7bs', duration: '15:00', views: '600K+' }
    ],
    charts: [
      {
        title: 'Indian Number System',
        type: 'table',
        headers: ['Place', 'Hindi', 'Value'],
        rows: [
          ['Ones', 'इकाई', '1'],
          ['Tens', 'दहाई', '10'],
          ['Hundreds', 'सैकड़ा', '100'],
          ['Thousands', 'हज़ार', '1,000'],
          ['Ten Thousands', 'दस हज़ार', '10,000'],
          ['Lakhs', 'लाख', '1,00,000'],
          ['Ten Lakhs', 'दस लाख', '10,00,000'],
          ['Crores', 'करोड़', '1,00,00,000']
        ]
      },
      {
        title: 'Comparison',
        type: 'table',
        headers: ['Indian', 'International', 'Value'],
        rows: [
          ['1 Lakh', '100 Thousand', '1,00,000'],
          ['10 Lakh', '1 Million', '10,00,000'],
          ['1 Crore', '10 Million', '1,00,00,000'],
          ['10 Crore', '100 Million', '10,00,00,000']
        ]
      }
    ],
    pdf: {
      title: 'Knowing Our Numbers - Notes',
      sections: [
        { heading: 'Comparing Numbers', body: 'Rule 1: More digits = larger number\nRule 2: Same digits → compare leftmost digit first\nExample: 5,432 > 4,999 (5 > 4 in thousands place)' },
        { heading: 'Indian System', body: 'Ones, Tens, Hundreds, Thousands, Ten Thousands, Lakhs, Ten Lakhs, Crores\nCommas: After 3 digits from right, then every 2 digits\nExample: 1,23,45,678' },
        { heading: 'Estimation & Rounding', list: ['Round to nearest 10: look at ones digit', 'Round to nearest 100: look at tens digit', 'Round to nearest 1000: look at hundreds digit', 'If digit ≥ 5, round up; if < 5, round down'] }
      ]
    },
    quiz: [
      { q: '1 Lakh = ?', options: ['10,000', '1,00,000', '10,00,000', '1,000'], answer: 1 },
      { q: '1 Crore = ? Million', options: ['1', '10', '100', '1000'], answer: 1 },
      { q: 'Which is largest: 9999, 10000, 9990, 10001?', options: ['9999', '10000', '9990', '10001'], answer: 3 },
      { q: 'Round 764 to nearest 100:', options: ['700', '800', '760', '770'], answer: 1 }
    ],
    interactive: [
      {
        type: 'fillblank',
        title: 'Fill in the Blanks',
        items: [
          { text: '1 Crore = ___ Lakhs', answer: '100' },
          { text: '1 Million = ___ Lakh', answer: '10' },
          { text: '10 Lakh = 1 ___', answer: 'Million' },
          { text: '1 Lakh = ___ Thousand', answer: '100' }
        ]
      },
      {
        type: 'ordering',
        title: 'Arrange from Smallest to Largest',
        items: ['999', '1,001', '10,000', '99,999', '1,00,000', '10,00,000'],
        correctOrder: [0, 1, 2, 3, 4, 5]
      }
    ]
  }
};
