import { Helmet } from "react-helmet-async";

export function AboutPage() {
  return (
    <>
      <Helmet><title>हमारे बारे में | आभूषण बाज़ार</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">हमारे बारे में</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p><strong>आभूषण बाज़ार (Aabhooshan Bazaar)</strong> भारत का प्रमुख ज्वेलरी डिज़ाइन पोर्टल है। हमारा उद्देश्य आपको नवीनतम ज्वेलरी डिज़ाइन, सोने-चांदी के भाव और ज्वेलरी से जुड़ी सभी जानकारी एक ही जगह उपलब्ध कराना है।</p>
          <p>हम रोज़ाना अपडेटेड सोने और चांदी के भाव प्रदान करते हैं ताकि आप सही समय पर खरीदारी का फैसला ले सकें। हमारे पास मंगलसूत्र, बालियां, अंगूठी, नेकलेस, कंगन, मांग टीका, पायल, ब्राइडल सेट और भी कई कैटेगरी में सैकड़ों डिज़ाइन उपलब्ध हैं।</p>
          <h2>हमारी सेवाएं:</h2>
          <ul>
            <li>दैनिक सोने और चांदी के भाव (Gold Rate Today)</li>
            <li>नवीनतम ज्वेलरी डिज़ाइन कलेक्शन</li>
            <li>कीमत और वजन के साथ डिज़ाइन जानकारी</li>
            <li>ज्वेलरी खरीदने के टिप्स और गाइड</li>
            <li>ब्राइडल ज्वेलरी गाइड</li>
          </ul>
          <p>अगर आपके कोई सवाल या सुझाव हैं तो हमसे संपर्क करें।</p>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <Helmet><title>संपर्क करें | आभूषण बाज़ार</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">संपर्क करें</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>आभूषण बाज़ार से संपर्क करने के लिए नीचे दी गई जानकारी का उपयोग करें:</p>
          <p><strong>ईमेल:</strong> info@aabhooshanbazaar.com</p>
          <p><strong>स्थान:</strong> जयपुर, राजस्थान, भारत</p>
          <p>हम आपके सवालों का जवाब 24-48 घंटों के भीतर देने का प्रयास करते हैं।</p>
        </div>
      </div>
    </>
  );
}

export function PrivacyPage() {
  return (
    <>
      <Helmet><title>Privacy Policy | आभूषण बाज़ार</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>At Aabhooshan Bazaar (aabhooshanbazaar.com), we respect your privacy and are committed to protecting your personal information.</p>
          <h2>Information We Collect</h2>
          <p>We may collect the following information when you visit our website:</p>
          <ul>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
            <li>IP address (anonymized)</li>
          </ul>
          <h2>Use of Cookies</h2>
          <p>We use cookies and similar technologies for analytics purposes (Google Analytics) and to serve relevant advertisements (Google AdSense). You can manage cookie preferences through your browser settings.</p>
          <h2>Third-Party Services</h2>
          <p>We use Google Analytics to understand how visitors use our site. We also use Google AdSense to display advertisements. These services may collect data as described in their respective privacy policies.</p>
          <h2>Contact</h2>
          <p>For any privacy-related questions, please contact us at info@aabhooshanbazaar.com.</p>
        </div>
      </div>
    </>
  );
}

export function DisclaimerPage() {
  return (
    <>
      <Helmet><title>Disclaimer | आभूषण बाज़ार</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Disclaimer</h1>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          <p>The information provided on Aabhooshan Bazaar (aabhooshanbazaar.com) is for general informational purposes only.</p>
          <h2>Gold & Silver Rates</h2>
          <p>Gold and silver rates displayed on this website are indicative and may vary from actual market rates. Rates are updated daily but may not reflect real-time prices. Always verify current rates with your local jeweller before making any purchase decisions.</p>
          <h2>Jewellery Designs</h2>
          <p>Jewellery designs shown are for reference and inspiration purposes only. Actual designs, weights, and prices may vary. We do not sell jewellery directly. Please contact your local jeweller for purchasing.</p>
          <h2>No Financial Advice</h2>
          <p>The content on this website does not constitute financial or investment advice. Gold and silver prices are subject to market fluctuations.</p>
          <h2>External Links</h2>
          <p>We may link to external websites. We are not responsible for the content or practices of these websites.</p>
        </div>
      </div>
    </>
  );
}
