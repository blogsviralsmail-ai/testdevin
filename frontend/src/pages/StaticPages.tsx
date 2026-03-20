import { Helmet } from "react-helmet-async";

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>हमारे बारे में - About Us | आभूषण बाज़ार</title>
        <meta name="description" content="आभूषण बाज़ार भारत का प्रमुख ज्वेलरी डिज़ाइन पोर्टल है। नवीनतम सोने-चांदी के भाव, ज्वेलरी डिज़ाइन और खरीदारी गाइड।" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">हमारे बारे में / About Us</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p><strong>आभूषण बाज़ार (Aabhooshan Bazaar)</strong> भारत का प्रमुख ज्वेलरी डिज़ाइन और गोल्ड रेट इनफार्मेशन पोर्टल है। हमारा उद्देश्य आपको नवीनतम ज्वेलरी डिज़ाइन, सोने-चांदी के भाव और ज्वेलरी से जुड़ी सभी जानकारी एक ही जगह उपलब्ध कराना है।</p>
          <p><strong>Aabhooshan Bazaar</strong> is India's leading jewellery design and gold rate information portal. Our mission is to provide you with the latest jewellery designs, gold and silver rates, and all jewellery-related information in one place.</p>

          <h2>हमारा मिशन / Our Mission</h2>
          <p>हमारा मिशन है भारतीय उपभोक्ताओं को सोने-चांदी की खरीदारी में सही फैसला लेने में मदद करना। हम विश्वसनीय जानकारी, नवीनतम डिज़ाइन और बाज़ार के रुझान प्रदान करते हैं।</p>
          <p>Our mission is to help Indian consumers make informed decisions when buying gold and silver jewellery. We provide reliable information, latest designs, and market trends.</p>

          <h2>हमारी सेवाएं / Our Services</h2>
          <ul>
            <li><strong>दैनिक सोने और चांदी के भाव (Daily Gold & Silver Rates):</strong> हम रोज़ाना अपडेटेड सोने और चांदी के भाव प्रदान करते हैं ताकि आप सही समय पर खरीदारी का फैसला ले सकें।</li>
            <li><strong>नवीनतम ज्वेलरी डिज़ाइन कलेक्शन (Latest Jewellery Designs):</strong> मंगलसूत्र, बालियां, अंगूठी, नेकलेस, कंगन, मांग टीका, पायल, ब्राइडल सेट और भी कई कैटेगरी में सैकड़ों डिज़ाइन।</li>
            <li><strong>कीमत और वजन के साथ डिज़ाइन जानकारी (Design Info with Weight & Price):</strong> हर डिज़ाइन के साथ अनुमानित वजन और कीमत की जानकारी।</li>
            <li><strong>ज्वेलरी खरीदने के टिप्स और गाइड (Buying Tips & Guides):</strong> विशेषज्ञ सलाह और गाइड जो आपको सही खरीदारी में मदद करें।</li>
            <li><strong>ब्राइडल ज्वेलरी गाइड (Bridal Jewellery Guide):</strong> शादी के लिए संपूर्ण ज्वेलरी प्लानिंग गाइड।</li>
            <li><strong>निवेश गाइड (Investment Guide):</strong> सोने में निवेश करने के विभिन्न तरीके और सुझाव।</li>
          </ul>

          <h2>हमारी टीम / Our Team</h2>
          <p>हमारी टीम ज्वेलरी उद्योग के अनुभवी पेशेवरों से बनी है जो आपको सर्वोत्तम और सटीक जानकारी प्रदान करने के लिए प्रतिबद्ध हैं। हमारे कंटेंट एक्सपर्ट्स, डिज़ाइन विशेषज्ञ और मार्केट एनालिस्ट मिलकर आपके लिए उपयोगी कंटेंट तैयार करते हैं।</p>
          <p>Our team comprises experienced professionals from the jewellery industry who are committed to providing you with the best and most accurate information. Our content experts, design specialists, and market analysts work together to create useful content for you.</p>

          <h2>संपर्क करें / Contact Us</h2>
          <p>अगर आपके कोई सवाल, सुझाव या फीडबैक हैं तो हमसे संपर्क करें: <strong>info@aabhooshanbazaar.com</strong></p>
          <p>स्थान: जयपुर, राजस्थान, भारत</p>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <Helmet>
        <title>संपर्क करें - Contact Us | आभूषण बाज़ार</title>
        <meta name="description" content="आभूषण बाज़ार से संपर्क करें। ज्वेलरी डिज़ाइन, सोने के भाव या किसी भी प्रश्न के लिए हमें ईमेल करें।" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">संपर्क करें / Contact Us</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>आभूषण बाज़ार से संपर्क करने के लिए नीचे दी गई जानकारी का उपयोग करें। हम आपकी मदद के लिए हमेशा तैयार हैं।</p>
          <p>Feel free to reach out to us using the contact information below. We are always ready to help you.</p>

          <h2>संपर्क जानकारी / Contact Information</h2>
          <ul>
            <li><strong>ईमेल / Email:</strong> info@aabhooshanbazaar.com</li>
            <li><strong>स्थान / Location:</strong> जयपुर, राजस्थान, भारत (Jaipur, Rajasthan, India)</li>
          </ul>

          <h2>हमसे क्यों संपर्क करें / Why Contact Us</h2>
          <ul>
            <li>ज्वेलरी डिज़ाइन से संबंधित प्रश्न (Jewellery design related queries)</li>
            <li>सोने-चांदी के भाव की जानकारी (Gold and silver rate information)</li>
            <li>वेबसाइट पर कोई त्रुटि रिपोर्ट करने के लिए (To report any errors on the website)</li>
            <li>विज्ञापन और सहयोग के लिए (For advertising and collaboration)</li>
            <li>सुझाव और फीडबैक (Suggestions and feedback)</li>
          </ul>

          <h2>प्रतिक्रिया समय / Response Time</h2>
          <p>हम आपके सवालों का जवाब <strong>24-48 घंटों</strong> के भीतर देने का प्रयास करते हैं। कृपया अपने ईमेल में अपना नाम और प्रश्न का विवरण स्पष्ट रूप से लिखें।</p>
          <p>We try to respond to your queries within <strong>24-48 hours</strong>. Please clearly mention your name and details of your query in the email.</p>
        </div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - गोपनीयता नीति | आभूषण बाज़ार</title>
        <meta name="description" content="आभूषण बाज़ार की गोपनीयता नीति। जानें कि हम आपकी व्यक्तिगत जानकारी को कैसे संग्रहीत और सुरक्षित करते हैं।" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy / गोपनीयता नीति</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p><strong>Last updated / अंतिम अपडेट:</strong> March 20, 2026</p>
          <p>At Aabhooshan Bazaar (aabhooshanbazaar.com), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>
          <p>आभूषण बाज़ार (aabhooshanbazaar.com) पर, हम आपकी गोपनीयता का सम्मान करते हैं और आपकी व्यक्तिगत जानकारी की सुरक्षा के लिए प्रतिबद्ध हैं।</p>

          <h2>Information We Collect / हम कौन सी जानकारी एकत्र करते हैं</h2>
          <p>We may collect the following information when you visit our website:</p>
          <ul>
            <li><strong>Browser Information:</strong> Browser type, version, and language preferences</li>
            <li><strong>Device Information:</strong> Operating system, screen resolution, and device type</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on each page, and navigation patterns</li>
            <li><strong>Referring Information:</strong> The website or search engine that directed you to our site</li>
            <li><strong>IP Address:</strong> Your IP address (anonymized for analytics purposes)</li>
            <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
          </ul>

          <h2>How We Use Your Information / हम आपकी जानकारी का उपयोग कैसे करते हैं</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>To improve our website content and user experience</li>
            <li>To analyze website traffic and usage patterns</li>
            <li>To serve relevant advertisements through Google AdSense</li>
            <li>To understand our audience demographics and interests</li>
            <li>To maintain the security and integrity of our website</li>
          </ul>

          <h2>Use of Cookies / कुकीज़ का उपयोग</h2>
          <p>We use cookies and similar technologies for analytics purposes (Google Analytics) and to serve relevant advertisements (Google AdSense). Cookies are small text files stored on your device that help us provide a better browsing experience.</p>
          <p>You can manage cookie preferences through your browser settings. Please note that disabling cookies may affect some features of our website.</p>

          <h2>Third-Party Services / तृतीय-पक्ष सेवाएं</h2>
          <p><strong>Google Analytics:</strong> We use Google Analytics to understand how visitors use our site. Google Analytics uses cookies to collect anonymous data about your visits. For more information, visit Google's Privacy Policy.</p>
          <p><strong>Google AdSense:</strong> We use Google AdSense to display advertisements. AdSense may use cookies and web beacons to serve ads based on your prior visits to our website and other websites. You can opt out of personalized advertising by visiting Google Ads Settings.</p>

          <h2>Data Security / डेटा सुरक्षा</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Our website uses SSL/HTTPS encryption to ensure secure data transmission.</p>

          <h2>Children's Privacy / बच्चों की गोपनीयता</h2>
          <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children.</p>

          <h2>Changes to This Policy / इस नीति में परिवर्तन</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

          <h2>Contact / संपर्क</h2>
          <p>For any privacy-related questions, please contact us at <strong>info@aabhooshanbazaar.com</strong>.</p>
        </div>
      </div>
    </>
  );
}

