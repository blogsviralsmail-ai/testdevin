// ========== TOPIC GURU - APP DATA & LOGIC ==========

// Class/Grade Data
const classData = [
  { id: 6, name: 'ધોરણ 6', nameEn: 'Class 6', gradient: 'grad-red' },
  { id: 7, name: 'ધોરણ 7', nameEn: 'Class 7', gradient: 'grad-green' },
  { id: 8, name: 'ધોરણ 8', nameEn: 'Class 8', gradient: 'grad-blue' },
  { id: 9, name: 'ધોરણ 9', nameEn: 'Class 9', gradient: 'grad-purple' },
  { id: 10, name: 'ધોરણ 10', nameEn: 'Class 10', gradient: 'grad-orange' }
];

// Subject Data per class
const subjectData = {
  6: [
    { id: 'gujarati', name: 'ગુજરાતી', nameEn: 'Gujarati', icon: '📖', bg: 'bg-blue' },
    { id: 'hindi', name: 'હિન્દી', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'ગણિત', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'વિજ્ઞાન', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'સામાજિક વિજ્ઞાન', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'સંસ્કૃત', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  7: [
    { id: 'gujarati', name: 'ગુજરાતી', nameEn: 'Gujarati', icon: '📖', bg: 'bg-blue' },
    { id: 'hindi', name: 'હિન્દી', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'ગણિત', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'વિજ્ઞાન', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'સામાજિક વિજ્ઞાન', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'સંસ્કૃત', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  8: [
    { id: 'gujarati', name: 'ગુજરાતી', nameEn: 'Gujarati', icon: '📖', bg: 'bg-blue' },
    { id: 'hindi', name: 'હિન્દી', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'ગણિત', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'વિજ્ઞાન', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'સામાજિક વિજ્ઞાન', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'સંસ્કૃત', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  9: [
    { id: 'gujarati', name: 'ગુજરાતી', nameEn: 'Gujarati', icon: '📖', bg: 'bg-blue' },
    { id: 'hindi', name: 'હિન્દી', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'ગણિત', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'વિજ્ઞાન', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'સામાજિક વિજ્ઞાન', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'સંસ્કૃત', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ],
  10: [
    { id: 'gujarati', name: 'ગુજરાતી', nameEn: 'Gujarati', icon: '📖', bg: 'bg-blue' },
    { id: 'hindi', name: 'હિન્દી', nameEn: 'Hindi', icon: '📖', bg: 'bg-purple' },
    { id: 'english', name: 'English', nameEn: 'English', icon: '📖', bg: 'bg-green' },
    { id: 'maths', name: 'ગણિત', nameEn: 'Mathematics', icon: '📐', bg: 'bg-red' },
    { id: 'science', name: 'વિજ્ઞાન', nameEn: 'Science', icon: '🔬', bg: 'bg-teal' },
    { id: 'social', name: 'સામાજિક વિજ્ઞાન', nameEn: 'Social Science', icon: '🌍', bg: 'bg-orange' },
    { id: 'sanskrit', name: 'સંસ્કૃત', nameEn: 'Sanskrit', icon: '📜', bg: 'bg-brown' }
  ]
};

// Chapter Data
const chapterData = {
  // Class 6
  '6-gujarati': [
    { id: 1, name: 'પર્વત તારા', nameEn: 'Mountain Stars', desc: 'કવિતા' },
    { id: 2, name: 'વાર્તા રે વાર્તા', nameEn: 'Story oh Story', desc: 'વાર્તા' },
    { id: 3, name: 'ઘોમરાજનું ગુણિશોધન', nameEn: 'Qualities of Ghomraj', desc: 'ગદ્ય' },
    { id: 4, name: 'કૃષિ પરથી સૃષ્ટિ', nameEn: 'World from Agriculture', desc: 'ગદ્ય' },
    { id: 5, name: 'અમે અજવાળું', nameEn: 'We are the Light', desc: 'કવિતા' },
    { id: 6, name: 'ગુજરાત મારો ગુજરાત', nameEn: 'My Gujarat', desc: 'ગદ્ય' },
    { id: 7, name: 'ડોશીમાની વાત', nameEn: 'Grandmother\'s Tale', desc: 'વાર્તા' },
    { id: 8, name: 'પ્રેમનો પત્ર', nameEn: 'Letter of Love', desc: 'ગદ્ય' }
  ],
  '6-hindi': [
    { id: 1, name: 'वह चिड़िया जो', nameEn: 'That Bird Which', desc: 'कविता' },
    { id: 2, name: 'बचपन', nameEn: 'Childhood', desc: 'गद्य' },
    { id: 3, name: 'नादान दोस्त', nameEn: 'Naive Friends', desc: 'कहानी' },
    { id: 4, name: 'चाँद से थोड़ी-सी गप्पें', nameEn: 'A Chat with the Moon', desc: 'कविता' },
    { id: 5, name: 'अक्षरों का महत्व', nameEn: 'Importance of Letters', desc: 'गद्य' },
    { id: 6, name: 'पार नज़र के', nameEn: 'Beyond Sight', desc: 'कहानी' },
    { id: 7, name: 'साथी हाथ बढ़ाना', nameEn: 'Lend a Hand, Friend', desc: 'कविता' }
  ],
  '6-english': [
    { id: 1, name: 'Who Did Patrick\'s Homework?', nameEn: 'Who Did Patrick\'s Homework?', desc: 'Story' },
    { id: 2, name: 'How the Dog Found Himself', nameEn: 'How the Dog Found Himself', desc: 'Story' },
    { id: 3, name: 'Taro\'s Reward', nameEn: 'Taro\'s Reward', desc: 'Story' },
    { id: 4, name: 'An Indian – American Woman in Space', nameEn: 'Kalpana Chawla', desc: 'Biography' },
    { id: 5, name: 'A Different Kind of School', nameEn: 'A Different Kind of School', desc: 'Story' },
    { id: 6, name: 'Who I Am', nameEn: 'Who I Am', desc: 'Essay' },
    { id: 7, name: 'Fair Play', nameEn: 'Fair Play', desc: 'Story' }
  ],
  '6-maths': [
    { id: 1, name: 'આપણી સંખ્યાઓ', nameEn: 'Knowing Our Numbers', desc: 'Numbers' },
    { id: 2, name: 'પૂર્ણ સંખ્યાઓ', nameEn: 'Whole Numbers', desc: 'Numbers' },
    { id: 3, name: 'સંખ્યાઓ સાથે રમત', nameEn: 'Playing with Numbers', desc: 'Number Theory' },
    { id: 4, name: 'મૂળભૂત ભૌમિતિક ખ્યાલો', nameEn: 'Basic Geometrical Ideas', desc: 'Geometry' },
    { id: 5, name: 'માપન', nameEn: 'Mensuration', desc: 'Measurement' },
    { id: 6, name: 'દશાંશ', nameEn: 'Decimals', desc: 'Decimals' },
    { id: 7, name: 'બીજગણિત', nameEn: 'Introduction to Algebra', desc: 'Algebra' },
    { id: 8, name: 'ગુણોત્તર અને પ્રમાણ', nameEn: 'Ratio and Proportion', desc: 'Arithmetic' }
  ],
  '6-science': [
    { id: 1, name: 'આહારના ઘટકો', nameEn: 'Components of Food', desc: 'Biology' },
    { id: 2, name: 'વસ્તુઓનું જૂથ બનાવવું', nameEn: 'Sorting Materials into Groups', desc: 'Chemistry' },
    { id: 3, name: 'પદાર્થનું અલગીકરણ', nameEn: 'Separation of Substances', desc: 'Chemistry' },
    { id: 4, name: 'વાનસ્પતિની કાયમકારી મોર્ફોલોજી', nameEn: 'Getting to Know Plants', desc: 'Biology' },
    { id: 5, name: 'શરીરની હલનચલન', nameEn: 'Body Movements', desc: 'Biology' },
    { id: 6, name: 'સજીવો અને તેમનું નિવાસસ્થાન', nameEn: 'Living Organisms & Habitat', desc: 'Biology' },
    { id: 7, name: 'ગતિ અને અંતર', nameEn: 'Motion and Distance', desc: 'Physics' },
    { id: 8, name: 'પ્રકાશ, પડછાયા અને પ્રતિબિંબ', nameEn: 'Light, Shadows & Reflections', desc: 'Physics' }
  ],
  '6-social': [
    { id: 1, name: 'પૃથ્વી – આપણું નિવાસસ્થાન', nameEn: 'Earth – Our Habitat', desc: 'Geography' },
    { id: 2, name: 'ગ્લોબ – અક્ષાંશ અને રેખાંશ', nameEn: 'Globe – Latitudes & Longitudes', desc: 'Geography' },
    { id: 3, name: 'ભારતનો ઈતિહાસ', nameEn: 'History of India', desc: 'History' },
    { id: 4, name: 'પ્રારંભિક માનવ', nameEn: 'Early Humans', desc: 'History' },
    { id: 5, name: 'લોકશાહી સરકાર', nameEn: 'Democratic Government', desc: 'Civics' },
    { id: 6, name: 'ગ્રામીણ વહીવટ', nameEn: 'Rural Administration', desc: 'Civics' }
  ],
  '6-sanskrit': [
    { id: 1, name: 'शब्द परिचयः', nameEn: 'Introduction to Words', desc: 'व्याकरण' },
    { id: 2, name: 'धातु परिचयः', nameEn: 'Introduction to Verbs', desc: 'व्याकरण' },
    { id: 3, name: 'कृषिकाः कर्मवीराः', nameEn: 'Farmers are Heroes', desc: 'गद्यम्' },
    { id: 4, name: 'विद्यालयः', nameEn: 'The School', desc: 'गद्यम्' },
    { id: 5, name: 'वृक्षाः', nameEn: 'Trees', desc: 'पद्यम्' }
  ],
  // Class 7
  '7-gujarati': [
    { id: 1, name: 'મારી ભાષા', nameEn: 'My Language', desc: 'કવિતા' },
    { id: 2, name: 'ગુજરાતની ભૂમિ', nameEn: 'Land of Gujarat', desc: 'ગદ્ય' },
    { id: 3, name: 'સંતવાણી', nameEn: 'Saint\'s Voice', desc: 'કવિતા' },
    { id: 4, name: 'ખેડૂત', nameEn: 'The Farmer', desc: 'ગદ્ય' },
    { id: 5, name: 'દીવો', nameEn: 'The Lamp', desc: 'કવિતા' },
    { id: 6, name: 'રાજાનો ન્યાય', nameEn: 'King\'s Justice', desc: 'વાર્તા' },
    { id: 7, name: 'મારું ગામ', nameEn: 'My Village', desc: 'ગદ્ય' }
  ],
  '7-hindi': [
    { id: 1, name: 'हम पंछी उन्मुक्त गगन के', nameEn: 'We Free Birds of the Sky', desc: 'कविता' },
    { id: 2, name: 'दादी माँ', nameEn: 'Grandmother', desc: 'कहानी' },
    { id: 3, name: 'हिमालय की बेटियाँ', nameEn: 'Daughters of Himalayas', desc: 'गद्य' },
    { id: 4, name: 'कठपुतली', nameEn: 'The Puppet', desc: 'कविता' },
    { id: 5, name: 'मिठाईवाला', nameEn: 'The Sweet Seller', desc: 'कहानी' },
    { id: 6, name: 'रक्त और हमारा शरीर', nameEn: 'Blood and Our Body', desc: 'गद्य' }
  ],
  '7-english': [
    { id: 1, name: 'Three Questions', nameEn: 'Three Questions', desc: 'Story' },
    { id: 2, name: 'A Gift of Chappals', nameEn: 'A Gift of Chappals', desc: 'Story' },
    { id: 3, name: 'Gopal and the Hilsa Fish', nameEn: 'Gopal and the Hilsa Fish', desc: 'Story' },
    { id: 4, name: 'The Ashes That Made Trees Bloom', nameEn: 'The Ashes That Made Trees Bloom', desc: 'Story' },
    { id: 5, name: 'Quality', nameEn: 'Quality', desc: 'Story' },
    { id: 6, name: 'Expert Detectives', nameEn: 'Expert Detectives', desc: 'Story' }
  ],
  '7-maths': [
    { id: 1, name: 'પૂર્ણાંકો', nameEn: 'Integers', desc: 'Numbers' },
    { id: 2, name: 'અપૂર્ણાંકો અને દશાંશ', nameEn: 'Fractions and Decimals', desc: 'Numbers' },
    { id: 3, name: 'આંકડાશાસ્ત્ર', nameEn: 'Data Handling', desc: 'Statistics' },
    { id: 4, name: 'સરળ સમીકરણો', nameEn: 'Simple Equations', desc: 'Algebra' },
    { id: 5, name: 'રેખાઓ અને ખૂણાઓ', nameEn: 'Lines and Angles', desc: 'Geometry' },
    { id: 6, name: 'ત્રિકોણ અને તેના ગુણધર્મ', nameEn: 'Triangle and its Properties', desc: 'Geometry' },
    { id: 7, name: 'પરિમાણ', nameEn: 'Perimeter and Area', desc: 'Mensuration' }
  ],
  '7-science': [
    { id: 1, name: 'પોષણ', nameEn: 'Nutrition in Plants', desc: 'Biology' },
    { id: 2, name: 'ઉષ્ણતા', nameEn: 'Heat', desc: 'Physics' },
    { id: 3, name: 'એસિડ, બેઝ અને ક્ષાર', nameEn: 'Acids, Bases and Salts', desc: 'Chemistry' },
    { id: 4, name: 'ભૌતિક અને રાસાયણિક ફેરફાર', nameEn: 'Physical & Chemical Changes', desc: 'Chemistry' },
    { id: 5, name: 'હવામાન, આબોહવા', nameEn: 'Weather, Climate', desc: 'Geography' },
    { id: 6, name: 'પવન, તોફાન અને ચક્રવાત', nameEn: 'Wind, Storms & Cyclones', desc: 'Physics' },
    { id: 7, name: 'માટી', nameEn: 'Soil', desc: 'Geography' },
    { id: 8, name: 'શ્વસન', nameEn: 'Respiration in Organisms', desc: 'Biology' }
  ],
  '7-social': [
    { id: 1, name: 'પ્રાચીન માનવ જીવન', nameEn: 'Ancient Human Life', desc: 'History' },
    { id: 2, name: 'ખેતી, અગ્નિ અને ચક્ર', nameEn: 'Agriculture, Fire and Wheel', desc: 'History' },
    { id: 3, name: 'નવા રાજાઓ અને રાજ્યો', nameEn: 'New Kings and Kingdoms', desc: 'History' },
    { id: 4, name: 'દિલ્લી સલ્તનત', nameEn: 'Delhi Sultanate', desc: 'History' },
    { id: 5, name: 'મુઘલ સામ્રાજ્ય', nameEn: 'Mughal Empire', desc: 'History' },
    { id: 6, name: 'પર્યાવરણ', nameEn: 'Our Environment', desc: 'Geography' }
  ],
  '7-sanskrit': [
    { id: 1, name: 'सुभाषितानि', nameEn: 'Good Sayings', desc: 'पद्यम्' },
    { id: 2, name: 'दुर्बुद्धिः विनश्यति', nameEn: 'Evil Mind Perishes', desc: 'गद्यम्' },
    { id: 3, name: 'स्वावलम्बनम्', nameEn: 'Self-Reliance', desc: 'गद्यम्' },
    { id: 4, name: 'हास्यबालकविसम्मेलनम्', nameEn: 'Comic Poetry Meet', desc: 'पद्यम्' },
    { id: 5, name: 'पण्डिता रमाबाई', nameEn: 'Pandita Ramabai', desc: 'गद्यम्' }
  ],
  // Class 8 chapters
  '8-gujarati': [
    { id: 1, name: 'બોલો કેવું છે', nameEn: 'Say How It Is', desc: 'કવિતા' },
    { id: 2, name: 'સવારનો પ્રકાશ', nameEn: 'Morning Light', desc: 'ગદ્ય' },
    { id: 3, name: 'ગુજરાતી સાહિત્ય', nameEn: 'Gujarati Literature', desc: 'ગદ્ય' },
    { id: 4, name: 'ધરતીનું ગીત', nameEn: 'Song of the Earth', desc: 'કવિતા' },
    { id: 5, name: 'જ્ઞાનનો દીપ', nameEn: 'Lamp of Knowledge', desc: 'ગદ્ય' },
    { id: 6, name: 'સંસ્કૃતિ', nameEn: 'Culture', desc: 'ગદ્ય' },
    { id: 7, name: 'કુટુંબ', nameEn: 'Family', desc: 'વાર્તા' }
  ],
  '8-hindi': [
    { id: 1, name: 'ध्वनि', nameEn: 'Sound', desc: 'कविता' },
    { id: 2, name: 'लाख की चूड़ियाँ', nameEn: 'Lac Bangles', desc: 'कहानी' },
    { id: 3, name: 'बस की यात्रा', nameEn: 'Bus Journey', desc: 'गद्य' },
    { id: 4, name: 'दीवानों की हस्ती', nameEn: 'Ways of the Mad', desc: 'कविता' },
    { id: 5, name: 'चिट्ठियों की अनूठी दुनिया', nameEn: 'The Unique World of Letters', desc: 'गद्य' },
    { id: 6, name: 'भगवान के डाकिये', nameEn: 'God\'s Postmen', desc: 'कविता' }
  ],
  '8-english': [
    { id: 1, name: 'The Best Christmas Present', nameEn: 'The Best Christmas Present', desc: 'Story' },
    { id: 2, name: 'The Tsunami', nameEn: 'The Tsunami', desc: 'Non-Fiction' },
    { id: 3, name: 'Glimpses of the Past', nameEn: 'Glimpses of the Past', desc: 'History' },
    { id: 4, name: 'Bepin Choudhury\'s Lapse of Memory', nameEn: 'Memory Lapse', desc: 'Story' },
    { id: 5, name: 'The Summit Within', nameEn: 'The Summit Within', desc: 'Essay' },
    { id: 6, name: 'This is Jody\'s Fawn', nameEn: 'Jody\'s Fawn', desc: 'Story' }
  ],
  '8-maths': [
    { id: 1, name: 'સંમેય સંખ્યાઓ', nameEn: 'Rational Numbers', desc: 'Numbers' },
    { id: 2, name: 'રેખીય સમીકરણો', nameEn: 'Linear Equations', desc: 'Algebra' },
    { id: 3, name: 'ચતુર્ભુજ', nameEn: 'Understanding Quadrilaterals', desc: 'Geometry' },
    { id: 4, name: 'આંકડાશાસ્ત્ર', nameEn: 'Data Handling', desc: 'Statistics' },
    { id: 5, name: 'વર્ગ અને વર્ગમૂળ', nameEn: 'Squares and Square Roots', desc: 'Numbers' },
    { id: 6, name: 'ઘન અને ઘનમૂળ', nameEn: 'Cubes and Cube Roots', desc: 'Numbers' },
    { id: 7, name: 'જ્યામિતિ', nameEn: 'Practical Geometry', desc: 'Geometry' }
  ],
  '8-science': [
    { id: 1, name: 'પાક ઉત્પાદન', nameEn: 'Crop Production', desc: 'Biology' },
    { id: 2, name: 'સૂક્ષ્મજીવો', nameEn: 'Microorganisms', desc: 'Biology' },
    { id: 3, name: 'કૃત્રિમ તંતુ', nameEn: 'Synthetic Fibres', desc: 'Chemistry' },
    { id: 4, name: 'ધાતુ અને અધાતુ', nameEn: 'Metals and Non-Metals', desc: 'Chemistry' },
    { id: 5, name: 'કોલસો અને પેટ્રોલિયમ', nameEn: 'Coal and Petroleum', desc: 'Chemistry' },
    { id: 6, name: 'દહન અને જ્યોત', nameEn: 'Combustion and Flame', desc: 'Chemistry' },
    { id: 7, name: 'છોડ અને પ્રાણી', nameEn: 'Conservation of Plants', desc: 'Biology' },
    { id: 8, name: 'કોષ', nameEn: 'Cell – Structure & Functions', desc: 'Biology' }
  ],
  '8-social': [
    { id: 1, name: 'ભારતમાં બ્રિટિશ શાસન', nameEn: 'British Rule in India', desc: 'History' },
    { id: 2, name: 'ભારતીય બંધારણ', nameEn: 'Indian Constitution', desc: 'Civics' },
    { id: 3, name: 'ખનીજ સંસાધન', nameEn: 'Mineral Resources', desc: 'Geography' },
    { id: 4, name: 'ઉદ્યોગો', nameEn: 'Industries', desc: 'Geography' },
    { id: 5, name: 'ન્યાયતંત્ર', nameEn: 'Judiciary', desc: 'Civics' },
    { id: 6, name: 'ભારતની સંસ્કૃતિ', nameEn: 'Indian Culture', desc: 'History' }
  ],
  '8-sanskrit': [
    { id: 1, name: 'सूक्तिमौक्तिकम्', nameEn: 'Pearl of Good Sayings', desc: 'पद्यम्' },
    { id: 2, name: 'बिलस्य वाणी न कदापि', nameEn: 'Never the Voice of a Hole', desc: 'गद्यम्' },
    { id: 3, name: 'डिजीभारतम्', nameEn: 'Digital India', desc: 'गद्यम्' },
    { id: 4, name: 'सदैव पुरतो निधेहि चरणम्', nameEn: 'Always Step Forward', desc: 'पद्यम्' },
    { id: 5, name: 'कण्टकेनैव कण्टकम्', nameEn: 'Thorn Removes Thorn', desc: 'गद्यम्' }
  ],
  // Class 9
  '9-gujarati': [
    { id: 1, name: 'કવિ અને કવિતા', nameEn: 'Poet and Poetry', desc: 'કવિતા' },
    { id: 2, name: 'ગુજરાતનો મહિમા', nameEn: 'Glory of Gujarat', desc: 'ગદ્ય' },
    { id: 3, name: 'સપનાની સૃષ્ટિ', nameEn: 'World of Dreams', desc: 'ગદ્ય' },
    { id: 4, name: 'માતૃભૂમિ', nameEn: 'Motherland', desc: 'કવિતા' },
    { id: 5, name: 'જીવન સંદેશ', nameEn: 'Life\'s Message', desc: 'ગદ્ય' },
    { id: 6, name: 'ભારત-ભૂમિ', nameEn: 'Land of India', desc: 'કવિતા' }
  ],
  '9-hindi': [
    { id: 1, name: 'दो बैलों की कथा', nameEn: 'Tale of Two Oxen', desc: 'कहानी' },
    { id: 2, name: 'ल्हासा की ओर', nameEn: 'Towards Lhasa', desc: 'गद्य' },
    { id: 3, name: 'उपभोक्तावाद की संस्कृति', nameEn: 'Culture of Consumerism', desc: 'गद्य' },
    { id: 4, name: 'साँवले सपनों की याद', nameEn: 'Memory of Dark Dreams', desc: 'गद्य' },
    { id: 5, name: 'नाना साहब की पुत्री', nameEn: 'Nana Sahab\'s Daughter', desc: 'गद्य' },
    { id: 6, name: 'प्रेमचंद के फटे जूते', nameEn: 'Premchand\'s Torn Shoes', desc: 'गद्य' }
  ],
  '9-english': [
    { id: 1, name: 'The Fun They Had', nameEn: 'The Fun They Had', desc: 'Story' },
    { id: 2, name: 'The Sound of Music', nameEn: 'The Sound of Music', desc: 'Biography' },
    { id: 3, name: 'The Little Girl', nameEn: 'The Little Girl', desc: 'Story' },
    { id: 4, name: 'A Truly Beautiful Mind', nameEn: 'A Truly Beautiful Mind', desc: 'Biography' },
    { id: 5, name: 'The Snake and the Mirror', nameEn: 'The Snake and the Mirror', desc: 'Story' },
    { id: 6, name: 'My Childhood', nameEn: 'My Childhood', desc: 'Autobiography' }
  ],
  '9-maths': [
    { id: 1, name: 'સંખ્યા પદ્ધતિ', nameEn: 'Number Systems', desc: 'Numbers' },
    { id: 2, name: 'બહુપદી', nameEn: 'Polynomials', desc: 'Algebra' },
    { id: 3, name: 'નિર્દેશાંક ભૂમિતિ', nameEn: 'Coordinate Geometry', desc: 'Geometry' },
    { id: 4, name: 'રેખીય સમીકરણો', nameEn: 'Linear Equations in Two Variables', desc: 'Algebra' },
    { id: 5, name: 'યુક્લિડની ભૂમિતિ', nameEn: 'Euclid\'s Geometry', desc: 'Geometry' },
    { id: 6, name: 'રેખાઓ અને ખૂણાઓ', nameEn: 'Lines and Angles', desc: 'Geometry' },
    { id: 7, name: 'ત્રિકોણ', nameEn: 'Triangles', desc: 'Geometry' },
    { id: 8, name: 'ચતુર્ભુજ', nameEn: 'Quadrilaterals', desc: 'Geometry' }
  ],
  '9-science': [
    { id: 1, name: 'આપણી આજુબાજુના દ્રવ્ય', nameEn: 'Matter in Our Surroundings', desc: 'Chemistry' },
    { id: 2, name: 'શુદ્ધ પદાર્થ', nameEn: 'Is Matter Around Us Pure', desc: 'Chemistry' },
    { id: 3, name: 'અણુ અને પરમાણુ', nameEn: 'Atoms and Molecules', desc: 'Chemistry' },
    { id: 4, name: 'જીવનનું મૂળભૂત એકમ', nameEn: 'The Fundamental Unit of Life', desc: 'Biology' },
    { id: 5, name: 'પેશીઓ', nameEn: 'Tissues', desc: 'Biology' },
    { id: 6, name: 'ગતિ', nameEn: 'Motion', desc: 'Physics' },
    { id: 7, name: 'બળ અને ગતિના નિયમો', nameEn: 'Force and Laws of Motion', desc: 'Physics' },
    { id: 8, name: 'ગુરુત્વાકર્ષણ', nameEn: 'Gravitation', desc: 'Physics' }
  ],
  '9-social': [
    { id: 1, name: 'ફ્રાંસની ક્રાંતિ', nameEn: 'French Revolution', desc: 'History' },
    { id: 2, name: 'રશિયાની ક્રાંતિ', nameEn: 'Russian Revolution', desc: 'History' },
    { id: 3, name: 'ભારતનું ભૌગોલિક સ્થાન', nameEn: 'India – Size and Location', desc: 'Geography' },
    { id: 4, name: 'ભૌતિક લક્ષણો', nameEn: 'Physical Features of India', desc: 'Geography' },
    { id: 5, name: 'લોકશાહી', nameEn: 'What is Democracy?', desc: 'Civics' },
    { id: 6, name: 'ચૂંટણી', nameEn: 'Electoral Politics', desc: 'Civics' }
  ],
  '9-sanskrit': [
    { id: 1, name: 'भारतीवसन्तगीतिः', nameEn: 'Song of Indian Spring', desc: 'पद्यम्' },
    { id: 2, name: 'स्वर्णकाकः', nameEn: 'The Golden Crow', desc: 'गद्यम्' },
    { id: 3, name: 'गोदोहनम्', nameEn: 'Milking the Cow', desc: 'नाटकम्' },
    { id: 4, name: 'कल्पतरोः', nameEn: 'The Wish-Fulfilling Tree', desc: 'पद्यम्' },
    { id: 5, name: 'सूक्तिमौक्तिकम्', nameEn: 'Pearls of Wisdom', desc: 'पद्यम्' }
  ],
  // Class 10
  '10-gujarati': [
    { id: 1, name: 'પર્વત તારા', nameEn: 'Mountain Stars', desc: 'કવિતા' },
    { id: 2, name: 'વાર્તા કળા', nameEn: 'Art of Storytelling', desc: 'ગદ્ય' },
    { id: 3, name: 'નવલકથા', nameEn: 'Novel', desc: 'ગદ્ય' },
    { id: 4, name: 'જીવનનું સંગીત', nameEn: 'Music of Life', desc: 'કવિતા' },
    { id: 5, name: 'ગાંધીજી', nameEn: 'Gandhiji', desc: 'ગદ્ય' },
    { id: 6, name: 'સ્વતંત્રતા સંગ્રામ', nameEn: 'Freedom Struggle', desc: 'ગદ્ય' }
  ],
  '10-hindi': [
    { id: 1, name: 'बड़े भाई साहब', nameEn: 'Elder Brother', desc: 'कहानी' },
    { id: 2, name: 'डायरी का एक पन्ना', nameEn: 'A Page from the Diary', desc: 'गद्य' },
    { id: 3, name: 'तताँरा-वामीरो कथा', nameEn: 'Tatara-Vamiro Tale', desc: 'कहानी' },
    { id: 4, name: 'एही ठैयाँ झुलनी हेरानी हो रामा', nameEn: 'Lost Swing', desc: 'गद्य' },
    { id: 5, name: 'मैं क्यों लिखता हूँ', nameEn: 'Why I Write', desc: 'गद्य' },
    { id: 6, name: 'लेखनी कला', nameEn: 'Art of Writing', desc: 'गद्य' }
  ],
  '10-english': [
    { id: 1, name: 'A Letter to God', nameEn: 'A Letter to God', desc: 'Story' },
    { id: 2, name: 'Nelson Mandela', nameEn: 'Nelson Mandela: Long Walk to Freedom', desc: 'Biography' },
    { id: 3, name: 'Two Stories about Flying', nameEn: 'Two Stories about Flying', desc: 'Story' },
    { id: 4, name: 'From the Diary of Anne Frank', nameEn: 'Anne Frank\'s Diary', desc: 'Diary' },
    { id: 5, name: 'The Hundred Dresses', nameEn: 'The Hundred Dresses – I', desc: 'Story' },
    { id: 6, name: 'The Hundred Dresses II', nameEn: 'The Hundred Dresses – II', desc: 'Story' }
  ],
  '10-maths': [
    { id: 1, name: 'વાસ્તવિક સંખ્યાઓ', nameEn: 'Real Numbers', desc: 'Numbers' },
    { id: 2, name: 'બહુપદી', nameEn: 'Polynomials', desc: 'Algebra' },
    { id: 3, name: 'રેખીય સમીકરણ યુગ્મ', nameEn: 'Pair of Linear Equations', desc: 'Algebra' },
    { id: 4, name: 'દ્વિઘાત સમીકરણ', nameEn: 'Quadratic Equations', desc: 'Algebra' },
    { id: 5, name: 'સમાંતર શ્રેણી', nameEn: 'Arithmetic Progressions', desc: 'Algebra' },
    { id: 6, name: 'ત્રિકોણ', nameEn: 'Triangles', desc: 'Geometry' },
    { id: 7, name: 'નિર્દેશાંક ભૂમિતિ', nameEn: 'Coordinate Geometry', desc: 'Geometry' },
    { id: 8, name: 'ત્રિકોણમિતિ', nameEn: 'Trigonometry', desc: 'Trigonometry' }
  ],
  '10-science': [
    { id: 1, name: 'રાસાયણિક પ્રક્રિયાઓ', nameEn: 'Chemical Reactions & Equations', desc: 'Chemistry' },
    { id: 2, name: 'એસિડ, બેઝ અને ક્ષાર', nameEn: 'Acids, Bases and Salts', desc: 'Chemistry' },
    { id: 3, name: 'ધાતુ અને અધાતુ', nameEn: 'Metals and Non-metals', desc: 'Chemistry' },
    { id: 4, name: 'કાર્બન અને તેના સંયોજનો', nameEn: 'Carbon and its Compounds', desc: 'Chemistry' },
    { id: 5, name: 'જીવન પ્રક્રિયાઓ', nameEn: 'Life Processes', desc: 'Biology' },
    { id: 6, name: 'નિયંત્રણ અને સંકલન', nameEn: 'Control and Coordination', desc: 'Biology' },
    { id: 7, name: 'પ્રકાશ – પ્રતિબિંબ', nameEn: 'Light – Reflection & Refraction', desc: 'Physics' },
    { id: 8, name: 'વિદ્યુત', nameEn: 'Electricity', desc: 'Physics' }
  ],
  '10-social': [
    { id: 1, name: 'યુરોપમાં રાષ્ટ્રવાદ', nameEn: 'Rise of Nationalism in Europe', desc: 'History' },
    { id: 2, name: 'ભારતમાં રાષ્ટ્રવાદ', nameEn: 'Nationalism in India', desc: 'History' },
    { id: 3, name: 'સંસાધન અને વિકાસ', nameEn: 'Resources and Development', desc: 'Geography' },
    { id: 4, name: 'કૃષિ', nameEn: 'Agriculture', desc: 'Geography' },
    { id: 5, name: 'સત્તાની વહેંચણી', nameEn: 'Power Sharing', desc: 'Civics' },
    { id: 6, name: 'સંઘવાદ', nameEn: 'Federalism', desc: 'Civics' }
  ],
  '10-sanskrit': [
    { id: 1, name: 'शुचिपर्यावरणम्', nameEn: 'Clean Environment', desc: 'पद्यम्' },
    { id: 2, name: 'बुद्धिर्बलवती सदा', nameEn: 'Wisdom is Always Powerful', desc: 'गद्यम्' },
    { id: 3, name: 'व्यायामः सर्वदा पथ्यः', nameEn: 'Exercise is Always Good', desc: 'गद्यम्' },
    { id: 4, name: 'शिशुलालनम्', nameEn: 'Nurturing a Child', desc: 'नाटकम्' },
    { id: 5, name: 'जननी तुल्यवत्सला', nameEn: 'Mother Loves Equally', desc: 'गद्यम्' }
  ]
};

// Content Data (sample content for chapters)
const contentData = {
  '6-science-1': {
    title: 'આહારના ઘટકો',
    titleEn: 'Components of Food',
    content: `
      <h3>આહારના ઘટકો (Components of Food)</h3>
      <p>આપણા ખોરાકમાં વિવિધ પોષક તત્વો હોય છે જે આપણા શરીરને સ્વસ્થ રાખવા માટે જરૂરી છે.</p>

      <h3>મુખ્ય પોષક તત્વો:</h3>
      <ul>
        <li><strong>કાર્બોહાઇડ્રેટ (Carbohydrates):</strong> શરીરને ઊર્જા પ્રદાન કરે છે. ચોખા, ઘઉં, બટાકા, ખાંડ વગેરેમાં જોવા મળે છે.</li>
        <li><strong>પ્રોટીન (Proteins):</strong> શરીરના વૃદ્ધિ અને સમારકામ માટે જરૂરી. દૂધ, ઈંડા, દાળ, માંસ વગેરેમાં જોવા મળે છે.</li>
        <li><strong>ચરબી (Fats):</strong> ઊર્જા સંગ્રહ કરે છે. ઘી, તેલ, માખણ વગેરેમાં જોવા મળે છે.</li>
        <li><strong>વિટામિન (Vitamins):</strong> શરીરને રોગો સામે રક્ષણ આપે છે.
          <ul>
            <li>વિટામિન A - ગાજર, પપૈયા</li>
            <li>વિટામિન B - આખું અનાજ</li>
            <li>વિટામિન C - લીંબુ, સંતરા</li>
            <li>વિટામિન D - સૂર્યપ્રકાશ</li>
          </ul>
        </li>
        <li><strong>ખનિજ ક્ષાર (Minerals):</strong> હાડકાં અને દાંત મજબૂત બનાવે છે.</li>
        <li><strong>પાણી (Water):</strong> શરીરના તમામ કાર્યો માટે જરૂરી છે.</li>
      </ul>

      <h3>સંતુલિત આહાર (Balanced Diet)</h3>
      <p>સંતુલિત આહાર એ છે જેમાં બધા જ પોષક તત્વો યોગ્ય પ્રમાણમાં હોય. દૈનિક આહારમાં અનાજ, દાળ, શાકભાજી, ફળ, દૂધ અને પાણી પૂરતા પ્રમાણમાં લેવા જોઈએ.</p>

      <h3>કુપોષણ (Malnutrition)</h3>
      <p>જ્યારે શરીરને જરૂરી પોષક તત્વો ન મળે ત્યારે કુપોષણ થાય છે. આનાથી વિવિધ રોગો થઈ શકે છે.</p>
    `,
    quiz: [
      {
        question: 'શરીરને ઊર્જા કયું પોષક તત્વ આપે છે?',
        options: ['પ્રોટીન', 'કાર્બોહાઇડ્રેટ', 'વિટામિન', 'ખનિજ ક્ષાર'],
        correct: 1
      },
      {
        question: 'વિટામિન C કયા ફળમાં મળે છે?',
        options: ['કેળા', 'સફરજન', 'લીંબુ', 'દ્રાક્ષ'],
        correct: 2
      },
      {
        question: 'પ્રોટીન શરીરમાં શું કરે છે?',
        options: ['ઊર્જા આપે છે', 'વૃદ્ધિ અને સમારકામ', 'ચરબી સંગ્રહ', 'પાણી સંતુલન'],
        correct: 1
      }
    ]
  },
  '7-social-1': {
    title: 'પ્રાચીન માનવ જીવન',
    titleEn: 'Ancient Human Life',
    content: `
      <h3>પ્રાચીન માનવ જીવન: ખેતી, અગ્નિ અને ચક્ર પહેલાંનું વિશ્વ</h3>
      <p>હજારો વર્ષ પહેલાં, માનવો જંગલોમાં રહેતા હતા. તેઓ શિકાર કરીને અને ફળ-ફૂલ ભેગા કરીને જીવન જીવતા હતા.</p>

      <h3>1. ભટકતું જીવન (Nomadic Life)</h3>
      <p>પ્રારંભિક માનવો એક જગ્યાએ ન રહેતા. ખોરાકની શોધમાં તેઓ એક જગ્યાએથી બીજી જગ્યાએ ફરતા રહેતા.</p>

      <h3>2. રહેઠાણ (Shelter)</h3>
      <p>ગુફાઓ અને ઝાડની છાયામાં આશ્રય લેતા. પછીથી ઝૂંપડા બનાવતા શીખ્યા.</p>

      <h3>3. અગ્નિની શોધ (Discovery of Fire)</h3>
      <p>અગ્નિની શોધ માનવ ઇતિહાસની સૌથી મહત્વપૂર્ણ શોધ હતી. આનાથી ખોરાક રાંધવો, ગરમી મેળવવી અને જંગલી પ્રાણીઓથી રક્ષણ શક્ય બન્યું.</p>

      <h3>4. ખેતીની શરૂઆત (Beginning of Agriculture)</h3>
      <p>લગભગ 10,000 વર્ષ પહેલાં માનવોએ ખેતી કરવાનું શીખ્યું. આનાથી તેઓ એક જગ્યાએ વસવાટ કરવા લાગ્યા.</p>

      <h3>5. ચક્રની શોધ (Invention of the Wheel)</h3>
      <p>ચક્રની શોધે પરિવહન અને ઉત્પાદનમાં ક્રાંતિ લાવી.</p>
    `,
    quiz: [
      {
        question: 'પ્રારંભિક માનવો કેવી રીતે જીવતા હતા?',
        options: ['ખેતી કરીને', 'શિકાર અને ભેગું કરીને', 'વેપાર કરીને', 'ઉદ્યોગ ચલાવીને'],
        correct: 1
      },
      {
        question: 'ખેતીની શરૂઆત ક્યારે થઈ?',
        options: ['1,000 વર્ષ પહેલાં', '5,000 વર્ષ પહેલાં', '10,000 વર્ષ પહેલાં', '100 વર્ષ પહેલાં'],
        correct: 2
      }
    ]
  }
};

// Generate default content for chapters without specific content
function getDefaultContent(classId, subjectId, chapterId) {
  const key = `${classId}-${subjectId}-${chapterId}`;
  if (contentData[key]) return contentData[key];

  const allChapters = getActiveChapterData();
  const chapters = allChapters[`${classId}-${subjectId}`];
  if (!chapters) return null;
  const chapter = chapters.find(c => c.id === parseInt(chapterId));
  if (!chapter) return null;

  if (currentBoard === 'cbse') {
    return {
      title: chapter.name,
      titleEn: chapter.nameEn,
      content: `
        <h3>${chapter.name} (${chapter.nameEn})</h3>
        <p>In this chapter, we will study ${chapter.nameEn} in detail as per NCERT/CBSE syllabus.</p>

        <h3>Introduction</h3>
        <p>This chapter belongs to the ${chapter.desc} section. Here we will understand the fundamental concepts and principles.</p>

        <h3>Key Points</h3>
        <ul>
          <li>Fundamental concepts of ${chapter.nameEn}</li>
          <li>Practical examples and applications</li>
          <li>Important definitions and terms</li>
          <li>Practice questions for board exams</li>
        </ul>

        <h3>Summary</h3>
        <p>In this chapter we learned the key concepts of ${chapter.nameEn}. Practice regularly and test your knowledge with quizzes.</p>
      `,
      quiz: [
        {
          question: `What is the main topic of the chapter "${chapter.nameEn}"?`,
          options: [chapter.desc, 'Mathematics', 'Sports', 'Music'],
          correct: 0
        },
        {
          question: 'This chapter is from which class?',
          options: [`Class ${parseInt(classId) - 1}`, `Class ${classId}`, `Class ${parseInt(classId) + 1}`, `Class ${parseInt(classId) + 2}`],
          correct: 1
        }
      ]
    };
  }

  return {
    title: chapter.name,
    titleEn: chapter.nameEn,
    content: `
      <h3>${chapter.name} (${chapter.nameEn})</h3>
      <p>\u0A86 \u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3\u0AAE\u0ABE\u0A82 \u0A86\u0AAA\u0AA3\u0AC7 ${chapter.nameEn} \u0AB5\u0ABF\u0AB6\u0AC7 \u0AB5\u0ABF\u0A97\u0AA4\u0AB5\u0ABE\u0AB0 \u0A85\u0AAD\u0ACD\u0AAF\u0ABE\u0AB8 \u0A95\u0AB0\u0AC0\u0AB6\u0AC1\u0A82.</p>

      <h3>\u0AAA\u0AB0\u0ABF\u0A9A\u0AAF (Introduction)</h3>
      <p>\u0A86 \u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3 ${chapter.desc} \u0AB5\u0ABF\u0AAD\u0ABE\u0A97\u0AA8\u0ACB \u0AAD\u0ABE\u0A97 \u0A9B\u0AC7. \u0A85\u0AB9\u0AC0\u0A82 \u0A86\u0AAA\u0AA3\u0AC7 \u0AAE\u0AC2\u0AB3\u0AAD\u0AC2\u0AA4 \u0A96\u0ACD\u0AAF\u0ABE\u0AB2\u0ACB \u0A85\u0AA8\u0AC7 \u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0AA4\u0ACB \u0AB8\u0AAE\u0A9C\u0AC0\u0AB6\u0AC1\u0A82.</p>

      <h3>\u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AAE\u0AC1\u0AA6\u0ACD\u0AA6\u0ABE\u0A93 (Key Points)</h3>
      <ul>
        <li>${chapter.nameEn} \u0AA8\u0ABE \u0AAE\u0AC2\u0AB3\u0AAD\u0AC2\u0AA4 \u0AB8\u0ABF\u0AA6\u0ACD\u0AA7\u0ABE\u0A82\u0AA4\u0ACB</li>
        <li>\u0AB5\u0ACD\u0AAF\u0AB5\u0AB9\u0ABE\u0AB0\u0ABF\u0A95 \u0A89\u0AA6\u0ABE\u0AB9\u0AB0\u0AA3\u0ACB</li>
        <li>\u0AAE\u0AB9\u0AA4\u0ACD\u0AB5\u0AAA\u0AC2\u0AB0\u0ACD\u0AA3 \u0AAA\u0AB0\u0ABF\u0AAD\u0ABE\u0AB7\u0ABE\u0A93</li>
        <li>\u0A85\u0AAD\u0ACD\u0AAF\u0ABE\u0AB8 \u0AAA\u0ACD\u0AB0\u0AB6\u0ACD\u0AA8\u0ACB</li>
      </ul>

      <h3>\u0AB8\u0ABE\u0AB0\u0ABE\u0A82\u0AB6 (Summary)</h3>
      <p>\u0A86 \u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3\u0AAE\u0ABE\u0A82 \u0A86\u0AAA\u0AA3\u0AC7 ${chapter.nameEn} \u0AA8\u0ABE \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0A96\u0ACD\u0AAF\u0ABE\u0AB2\u0ACB \u0AB6\u0AC0\u0A96\u0ACD\u0AAF\u0ABE. \u0AA8\u0ABF\u0AAF\u0AAE\u0ABF\u0AA4 \u0A85\u0AAD\u0ACD\u0AAF\u0ABE\u0AB8 \u0A95\u0AB0\u0ACB \u0A85\u0AA8\u0AC7 \u0A95\u0ACD\u0AB5\u0ABF\u0A9D \u0AA6\u0ACD\u0AB5\u0ABE\u0AB0\u0ABE \u0AAA\u0ACB\u0AA4\u0ABE\u0AA8\u0AC1\u0A82 \u0A9C\u0ACD\u0A9E\u0ABE\u0AA8 \u0A9A\u0A95\u0ABE\u0AB8\u0ACB.</p>
    `,
    quiz: [
      {
        question: `${chapter.nameEn} \u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3\u0AA8\u0ACB \u0AAE\u0AC1\u0A96\u0ACD\u0AAF \u0AB5\u0ABF\u0AB7\u0AAF \u0AB6\u0AC1\u0A82 \u0A9B\u0AC7?`,
        options: [chapter.desc, '\u0A97\u0AA3\u0ABF\u0AA4', '\u0A96\u0AC7\u0AB2', '\u0AB8\u0A82\u0A97\u0AC0\u0AA4'],
        correct: 0
      },
      {
        question: '\u0A86 \u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3 \u0A95\u0AAF\u0ABE \u0AA7\u0ACB\u0AB0\u0AA3\u0AAE\u0ABE\u0A82 \u0A86\u0AB5\u0AC7 \u0A9B\u0AC7?',
        options: [`\u0AA7\u0ACB\u0AB0\u0AA3 ${parseInt(classId) - 1}`, `\u0AA7\u0ACB\u0AB0\u0AA3 ${classId}`, `\u0AA7\u0ACB\u0AB0\u0AA3 ${parseInt(classId) + 1}`, `\u0AA7\u0ACB\u0AB0\u0AA3 ${parseInt(classId) + 2}`],
        correct: 1
      }
    ]
  };
}

// ========== BOARD SELECTION ==========
let currentBoard = localStorage.getItem('selectedBoard') || 'gseb';

function selectBoard(board) {
  currentBoard = board;
  localStorage.setItem('selectedBoard', board);
  renderClassGrid();
  // Update section title
  const title = document.getElementById('class-section-title');
  const sub = document.getElementById('class-section-sub');
  if (title) title.textContent = board === 'cbse' ? 'Select Class (CBSE) \u{1F4DA}' : '\u0AA7\u0ACB\u0AB0\u0AA3 \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (GSEB) \u{1F4DA}';
  if (sub) sub.textContent = board === 'cbse' ? 'NCERT Syllabus - Classes 6 to 10' : 'Gujarat Board - Classes 6 to 10';
  // Highlight active board
  document.querySelectorAll('.board-card').forEach(c => c.classList.remove('active-board'));
  const activeCard = document.querySelector(`.${board}-board`);
  if (activeCard) activeCard.classList.add('active-board');
}

function getActiveClassData() {
  if (currentBoard === 'cbse' && typeof cbseClassData !== 'undefined') return cbseClassData;
  return classData;
}

function getActiveSubjectData() {
  if (currentBoard === 'cbse' && typeof cbseSubjectData !== 'undefined') return cbseSubjectData;
  return subjectData;
}

function getActiveChapterData() {
  if (currentBoard === 'cbse' && typeof cbseChapterData !== 'undefined') return cbseChapterData;
  return chapterData;
}

// ========== NAVIGATION ==========
function toggleMobileMenu() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('active');
}

// ========== TOAST NOTIFICATION ==========
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ========== QUIZ LOGIC ==========
let currentQuiz = null;
let currentQuestionIndex = 0;
let score = 0;

function startQuiz(quizData) {
  currentQuiz = quizData;
  currentQuestionIndex = 0;
  score = 0;
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container || !currentQuiz) return;

  if (currentQuestionIndex >= currentQuiz.length) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px;">
        <h2 style="color: var(--accent-green); margin-bottom: 15px;">ક્વિઝ પૂર્ણ!</h2>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">તમારો સ્કોર: <strong>${score}/${currentQuiz.length}</strong></p>
        <p style="color: var(--text-light);">${score === currentQuiz.length ? 'ઉત્તમ! બધા જવાબ સાચા!' : 'સારું! ફરીથી પ્રયત્ન કરો.'}</p>
        <button class="btn btn-primary" onclick="startQuiz(currentQuiz)" style="margin-top:20px;">ફરીથી પ્રયત્ન કરો</button>
      </div>
    `;
    return;
  }

  const q = currentQuiz[currentQuestionIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  container.innerHTML = `
    <div class="quiz-question">
      <span style="color:var(--primary);font-weight:700;">પ્રશ્ન ${currentQuestionIndex + 1}/${currentQuiz.length}</span>
      <p style="margin-top:10px;font-size:1.1rem;">${q.question}</p>
    </div>
    <div class="quiz-options">
      ${q.options.map((opt, i) => `
        <div class="quiz-option" onclick="selectOption(this, ${i}, ${q.correct})">
          <span class="option-letter">${optionLetters[i]}</span>
          <span>${opt}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function selectOption(el, selected, correct) {
  const options = el.parentElement.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    opt.onclick = null;
    if (i === correct) opt.classList.add('correct');
    if (i === selected && selected !== correct) opt.classList.add('wrong');
    opt.classList.add('selected');
  });

  if (selected === correct) score++;

  setTimeout(() => {
    currentQuestionIndex++;
    renderQuiz();
  }, 1500);
}

// ========== AUTH ==========
function handleLogin(e) {
  e.preventDefault();
  showToast('લોગિન સફળ! Welcome back!');
  setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  return false;
}

function handleRegister(e) {
  e.preventDefault();
  showToast('રજીસ્ટ્રેશન સફળ! Please login.');
  setTimeout(() => { window.location.href = 'pages/login.html'; }, 1500);
  return false;
}

// ========== CONTACT FORM ==========
function handleContact(e) {
  e.preventDefault();
  showToast('મેસેજ મોકલવામાં આવ્યો! અમે જલ્દી જ સંપર્ક કરીશું.');
  e.target.reset();
  return false;
}

// ========== DYNAMIC PAGE RENDERING ==========
function getParams() {
  const params = new URLSearchParams(window.location.search);
  const board = params.get('board') || localStorage.getItem('selectedBoard') || 'gseb';
  currentBoard = board;
  localStorage.setItem('selectedBoard', board);
  return {
    classId: params.get('class'),
    subject: params.get('subject'),
    chapter: params.get('chapter'),
    board: board
  };
}

function renderClassGrid() {
  const grid = document.getElementById('class-grid');
  if (!grid) return;

  const classes = getActiveClassData();
  grid.innerHTML = classes.map(cls => `
    <a href="pages/subjects.html?class=${cls.id}&board=${currentBoard}" class="class-card ${cls.gradient} fade-in">
      <div class="class-number">${cls.id}</div>
      <div class="class-label">${cls.name}</div>
    </a>
  `).join('');
}

function renderSubjects() {
  const grid = document.getElementById('subject-grid');
  const params = getParams();
  if (!grid || !params.classId) return;

  const allSubjects = getActiveSubjectData();
  const allClasses = getActiveClassData();
  const subjects = allSubjects[params.classId] || [];
  const cls = allClasses.find(c => c.id === parseInt(params.classId));

  // Update page title
  const title = document.getElementById('page-title');
  if (title) {
    const boardLabel = params.board === 'cbse' ? 'CBSE' : 'GSEB';
    title.textContent = params.board === 'cbse' ? `Select Subject - ${cls ? cls.nameEn : ''} (${boardLabel})` : `\u0AB5\u0ABF\u0AB7\u0AAF \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB - ${cls ? cls.name : ''}`;
  }

  // Update sidebar
  const badgeNum = document.getElementById('badge-num');
  const badgeText = document.getElementById('badge-text');
  if (badgeNum) badgeNum.textContent = params.classId;
  if (badgeText) badgeText.innerHTML = `<strong>${cls ? cls.name || cls.nameEn : ''}</strong>Select Subject`;

  grid.innerHTML = subjects.map(sub => `
    <a href="chapters.html?class=${params.classId}&subject=${sub.id}&board=${params.board}" class="subject-card ${sub.bg} fade-in">
      <div class="subject-icon">${sub.icon}</div>
      <div class="subject-name">${sub.name}</div>
    </a>
  `).join('');
}

function renderChapters() {
  const list = document.getElementById('chapter-list');
  const params = getParams();
  if (!list || !params.classId || !params.subject) return;

  const key = `${params.classId}-${params.subject}`;
  const allChapters = getActiveChapterData();
  const allClasses = getActiveClassData();
  const allSubjects = getActiveSubjectData();
  const chapters = allChapters[key] || [];
  const cls = allClasses.find(c => c.id === parseInt(params.classId));
  const subjects = allSubjects[params.classId] || [];
  const sub = subjects.find(s => s.id === params.subject);

  // Update page elements
  const title = document.getElementById('page-title');
  if (title) {
    title.textContent = params.board === 'cbse' ? `Select Chapter - ${sub ? sub.nameEn : ''}` : `\u0AAA\u0ACD\u0AB0\u0A95\u0AB0\u0AA3 \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB - ${sub ? sub.name : ''}`;
  }

  const badgeNum = document.getElementById('badge-num');
  const badgeText = document.getElementById('badge-text');
  if (badgeNum) badgeNum.textContent = params.classId;
  if (badgeText) badgeText.innerHTML = `<strong>${sub ? sub.name || sub.nameEn : ''}</strong>${cls ? cls.name || cls.nameEn : ''}`;

  const breadcrumb = document.getElementById('breadcrumb-subject');
  if (breadcrumb) breadcrumb.textContent = sub ? sub.name || sub.nameEn : '';

  list.innerHTML = chapters.map(ch => `
    <a href="content.html?class=${params.classId}&subject=${params.subject}&chapter=${ch.id}&board=${params.board}" class="chapter-item fade-in">
      <div class="chapter-number">${ch.id}</div>
      <div class="chapter-info">
        <h3>${ch.name}</h3>
        <p>${ch.nameEn} \u2022 ${ch.desc}</p>
      </div>
      <div class="chapter-play">&#9654;</div>
    </a>
  `).join('');
}

function renderContent() {
  const viewer = document.getElementById('content-viewer');
  const params = getParams();
  if (!viewer || !params.classId || !params.subject || !params.chapter) return;

  const content = getDefaultContent(params.classId, params.subject, params.chapter);
  if (!content) {
    viewer.innerHTML = '<p>Content not found.</p>';
    return;
  }

  // Update title
  const title = document.getElementById('content-title');
  if (title) title.textContent = content.title;

  const titleEn = document.getElementById('content-title-en');
  if (titleEn) titleEn.textContent = content.titleEn;

  // Update breadcrumbs
  const allSubjects = getActiveSubjectData();
  const subjects = allSubjects[params.classId] || [];
  const sub = subjects.find(s => s.id === params.subject);
  const bcSubject = document.getElementById('breadcrumb-subject');
  if (bcSubject) bcSubject.textContent = sub ? sub.name || sub.nameEn : '';
  const bcChapter = document.getElementById('breadcrumb-chapter');
  if (bcChapter) bcChapter.textContent = content.title;

  // Render content body
  const body = document.getElementById('content-body');
  if (body) body.innerHTML = content.content;

  // Setup quiz
  if (content.quiz) {
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      startQuiz(content.quiz);
    }
  }
}

// Tab switching for content/interactive
function switchTab(tab) {
  document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');

  if (tab === 'content') {
    document.getElementById('tab-content-btn').classList.add('active');
    document.getElementById('tab-content').style.display = 'block';
  } else {
    document.getElementById('tab-interactive-btn').classList.add('active');
    document.getElementById('tab-interactive').style.display = 'block';
  }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  // Init board from URL or localStorage
  const urlBoard = new URLSearchParams(window.location.search).get('board');
  if (urlBoard) {
    currentBoard = urlBoard;
    localStorage.setItem('selectedBoard', urlBoard);
  }
  // Highlight active board on home page
  const activeCard = document.querySelector(`.${currentBoard}-board`);
  if (activeCard) activeCard.classList.add('active-board');
  // Update class section title
  const csTitle = document.getElementById('class-section-title');
  const csSub = document.getElementById('class-section-sub');
  if (csTitle) csTitle.textContent = currentBoard === 'cbse' ? 'Select Class (CBSE) \u{1F4DA}' : '\u0AA7\u0ACB\u0AB0\u0AA3 \u0AAA\u0AB8\u0A82\u0AA6 \u0A95\u0AB0\u0ACB (GSEB) \u{1F4DA}';
  if (csSub) csSub.textContent = currentBoard === 'cbse' ? 'NCERT Syllabus - Classes 6 to 10' : 'Gujarat Board - Classes 6 to 10';

  renderClassGrid();
  renderSubjects();
  renderChapters();
  renderContent();
});
