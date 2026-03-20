import { Link } from "react-router-dom";
import { Crown, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <div>
                <h3 className="text-xl font-bold text-white">आभूषण बाज़ार</h3>
                <p className="text-xs text-gray-400">Aabhooshan Bazaar</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4 max-w-md">
              भारत का सबसे बड़ा ज्वेलरी डिज़ाइन कलेक्शन। नवीनतम सोने-चांदी के भाव, 
              मंगलसूत्र, बालियां, अंगूठी, नेकलेस और बहुत कुछ।
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" /> जयपुर, राजस्थान
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <Mail className="w-4 h-4" /> info@aabhooshanbazaar.com
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">ज्वेलरी कैटेगरी</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/mangalsutra" className="hover:text-yellow-500 transition">मंगलसूत्र</Link></li>
              <li><Link to="/category/gold-earrings" className="hover:text-yellow-500 transition">सोने की बालियां</Link></li>
              <li><Link to="/category/gold-rings" className="hover:text-yellow-500 transition">सोने की अंगूठी</Link></li>
              <li><Link to="/category/gold-necklace" className="hover:text-yellow-500 transition">गोल्ड नेकलेस</Link></li>
              <li><Link to="/category/gold-bangles" className="hover:text-yellow-500 transition">सोने के कंगन</Link></li>
              <li><Link to="/category/bridal-set" className="hover:text-yellow-500 transition">ब्राइडल सेट</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">उपयोगी लिंक</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/gold-rate" className="hover:text-yellow-500 transition">आज का सोने का भाव</Link></li>
              <li><Link to="/blog" className="hover:text-yellow-500 transition">ब्लॉग</Link></li>
              <li><Link to="/about" className="hover:text-yellow-500 transition">हमारे बारे में</Link></li>
              <li><Link to="/contact" className="hover:text-yellow-500 transition">संपर्क करें</Link></li>
              <li><Link to="/privacy" className="hover:text-yellow-500 transition">Privacy Policy</Link></li>
              <li><Link to="/disclaimer" className="hover:text-yellow-500 transition">Disclaimer</Link></li>
              <li><Link to="/terms" className="hover:text-yellow-500 transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} आभूषण बाज़ार (Aabhooshan Bazaar). सर्वाधिकार सुरक्षित।</p>
          <p className="mt-1">Disclaimer: यह वेबसाइट केवल जानकारी के लिए है। सोने-चांदी के भाव बाज़ार के अनुसार बदल सकते हैं।</p>
        </div>
      </div>
    </footer>
  );
}