export function DisclaimerPage() {
  return (
    <>
      <Helmet>
        <title>Disclaimer - अस्वीकरण | आभूषण बाज़ार</title>
        <meta name="description" content="आभूषण बाज़ार का अस्वीकरण। सोने-चांदी के भाव और ज्वेलरी डिज़ाइन की जानकारी केवल संदर्भ के लिए है।" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Disclaimer / अस्वीकरण</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p><strong>Last updated / अंतिम अपडेट:</strong> March 20, 2026</p>
          <p>The information provided on Aabhooshan Bazaar (aabhooshanbazaar.com) is for general informational purposes only. Please read this disclaimer carefully before using our website.</p>
          <p>आभूषण बाज़ार (aabhooshanbazaar.com) पर प्रदान की गई जानकारी केवल सामान्य सूचना उद्देश्यों के लिए है।</p>

          <h2>Gold & Silver Rates / सोने-चांदी के भाव</h2>
          <p>Gold and silver rates displayed on this website are indicative and sourced from various market data providers. These rates may vary from actual market rates and rates offered by individual jewellers. Rates are updated regularly but may not reflect real-time prices at all times. Always verify current rates with your local jeweller or authorized dealer before making any purchase decisions.</p>
          <p>इस वेबसाइट पर प्रदर्शित सोने और चांदी के भाव सांकेतिक हैं। कृपया खरीदारी से पहले अपने स्थानीय ज्वेलर से वर्तमान दरों की पुष्टि करें।</p>

          <h2>Jewellery Designs / ज्वेलरी डिज़ाइन</h2>
          <p>Jewellery designs shown on this website are for reference and inspiration purposes only. Actual designs, weights, dimensions, and prices may vary from what is displayed. We do not sell jewellery directly through this website. Please contact your local jeweller for purchasing. Images shown may differ from actual products.</p>

          <h2>No Financial Advice / कोई वित्तीय सलाह नहीं</h2>
          <p>The content on this website does not constitute financial, investment, or professional advice of any kind. Gold and silver prices are subject to market fluctuations and various economic factors. Any investment decisions should be made after consulting with a qualified financial advisor. Past performance of gold prices does not guarantee future results.</p>

          <h2>Accuracy of Information / जानकारी की सटीकता</h2>
          <p>While we strive to provide accurate and up-to-date information, we make no warranties or representations about the completeness, reliability, or accuracy of the information published on this website. Any reliance you place on such information is strictly at your own risk.</p>

          <h2>External Links / बाहरी लिंक</h2>
          <p>Our website may contain links to external websites that are not operated by us. We have no control over the content, privacy policies, or practices of any third-party websites. We are not responsible for the content or practices of these linked websites.</p>

          <h2>Limitation of Liability / दायित्व की सीमा</h2>
          <p>In no event shall Aabhooshan Bazaar be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of or inability to use this website or the information contained herein.</p>

          <h2>Contact / संपर्क</h2>
          <p>If you have any questions about this Disclaimer, please contact us at <strong>info@aabhooshanbazaar.com</strong>.</p>
        </div>
      </div>
    </>
  );
}

