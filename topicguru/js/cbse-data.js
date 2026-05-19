/* ========================================================
   CBSE BOARD DATA — Classes 6-10, NCERT Syllabus
   Complete course with subjects, chapters, and content
   ======================================================== */

const cbseClassData = [
  { id: 6, name: 'Class 6', nameEn: 'Class 6', gradient: 'grad-red' },
  { id: 7, name: 'Class 7', nameEn: 'Class 7', gradient: 'grad-green' },
  { id: 8, name: 'Class 8', nameEn: 'Class 8', gradient: 'grad-blue' },
  { id: 9, name: 'Class 9', nameEn: 'Class 9', gradient: 'grad-purple' },
  { id: 10, name: 'Class 10', nameEn: 'Class 10', gradient: 'grad-orange' }
];

const cbseSubjectData = {
  6: [
    { id: 'hindi', name: 'हिंदी', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'Mathematics', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'Science', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'Social Science', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'संस्कृत', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  7: [
    { id: 'hindi', name: 'हिंदी', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'Mathematics', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'Science', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'Social Science', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'संस्कृत', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  8: [
    { id: 'hindi', name: 'हिंदी', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'Mathematics', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'Science', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'Social Science', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'संस्कृत', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  9: [
    { id: 'hindi', name: 'हिंदी', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'Mathematics', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'Science', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'Social Science', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'संस्कृत', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  10: [
    { id: 'hindi', name: 'हिंदी', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'Mathematics', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'Science', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'Social Science', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'संस्कृत', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ]
};

const cbseChapterData = {
  // ============ CLASS 6 ============
  '6-hindi': [
    { id: 1, name: 'वह चिड़िया जो', nameEn: 'That Bird Which', desc: 'Vasant - कविता' },
    { id: 2, name: 'बचपन', nameEn: 'Childhood', desc: 'Vasant - संस्मरण' },
    { id: 3, name: 'नादान दोस्त', nameEn: 'Naive Friends', desc: 'Vasant - कहानी' },
    { id: 4, name: 'चाँद से थोड़ी-सी गप्पें', nameEn: 'Chat with Moon', desc: 'Vasant - कविता' },
    { id: 5, name: 'अक्षरों का महत्व', nameEn: 'Importance of Letters', desc: 'Vasant - निबंध' },
    { id: 6, name: 'पार नज़र के', nameEn: 'Beyond Sight', desc: 'Vasant - कहानी' },
    { id: 7, name: 'साथी हाथ बढ़ाना', nameEn: 'Lend a Hand', desc: 'Vasant - कविता' },
    { id: 8, name: 'ऐसे-ऐसे', nameEn: 'Like This', desc: 'Vasant - एकांकी' },
    { id: 9, name: 'टिकट एल्बम', nameEn: 'Ticket Album', desc: 'Vasant - कहानी' },
    { id: 10, name: 'झाँसी की रानी', nameEn: 'Rani of Jhansi', desc: 'Vasant - कविता' }
  ],
  '6-english': [
    { id: 1, name: 'Who Did Patrick\'s Homework?', nameEn: 'Who Did Patrick\'s Homework?', desc: 'Honeysuckle - Story' },
    { id: 2, name: 'How the Dog Found Himself a New Master', nameEn: 'Dog\'s New Master', desc: 'Honeysuckle - Story' },
    { id: 3, name: 'Taro\'s Reward', nameEn: 'Taro\'s Reward', desc: 'Honeysuckle - Story' },
    { id: 4, name: 'An Indian-American Woman in Space', nameEn: 'Kalpana Chawla', desc: 'Honeysuckle - Biography' },
    { id: 5, name: 'A Different Kind of School', nameEn: 'A Different School', desc: 'Honeysuckle - Story' },
    { id: 6, name: 'Who I Am', nameEn: 'Who I Am', desc: 'Honeysuckle - Essay' },
    { id: 7, name: 'Fair Play', nameEn: 'Fair Play', desc: 'Honeysuckle - Story' },
    { id: 8, name: 'A Game of Chance', nameEn: 'A Game of Chance', desc: 'Honeysuckle - Story' },
    { id: 9, name: 'Desert Animals', nameEn: 'Desert Animals', desc: 'Honeysuckle - Info' },
    { id: 10, name: 'The Banyan Tree', nameEn: 'The Banyan Tree', desc: 'Honeysuckle - Story' }
  ],
  '6-maths': [
    { id: 1, name: 'Knowing Our Numbers', nameEn: 'Knowing Our Numbers', desc: 'Number System' },
    { id: 2, name: 'Whole Numbers', nameEn: 'Whole Numbers', desc: 'Number System' },
    { id: 3, name: 'Playing with Numbers', nameEn: 'Playing with Numbers', desc: 'Number Theory' },
    { id: 4, name: 'Basic Geometrical Ideas', nameEn: 'Basic Geometry', desc: 'Geometry' },
    { id: 5, name: 'Understanding Elementary Shapes', nameEn: 'Elementary Shapes', desc: 'Geometry' },
    { id: 6, name: 'Integers', nameEn: 'Integers', desc: 'Number System' },
    { id: 7, name: 'Fractions', nameEn: 'Fractions', desc: 'Number System' },
    { id: 8, name: 'Decimals', nameEn: 'Decimals', desc: 'Number System' },
    { id: 9, name: 'Data Handling', nameEn: 'Data Handling', desc: 'Statistics' },
    { id: 10, name: 'Mensuration', nameEn: 'Mensuration', desc: 'Measurement' },
    { id: 11, name: 'Algebra', nameEn: 'Algebra', desc: 'Algebra' },
    { id: 12, name: 'Ratio and Proportion', nameEn: 'Ratio & Proportion', desc: 'Arithmetic' },
    { id: 13, name: 'Symmetry', nameEn: 'Symmetry', desc: 'Geometry' },
    { id: 14, name: 'Practical Geometry', nameEn: 'Practical Geometry', desc: 'Construction' }
  ],
  '6-science': [
    { id: 1, name: 'Components of Food', nameEn: 'Components of Food', desc: 'Nutrition' },
    { id: 2, name: 'Sorting Materials into Groups', nameEn: 'Sorting Materials', desc: 'Materials' },
    { id: 3, name: 'Separation of Substances', nameEn: 'Separation Methods', desc: 'Chemistry' },
    { id: 4, name: 'Getting to Know Plants', nameEn: 'Know Plants', desc: 'Biology' },
    { id: 5, name: 'Body Movements', nameEn: 'Body Movements', desc: 'Biology' },
    { id: 6, name: 'The Living Organisms', nameEn: 'Living Organisms', desc: 'Biology' },
    { id: 7, name: 'Motion and Measurement', nameEn: 'Motion & Measurement', desc: 'Physics' },
    { id: 8, name: 'Light, Shadows and Reflections', nameEn: 'Light & Shadows', desc: 'Physics' },
    { id: 9, name: 'Electricity and Circuits', nameEn: 'Electricity', desc: 'Physics' },
    { id: 10, name: 'Fun with Magnets', nameEn: 'Magnets', desc: 'Physics' },
    { id: 11, name: 'Air Around Us', nameEn: 'Air Around Us', desc: 'Environment' },
    { id: 12, name: 'Water', nameEn: 'Water', desc: 'Environment' },
    { id: 13, name: 'Garbage In, Garbage Out', nameEn: 'Waste Management', desc: 'Environment' }
  ],
  '6-social': [
    { id: 1, name: 'What, Where, How and When?', nameEn: 'History Introduction', desc: 'History' },
    { id: 2, name: 'From Hunting-Gathering to Growing Food', nameEn: 'Early Humans', desc: 'History' },
    { id: 3, name: 'In the Earliest Cities', nameEn: 'Early Cities', desc: 'History' },
    { id: 4, name: 'The Earth in the Solar System', nameEn: 'Solar System', desc: 'Geography' },
    { id: 5, name: 'Globe: Latitudes and Longitudes', nameEn: 'Latitudes & Longitudes', desc: 'Geography' },
    { id: 6, name: 'Understanding Diversity', nameEn: 'Diversity', desc: 'Civics' },
    { id: 7, name: 'Diversity and Discrimination', nameEn: 'Discrimination', desc: 'Civics' },
    { id: 8, name: 'What is Government?', nameEn: 'Government', desc: 'Civics' }
  ],
  '6-sanskrit': [
    { id: 1, name: 'शब्द परिचयः', nameEn: 'Introduction to Words', desc: 'व्याकरण' },
    { id: 2, name: 'शब्द परिचयः II', nameEn: 'Words Part 2', desc: 'व्याकरण' },
    { id: 3, name: 'शब्द परिचयः III', nameEn: 'Words Part 3', desc: 'व्याकरण' },
    { id: 4, name: 'विद्यालयः', nameEn: 'The School', desc: 'पाठ' },
    { id: 5, name: 'वृक्षाः', nameEn: 'Trees', desc: 'पाठ' },
    { id: 6, name: 'समुद्रतटः', nameEn: 'The Seashore', desc: 'पाठ' },
    { id: 7, name: 'बकस्य प्रतीकारः', nameEn: 'Crane\'s Revenge', desc: 'कथा' }
  ],

  // ============ CLASS 7 ============
  '7-hindi': [
    { id: 1, name: 'हम पंछी उन्मुक्त गगन के', nameEn: 'Birds of Open Sky', desc: 'Vasant - कविता' },
    { id: 2, name: 'दादी माँ', nameEn: 'Grandmother', desc: 'Vasant - कहानी' },
    { id: 3, name: 'हिमालय की बेटियाँ', nameEn: 'Daughters of Himalaya', desc: 'Vasant - निबंध' },
    { id: 4, name: 'कठपुतली', nameEn: 'Puppet', desc: 'Vasant - कविता' },
    { id: 5, name: 'मिठाईवाला', nameEn: 'The Sweet Seller', desc: 'Vasant - कहानी' },
    { id: 6, name: 'रक्त और हमारा शरीर', nameEn: 'Blood and Body', desc: 'Vasant - विज्ञान लेख' },
    { id: 7, name: 'पापा खो गए', nameEn: 'Papa Got Lost', desc: 'Vasant - नाटक' },
    { id: 8, name: 'शाम – एक किसान', nameEn: 'Evening - A Farmer', desc: 'Vasant - कविता' }
  ],
  '7-english': [
    { id: 1, name: 'Three Questions', nameEn: 'Three Questions', desc: 'Honeycomb - Story' },
    { id: 2, name: 'A Gift of Chappals', nameEn: 'Gift of Chappals', desc: 'Honeycomb - Story' },
    { id: 3, name: 'Gopal and the Hilsa Fish', nameEn: 'Gopal & Hilsa Fish', desc: 'Honeycomb - Story' },
    { id: 4, name: 'The Ashes That Made Trees Bloom', nameEn: 'Ashes & Trees', desc: 'Honeycomb - Story' },
    { id: 5, name: 'Quality', nameEn: 'Quality', desc: 'Honeycomb - Story' },
    { id: 6, name: 'Expert Detectives', nameEn: 'Expert Detectives', desc: 'Honeycomb - Story' },
    { id: 7, name: 'The Invention of Vita-Wonk', nameEn: 'Vita-Wonk', desc: 'Honeycomb - Story' },
    { id: 8, name: 'Fire: Friend and Foe', nameEn: 'Fire', desc: 'Honeycomb - Info' },
    { id: 9, name: 'A Bicycle in Good Repair', nameEn: 'Bicycle Repair', desc: 'Honeycomb - Story' },
    { id: 10, name: 'The Story of Cricket', nameEn: 'Story of Cricket', desc: 'Honeycomb - Info' }
  ],
  '7-maths': [
    { id: 1, name: 'Integers', nameEn: 'Integers', desc: 'Number System' },
    { id: 2, name: 'Fractions and Decimals', nameEn: 'Fractions & Decimals', desc: 'Number System' },
    { id: 3, name: 'Data Handling', nameEn: 'Data Handling', desc: 'Statistics' },
    { id: 4, name: 'Simple Equations', nameEn: 'Simple Equations', desc: 'Algebra' },
    { id: 5, name: 'Lines and Angles', nameEn: 'Lines & Angles', desc: 'Geometry' },
    { id: 6, name: 'The Triangle and its Properties', nameEn: 'Triangles', desc: 'Geometry' },
    { id: 7, name: 'Congruence of Triangles', nameEn: 'Congruence', desc: 'Geometry' },
    { id: 8, name: 'Comparing Quantities', nameEn: 'Comparing Quantities', desc: 'Arithmetic' },
    { id: 9, name: 'Rational Numbers', nameEn: 'Rational Numbers', desc: 'Number System' },
    { id: 10, name: 'Practical Geometry', nameEn: 'Practical Geometry', desc: 'Construction' },
    { id: 11, name: 'Perimeter and Area', nameEn: 'Perimeter & Area', desc: 'Mensuration' },
    { id: 12, name: 'Algebraic Expressions', nameEn: 'Algebraic Expressions', desc: 'Algebra' },
    { id: 13, name: 'Exponents and Powers', nameEn: 'Exponents & Powers', desc: 'Number System' },
    { id: 14, name: 'Symmetry', nameEn: 'Symmetry', desc: 'Geometry' },
    { id: 15, name: 'Visualising Solid Shapes', nameEn: 'Solid Shapes', desc: 'Geometry' }
  ],
  '7-science': [
    { id: 1, name: 'Nutrition in Plants', nameEn: 'Plant Nutrition', desc: 'Biology' },
    { id: 2, name: 'Nutrition in Animals', nameEn: 'Animal Nutrition', desc: 'Biology' },
    { id: 3, name: 'Heat', nameEn: 'Heat', desc: 'Physics' },
    { id: 4, name: 'Acids, Bases and Salts', nameEn: 'Acids & Bases', desc: 'Chemistry' },
    { id: 5, name: 'Physical and Chemical Changes', nameEn: 'Physical & Chemical', desc: 'Chemistry' },
    { id: 6, name: 'Respiration in Organisms', nameEn: 'Respiration', desc: 'Biology' },
    { id: 7, name: 'Transportation in Animals and Plants', nameEn: 'Transportation', desc: 'Biology' },
    { id: 8, name: 'Reproduction in Plants', nameEn: 'Plant Reproduction', desc: 'Biology' },
    { id: 9, name: 'Motion and Time', nameEn: 'Motion & Time', desc: 'Physics' },
    { id: 10, name: 'Electric Current and its Effects', nameEn: 'Electric Current', desc: 'Physics' },
    { id: 11, name: 'Light', nameEn: 'Light', desc: 'Physics' },
    { id: 12, name: 'Forests: Our Lifeline', nameEn: 'Forests', desc: 'Environment' },
    { id: 13, name: 'Wastewater Story', nameEn: 'Wastewater', desc: 'Environment' }
  ],
  '7-social': [
    { id: 1, name: 'Tracing Changes Through a Thousand Years', nameEn: 'Medieval India', desc: 'History' },
    { id: 2, name: 'New Kings and Kingdoms', nameEn: 'New Kingdoms', desc: 'History' },
    { id: 3, name: 'The Delhi Sultans', nameEn: 'Delhi Sultans', desc: 'History' },
    { id: 4, name: 'The Mughal Empire', nameEn: 'Mughal Empire', desc: 'History' },
    { id: 5, name: 'Environment', nameEn: 'Environment', desc: 'Geography' },
    { id: 6, name: 'Inside Our Earth', nameEn: 'Inside Our Earth', desc: 'Geography' },
    { id: 7, name: 'Democracy', nameEn: 'Democracy', desc: 'Civics' },
    { id: 8, name: 'Role of Government in Health', nameEn: 'Govt & Health', desc: 'Civics' }
  ],
  '7-sanskrit': [
    { id: 1, name: 'सुभाषितानि', nameEn: 'Good Sayings', desc: 'श्लोक' },
    { id: 2, name: 'दुर्बुद्धिः विनश्यति', nameEn: 'Evil Minds Perish', desc: 'कथा' },
    { id: 3, name: 'स्वावलम्बनम्', nameEn: 'Self-reliance', desc: 'पाठ' },
    { id: 4, name: 'हास्यबालकविसम्मेलनम्', nameEn: 'Children\'s Poetry', desc: 'कविता' },
    { id: 5, name: 'पण्डिता रमाबाई', nameEn: 'Pandita Ramabai', desc: 'जीवनी' },
    { id: 6, name: 'सदाचारः', nameEn: 'Good Conduct', desc: 'पाठ' }
  ],

  // ============ CLASS 8 ============
  '8-hindi': [
    { id: 1, name: 'ध्वनि', nameEn: 'Sound (Poem)', desc: 'Vasant - कविता' },
    { id: 2, name: 'लाख की चूड़ियाँ', nameEn: 'Lac Bangles', desc: 'Vasant - कहानी' },
    { id: 3, name: 'बस की यात्रा', nameEn: 'Bus Journey', desc: 'Vasant - व्यंग्य' },
    { id: 4, name: 'दीवानों की हस्ती', nameEn: 'World of Crazy', desc: 'Vasant - कविता' },
    { id: 5, name: 'चिट्ठियों की अनूठी दुनिया', nameEn: 'World of Letters', desc: 'Vasant - निबंध' },
    { id: 6, name: 'भगवान के डाकिए', nameEn: 'God\'s Postmen', desc: 'Vasant - कविता' },
    { id: 7, name: 'क्या निराश हुआ जाए', nameEn: 'Should We Despair', desc: 'Vasant - निबंध' },
    { id: 8, name: 'यह सबसे कठिन समय नहीं', nameEn: 'Not the Hardest Time', desc: 'Vasant - कविता' },
    { id: 9, name: 'कबीर की साखियाँ', nameEn: 'Kabir\'s Couplets', desc: 'Vasant - दोहे' }
  ],
  '8-english': [
    { id: 1, name: 'The Best Christmas Present in the World', nameEn: 'Christmas Present', desc: 'Honeydew - Story' },
    { id: 2, name: 'The Tsunami', nameEn: 'The Tsunami', desc: 'Honeydew - Story' },
    { id: 3, name: 'Glimpses of the Past', nameEn: 'Indian History', desc: 'Honeydew - Info' },
    { id: 4, name: 'Bepin Choudhury\'s Lapse of Memory', nameEn: 'Lapse of Memory', desc: 'Honeydew - Story' },
    { id: 5, name: 'The Summit Within', nameEn: 'Climbing Everest', desc: 'Honeydew - Essay' },
    { id: 6, name: 'This is Jody\'s Fawn', nameEn: 'Jody\'s Fawn', desc: 'Honeydew - Story' },
    { id: 7, name: 'A Visit to Cambridge', nameEn: 'Visit Cambridge', desc: 'Honeydew - Story' },
    { id: 8, name: 'A Short Monsoon Diary', nameEn: 'Monsoon Diary', desc: 'Honeydew - Diary' }
  ],
  '8-maths': [
    { id: 1, name: 'Rational Numbers', nameEn: 'Rational Numbers', desc: 'Number System' },
    { id: 2, name: 'Linear Equations in One Variable', nameEn: 'Linear Equations', desc: 'Algebra' },
    { id: 3, name: 'Understanding Quadrilaterals', nameEn: 'Quadrilaterals', desc: 'Geometry' },
    { id: 4, name: 'Data Handling', nameEn: 'Data Handling', desc: 'Statistics' },
    { id: 5, name: 'Squares and Square Roots', nameEn: 'Squares & Roots', desc: 'Number System' },
    { id: 6, name: 'Cubes and Cube Roots', nameEn: 'Cubes & Roots', desc: 'Number System' },
    { id: 7, name: 'Comparing Quantities', nameEn: 'Comparing Quantities', desc: 'Arithmetic' },
    { id: 8, name: 'Algebraic Expressions and Identities', nameEn: 'Algebraic Identities', desc: 'Algebra' },
    { id: 9, name: 'Mensuration', nameEn: 'Mensuration', desc: 'Mensuration' },
    { id: 10, name: 'Exponents and Powers', nameEn: 'Exponents & Powers', desc: 'Number System' },
    { id: 11, name: 'Direct and Inverse Proportions', nameEn: 'Proportions', desc: 'Arithmetic' },
    { id: 12, name: 'Factorisation', nameEn: 'Factorisation', desc: 'Algebra' },
    { id: 13, name: 'Introduction to Graphs', nameEn: 'Graphs', desc: 'Statistics' },
    { id: 14, name: 'Playing with Numbers', nameEn: 'Playing with Numbers', desc: 'Number Theory' }
  ],
  '8-science': [
    { id: 1, name: 'Crop Production and Management', nameEn: 'Crop Production', desc: 'Biology' },
    { id: 2, name: 'Microorganisms: Friend and Foe', nameEn: 'Microorganisms', desc: 'Biology' },
    { id: 3, name: 'Coal and Petroleum', nameEn: 'Coal & Petroleum', desc: 'Chemistry' },
    { id: 4, name: 'Combustion and Flame', nameEn: 'Combustion', desc: 'Chemistry' },
    { id: 5, name: 'Conservation of Plants and Animals', nameEn: 'Conservation', desc: 'Biology' },
    { id: 6, name: 'Reproduction in Animals', nameEn: 'Reproduction', desc: 'Biology' },
    { id: 7, name: 'Reaching the Age of Adolescence', nameEn: 'Adolescence', desc: 'Biology' },
    { id: 8, name: 'Force and Pressure', nameEn: 'Force & Pressure', desc: 'Physics' },
    { id: 9, name: 'Friction', nameEn: 'Friction', desc: 'Physics' },
    { id: 10, name: 'Sound', nameEn: 'Sound', desc: 'Physics' },
    { id: 11, name: 'Chemical Effects of Electric Current', nameEn: 'Chemical Effects', desc: 'Chemistry' },
    { id: 12, name: 'Some Natural Phenomena', nameEn: 'Natural Phenomena', desc: 'Physics' },
    { id: 13, name: 'Light', nameEn: 'Light', desc: 'Physics' },
    { id: 14, name: 'Stars and the Solar System', nameEn: 'Solar System', desc: 'Space' },
    { id: 15, name: 'Pollution of Air and Water', nameEn: 'Pollution', desc: 'Environment' }
  ],
  '8-social': [
    { id: 1, name: 'How, When and Where', nameEn: 'Modern India Intro', desc: 'History' },
    { id: 2, name: 'From Trade to Territory', nameEn: 'British East India Co.', desc: 'History' },
    { id: 3, name: 'Ruling the Countryside', nameEn: 'British Rural India', desc: 'History' },
    { id: 4, name: 'The Indian Constitution', nameEn: 'Constitution', desc: 'Civics' },
    { id: 5, name: 'Understanding Secularism', nameEn: 'Secularism', desc: 'Civics' },
    { id: 6, name: 'Resources', nameEn: 'Resources', desc: 'Geography' },
    { id: 7, name: 'Land, Soil, Water', nameEn: 'Land & Soil', desc: 'Geography' },
    { id: 8, name: 'Industries', nameEn: 'Industries', desc: 'Geography' }
  ],
  '8-sanskrit': [
    { id: 1, name: 'सुभाषितानि', nameEn: 'Good Sayings', desc: 'श्लोक' },
    { id: 2, name: 'बिलस्य वाणी न कदापि मे श्रुता', nameEn: 'Unheard Voice', desc: 'कथा' },
    { id: 3, name: 'डिजीभारतम्', nameEn: 'Digital India', desc: 'पाठ' },
    { id: 4, name: 'सदैव पुरतो निधेहि चरणम्', nameEn: 'Always Move Forward', desc: 'गीत' },
    { id: 5, name: 'कण्टकेनैव कण्टकम्', nameEn: 'Thorn by Thorn', desc: 'कथा' },
    { id: 6, name: 'गृहं शून्यं सुतां विना', nameEn: 'Home Empty Without Daughter', desc: 'पाठ' }
  ],

  // ============ CLASS 9 ============
  '9-hindi': [
    { id: 1, name: 'दो बैलों की कथा', nameEn: 'Tale of Two Oxen', desc: 'Kshitij - कहानी' },
    { id: 2, name: 'ल्हासा की ओर', nameEn: 'Towards Lhasa', desc: 'Kshitij - यात्रा वृत्तांत' },
    { id: 3, name: 'उपभोक्तावाद की संस्कृति', nameEn: 'Consumer Culture', desc: 'Kshitij - निबंध' },
    { id: 4, name: 'साँवले सपनों की याद', nameEn: 'Dark Dreams', desc: 'Kshitij - रेखाचित्र' },
    { id: 5, name: 'नाना साहब की पुत्री', nameEn: 'Nana Saheb\'s Daughter', desc: 'Kshitij - ऐतिहासिक' },
    { id: 6, name: 'प्रेमचंद के फटे जूते', nameEn: 'Premchand\'s Torn Shoes', desc: 'Kshitij - व्यंग्य' },
    { id: 7, name: 'मेरे बचपन के दिन', nameEn: 'My Childhood Days', desc: 'Kshitij - संस्मरण' },
    { id: 8, name: 'एक कुत्ता और एक मैना', nameEn: 'A Dog and a Myna', desc: 'Kshitij - निबंध' }
  ],
  '9-english': [
    { id: 1, name: 'The Fun They Had', nameEn: 'The Fun They Had', desc: 'Beehive - Story' },
    { id: 2, name: 'The Sound of Music', nameEn: 'Sound of Music', desc: 'Beehive - Biography' },
    { id: 3, name: 'The Little Girl', nameEn: 'The Little Girl', desc: 'Beehive - Story' },
    { id: 4, name: 'A Truly Beautiful Mind', nameEn: 'Einstein', desc: 'Beehive - Biography' },
    { id: 5, name: 'The Snake and the Mirror', nameEn: 'Snake & Mirror', desc: 'Beehive - Story' },
    { id: 6, name: 'My Childhood', nameEn: 'APJ Abdul Kalam', desc: 'Beehive - Autobiography' },
    { id: 7, name: 'Reach for the Top', nameEn: 'Reach for Top', desc: 'Beehive - Biography' },
    { id: 8, name: 'Kathmandu', nameEn: 'Kathmandu', desc: 'Beehive - Travel' },
    { id: 9, name: 'If I Were You', nameEn: 'If I Were You', desc: 'Beehive - Play' }
  ],
  '9-maths': [
    { id: 1, name: 'Number Systems', nameEn: 'Number Systems', desc: 'Real Numbers' },
    { id: 2, name: 'Polynomials', nameEn: 'Polynomials', desc: 'Algebra' },
    { id: 3, name: 'Coordinate Geometry', nameEn: 'Coordinate Geometry', desc: 'Geometry' },
    { id: 4, name: 'Linear Equations in Two Variables', nameEn: 'Linear Equations', desc: 'Algebra' },
    { id: 5, name: 'Introduction to Euclid\'s Geometry', nameEn: 'Euclid\'s Geometry', desc: 'Geometry' },
    { id: 6, name: 'Lines and Angles', nameEn: 'Lines & Angles', desc: 'Geometry' },
    { id: 7, name: 'Triangles', nameEn: 'Triangles', desc: 'Geometry' },
    { id: 8, name: 'Quadrilaterals', nameEn: 'Quadrilaterals', desc: 'Geometry' },
    { id: 9, name: 'Circles', nameEn: 'Circles', desc: 'Geometry' },
    { id: 10, name: 'Heron\'s Formula', nameEn: 'Heron\'s Formula', desc: 'Mensuration' },
    { id: 11, name: 'Surface Areas and Volumes', nameEn: 'Surface Areas', desc: 'Mensuration' },
    { id: 12, name: 'Statistics', nameEn: 'Statistics', desc: 'Statistics' },
    { id: 13, name: 'Probability', nameEn: 'Probability', desc: 'Probability' }
  ],
  '9-science': [
    { id: 1, name: 'Matter in Our Surroundings', nameEn: 'Matter', desc: 'Chemistry' },
    { id: 2, name: 'Is Matter Around Us Pure?', nameEn: 'Pure Matter', desc: 'Chemistry' },
    { id: 3, name: 'Atoms and Molecules', nameEn: 'Atoms & Molecules', desc: 'Chemistry' },
    { id: 4, name: 'Structure of the Atom', nameEn: 'Atomic Structure', desc: 'Chemistry' },
    { id: 5, name: 'The Fundamental Unit of Life', nameEn: 'Cell', desc: 'Biology' },
    { id: 6, name: 'Tissues', nameEn: 'Tissues', desc: 'Biology' },
    { id: 7, name: 'Motion', nameEn: 'Motion', desc: 'Physics' },
    { id: 8, name: 'Force and Laws of Motion', nameEn: 'Newton\'s Laws', desc: 'Physics' },
    { id: 9, name: 'Gravitation', nameEn: 'Gravitation', desc: 'Physics' },
    { id: 10, name: 'Work and Energy', nameEn: 'Work & Energy', desc: 'Physics' },
    { id: 11, name: 'Sound', nameEn: 'Sound', desc: 'Physics' },
    { id: 12, name: 'Improvement in Food Resources', nameEn: 'Food Resources', desc: 'Biology' }
  ],
  '9-social': [
    { id: 1, name: 'The French Revolution', nameEn: 'French Revolution', desc: 'History' },
    { id: 2, name: 'Socialism in Europe', nameEn: 'Socialism', desc: 'History' },
    { id: 3, name: 'Nazism and the Rise of Hitler', nameEn: 'Nazism & Hitler', desc: 'History' },
    { id: 4, name: 'India — Size and Location', nameEn: 'India Location', desc: 'Geography' },
    { id: 5, name: 'Physical Features of India', nameEn: 'Indian Geography', desc: 'Geography' },
    { id: 6, name: 'What is Democracy?', nameEn: 'Democracy', desc: 'Civics' },
    { id: 7, name: 'Constitutional Design', nameEn: 'Constitution', desc: 'Civics' },
    { id: 8, name: 'The Story of Village Palampur', nameEn: 'Village Economy', desc: 'Economics' },
    { id: 9, name: 'People as Resource', nameEn: 'Human Capital', desc: 'Economics' }
  ],
  '9-sanskrit': [
    { id: 1, name: 'भारतीवसन्तगीतिः', nameEn: 'Song of Indian Spring', desc: 'काव्य' },
    { id: 2, name: 'स्वर्णकाकः', nameEn: 'Golden Crow', desc: 'कथा' },
    { id: 3, name: 'गोदोहनम्', nameEn: 'Milking the Cow', desc: 'नाटक' },
    { id: 4, name: 'कल्पतरूः', nameEn: 'Wish-Fulfilling Tree', desc: 'कथा' },
    { id: 5, name: 'सूक्तिमौक्तिकम्', nameEn: 'Pearl of Wisdom', desc: 'सूक्ति' }
  ],

  // ============ CLASS 10 ============
  '10-hindi': [
    { id: 1, name: 'सूरदास के पद', nameEn: 'Surdas Poetry', desc: 'Kshitij - काव्य' },
    { id: 2, name: 'राम-लक्ष्मण-परशुराम संवाद', nameEn: 'Ram-Lakshman Dialogue', desc: 'Kshitij - काव्य' },
    { id: 3, name: 'सवैया और कवित्त', nameEn: 'Savaiya & Kavitt', desc: 'Kshitij - काव्य' },
    { id: 4, name: 'आत्मकथ्य', nameEn: 'Autobiography (Poem)', desc: 'Kshitij - काव्य' },
    { id: 5, name: 'उत्साह और अट नहीं रही', nameEn: 'Enthusiasm', desc: 'Kshitij - काव्य' },
    { id: 6, name: 'नेताजी का चश्मा', nameEn: 'Netaji\'s Glasses', desc: 'Kshitij - कहानी' },
    { id: 7, name: 'बालगोबिन भगत', nameEn: 'Balgobin Bhagat', desc: 'Kshitij - रेखाचित्र' },
    { id: 8, name: 'लखनवी अंदाज़', nameEn: 'Lucknow Style', desc: 'Kshitij - व्यंग्य' },
    { id: 9, name: 'संस्कृति', nameEn: 'Culture', desc: 'Kshitij - निबंध' },
    { id: 10, name: 'नौबतखाने में इबादत', nameEn: 'Worship in Music Hall', desc: 'Kshitij - व्यक्तिचित्र' }
  ],
  '10-english': [
    { id: 1, name: 'A Letter to God', nameEn: 'A Letter to God', desc: 'First Flight - Story' },
    { id: 2, name: 'Nelson Mandela: Long Walk to Freedom', nameEn: 'Nelson Mandela', desc: 'First Flight - Biography' },
    { id: 3, name: 'Two Stories about Flying', nameEn: 'Flying Stories', desc: 'First Flight - Story' },
    { id: 4, name: 'From the Diary of Anne Frank', nameEn: 'Anne Frank', desc: 'First Flight - Diary' },
    { id: 5, name: 'The Hundred Dresses — I', nameEn: 'Hundred Dresses I', desc: 'First Flight - Story' },
    { id: 6, name: 'The Hundred Dresses — II', nameEn: 'Hundred Dresses II', desc: 'First Flight - Story' },
    { id: 7, name: 'Glimpses of India', nameEn: 'Glimpses of India', desc: 'First Flight - Essay' },
    { id: 8, name: 'Mijbil the Otter', nameEn: 'Mijbil the Otter', desc: 'First Flight - Story' },
    { id: 9, name: 'Madam Rides the Bus', nameEn: 'Madam Rides Bus', desc: 'First Flight - Story' },
    { id: 10, name: 'The Sermon at Benares', nameEn: 'Sermon at Benares', desc: 'First Flight - Legend' },
    { id: 11, name: 'The Proposal', nameEn: 'The Proposal', desc: 'First Flight - Play' }
  ],
  '10-maths': [
    { id: 1, name: 'Real Numbers', nameEn: 'Real Numbers', desc: 'Number System' },
    { id: 2, name: 'Polynomials', nameEn: 'Polynomials', desc: 'Algebra' },
    { id: 3, name: 'Pair of Linear Equations in Two Variables', nameEn: 'Linear Equations', desc: 'Algebra' },
    { id: 4, name: 'Quadratic Equations', nameEn: 'Quadratic Equations', desc: 'Algebra' },
    { id: 5, name: 'Arithmetic Progressions', nameEn: 'AP', desc: 'Sequences' },
    { id: 6, name: 'Triangles', nameEn: 'Triangles', desc: 'Geometry' },
    { id: 7, name: 'Coordinate Geometry', nameEn: 'Coordinate Geometry', desc: 'Geometry' },
    { id: 8, name: 'Introduction to Trigonometry', nameEn: 'Trigonometry', desc: 'Trigonometry' },
    { id: 9, name: 'Some Applications of Trigonometry', nameEn: 'Trig Applications', desc: 'Trigonometry' },
    { id: 10, name: 'Circles', nameEn: 'Circles', desc: 'Geometry' },
    { id: 11, name: 'Areas Related to Circles', nameEn: 'Circle Areas', desc: 'Mensuration' },
    { id: 12, name: 'Surface Areas and Volumes', nameEn: 'Surface Areas', desc: 'Mensuration' },
    { id: 13, name: 'Statistics', nameEn: 'Statistics', desc: 'Statistics' },
    { id: 14, name: 'Probability', nameEn: 'Probability', desc: 'Probability' }
  ],
  '10-science': [
    { id: 1, name: 'Chemical Reactions and Equations', nameEn: 'Chemical Reactions', desc: 'Chemistry' },
    { id: 2, name: 'Acids, Bases and Salts', nameEn: 'Acids & Bases', desc: 'Chemistry' },
    { id: 3, name: 'Metals and Non-metals', nameEn: 'Metals', desc: 'Chemistry' },
    { id: 4, name: 'Carbon and its Compounds', nameEn: 'Carbon Compounds', desc: 'Chemistry' },
    { id: 5, name: 'Life Processes', nameEn: 'Life Processes', desc: 'Biology' },
    { id: 6, name: 'Control and Coordination', nameEn: 'Nervous System', desc: 'Biology' },
    { id: 7, name: 'How do Organisms Reproduce?', nameEn: 'Reproduction', desc: 'Biology' },
    { id: 8, name: 'Heredity', nameEn: 'Heredity & Evolution', desc: 'Biology' },
    { id: 9, name: 'Light — Reflection and Refraction', nameEn: 'Light', desc: 'Physics' },
    { id: 10, name: 'The Human Eye and the Colourful World', nameEn: 'Human Eye', desc: 'Physics' },
    { id: 11, name: 'Electricity', nameEn: 'Electricity', desc: 'Physics' },
    { id: 12, name: 'Magnetic Effects of Electric Current', nameEn: 'Magnetism', desc: 'Physics' },
    { id: 13, name: 'Our Environment', nameEn: 'Environment', desc: 'Environment' }
  ],
  '10-social': [
    { id: 1, name: 'The Rise of Nationalism in Europe', nameEn: 'Nationalism Europe', desc: 'History' },
    { id: 2, name: 'Nationalism in India', nameEn: 'Nationalism India', desc: 'History' },
    { id: 3, name: 'The Making of a Global World', nameEn: 'Global World', desc: 'History' },
    { id: 4, name: 'The Age of Industrialisation', nameEn: 'Industrialisation', desc: 'History' },
    { id: 5, name: 'Resources and Development', nameEn: 'Resources', desc: 'Geography' },
    { id: 6, name: 'Water Resources', nameEn: 'Water Resources', desc: 'Geography' },
    { id: 7, name: 'Agriculture', nameEn: 'Agriculture', desc: 'Geography' },
    { id: 8, name: 'Power Sharing', nameEn: 'Power Sharing', desc: 'Civics' },
    { id: 9, name: 'Federalism', nameEn: 'Federalism', desc: 'Civics' },
    { id: 10, name: 'Development', nameEn: 'Development', desc: 'Economics' },
    { id: 11, name: 'Money and Credit', nameEn: 'Money & Credit', desc: 'Economics' },
    { id: 12, name: 'Globalisation and the Indian Economy', nameEn: 'Globalisation', desc: 'Economics' }
  ],
  '10-sanskrit': [
    { id: 1, name: 'शुचिपर्यावरणम्', nameEn: 'Clean Environment', desc: 'काव्य' },
    { id: 2, name: 'बुद्धिर्बलवती सदा', nameEn: 'Wisdom is Strength', desc: 'कथा' },
    { id: 3, name: 'व्यायामः सर्वदा पथ्यः', nameEn: 'Exercise Always Good', desc: 'पाठ' },
    { id: 4, name: 'शिशुलालनम्', nameEn: 'Child Nurturing', desc: 'नाटक' },
    { id: 5, name: 'जननी तुल्यवत्सला', nameEn: 'Mother\'s Equal Love', desc: 'कथा' },
    { id: 6, name: 'सुभाषितानि', nameEn: 'Good Sayings', desc: 'सूक्ति' }
  ]
};