export function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - सेवा की शर्तें | आभूषण बाज़ार</title>
        <meta name="description" content="आभूषण बाज़ार की सेवा की शर्तें। वेबसाइट का उपयोग करने से पहले कृपया इन शर्तों को ध्यान से पढ़ें।" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service / सेवा की शर्तें</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p><strong>Last updated / अंतिम अपडेट:</strong> March 20, 2026</p>
          <p>Welcome to Aabhooshan Bazaar (aabhooshanbazaar.com). By accessing and using this website, you agree to be bound by these Terms of Service.</p>
          <p>आभूषण बाज़ार (aabhooshanbazaar.com) में आपका स्वागत है। इस वेबसाइट का उपयोग करके, आप इन सेवा शर्तों से बाध्य होने के लिए सहमत हैं।</p>

          <h2>Use of Website / वेबसाइट का उपयोग</h2>
          <p>This website is provided for informational purposes only. You may use this website for personal, non-commercial purposes. You agree not to:</p>
          <ul>
            <li>Copy, reproduce, or distribute our content without prior written permission</li>
            <li>Use automated systems or bots to access our website</li>
            <li>Attempt to interfere with the proper functioning of the website</li>
            <li>Use the website for any unlawful or prohibited purpose</li>
            <li>Misrepresent your identity or affiliation with any person or organization</li>
          </ul>

          <h2>Intellectual Property / बौद्धिक संपदा</h2>
          <p>All content on this website, including text, images, graphics, logos, and design elements, is the property of Aabhooshan Bazaar and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without express written permission.</p>

          <h2>User Content / उपयोगकर्ता सामग्री</h2>
          <p>If you submit any content to our website (such as comments or feedback), you grant us a non-exclusive, royalty-free license to use, display, and distribute that content in connection with our services.</p>

          <h2>Disclaimer of Warranties / वारंटी का अस्वीकरण</h2>
          <p>This website is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the website will be uninterrupted, error-free, or free of viruses or other harmful components.</p>

          <h2>Limitation of Liability / दायित्व की सीमा</h2>
          <p>To the fullest extent permitted by law, Aabhooshan Bazaar shall not be liable for any damages arising from the use or inability to use this website, including but not limited to direct, indirect, incidental, punitive, and consequential damages.</p>

          <h2>Third-Party Links / तृतीय-पक्ष लिंक</h2>
          <p>Our website may contain links to third-party websites. These links are provided for your convenience only. We do not endorse or assume responsibility for the content of any linked websites.</p>

          <h2>Governing Law / शासी कानून</h2>
          <p>These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.</p>

          <h2>Changes to Terms / शर्तों में परिवर्तन</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on this page. Your continued use of the website after changes constitutes acceptance of the modified terms.</p>

          <h2>Contact / संपर्क</h2>
          <p>If you have any questions about these Terms of Service, please contact us at <strong>info@aabhooshanbazaar.com</strong>.</p>
        </div>
      </div>
    </>
  );
}
