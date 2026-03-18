import { useState, useEffect } from 'react';
import { BookOpen, Scale, Users, ShieldCheck, Ban, Gavel, Mail, FileText, ChevronRight, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function TermsConditionsPage() {
  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicPage('terms')
      .then((page: Record<string, unknown>) => {
        if (page && page.content && String(page.content) !== '<p>Coming soon</p>') {
          setCmsContent(String(page.content));
          if (page.updated_at) setLastUpdated(String(page.updated_at));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    { icon: BookOpen, title: 'Terms of Use', id: 'terms' },
    { icon: Users, title: 'User Responsibilities', id: 'responsibilities' },
    { icon: Scale, title: 'Booking & Payments', id: 'payments' },
    { icon: Ban, title: 'Prohibited Activities', id: 'prohibited' },
    { icon: ShieldCheck, title: 'Liability & Disclaimers', id: 'liability' },
    { icon: Gavel, title: 'Dispute Resolution', id: 'disputes' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">&#9878;</div>
          <div className="absolute bottom-10 right-10 text-8xl">&#128214;</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <BookOpen size={16} /> Legal Agreement
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Terms & <span className="text-yellow-300">Conditions</span>
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Please read these terms carefully before using BookAGround. By using our platform, 
              you agree to be bound by these terms and conditions.
            </p>
            {lastUpdated && (
              <p className="text-sm text-blue-200 mt-4">Last Updated: {lastUpdated.replace('T', ' ').slice(0, 10)}</p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="bg-white rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all group">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
                <section.icon size={18} />
              </div>
              <div className="text-xs font-medium text-gray-700 leading-tight">{section.title}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition py-1.5 px-3 rounded-lg hover:bg-blue-50">
                    <ChevronRight size={12} />
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {cmsContent ? (
              <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100">
                <div className="prose prose-blue max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-blue-600 prose-strong:text-gray-800" 
                  dangerouslySetInnerHTML={{ __html: cmsContent }} 
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Section 1 - Terms of Use */}
                <div id="terms" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <BookOpen size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Terms of Use</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>Welcome to BookAGround, a sports ground booking platform operated by KKHS Media Private Limited (GSTIN: 08AAICK3853C1ZL), registered at 190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012. By accessing or using our platform, you agree to the following terms:</p>
                    <div className="space-y-3">
                      {[
                        { title: 'Acceptance', desc: 'By creating an account or using any part of BookAGround, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.' },
                        { title: 'Eligibility', desc: 'You must be at least 18 years of age to use this platform. By using BookAGround, you represent that you meet this age requirement.' },
                        { title: 'Account Registration', desc: 'You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials.' },
                        { title: 'Platform Purpose', desc: 'BookAGround is a marketplace connecting sports ground owners with players. We facilitate bookings but do not own or operate any sports grounds listed on the platform.' },
                        { title: 'Modifications', desc: 'We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.' },
                      ].map((item) => (
                        <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-gray-50">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2 - User Responsibilities */}
                <div id="responsibilities" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <Users size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">User Responsibilities</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>As a user of BookAGround, you agree to:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Accurate Information', items: ['Provide truthful personal details', 'Keep your profile up to date', 'Use valid contact information', 'Report any unauthorized access'] },
                        { title: 'Booking Etiquette', items: ['Arrive on time for bookings', 'Follow ground rules & guidelines', 'Treat grounds with respect', 'Cancel in advance if unable to attend'] },
                        { title: 'Community Standards', items: ['Be respectful to ground owners', 'Provide honest reviews & ratings', 'Report safety concerns', 'Follow fair play guidelines'] },
                        { title: 'Payment Obligations', items: ['Pay for bookings on time', 'Use valid payment methods', 'Report unauthorized charges', 'Honor cancellation policies'] },
                      ].map((category) => (
                        <div key={category.title} className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-semibold text-gray-800 text-sm mb-2">{category.title}</h4>
                          <ul className="space-y-1">
                            {category.items.map((item) => (
                              <li key={item} className="text-xs text-gray-500 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3 - Booking & Payments */}
                <div id="payments" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                      <Scale size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Booking & Payment Terms</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>The following terms govern all bookings and payments on BookAGround:</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { title: 'Booking Confirmation', desc: 'A booking is confirmed only after successful payment. You will receive a confirmation via email/SMS with booking details.', icon: '📋' },
                        { title: 'Pricing', desc: 'Prices are set by ground owners and may vary. All prices are displayed in Indian Rupees (INR) inclusive of applicable taxes.', icon: '💰' },
                        { title: 'Payment Methods', desc: 'We accept UPI, debit/credit cards, net banking, and wallet payments. Cash payment may be available at select grounds.', icon: '💳' },
                        { title: 'Cancellation', desc: 'Cancellations are subject to our Refund Policy. Please refer to our refund policy page for detailed cancellation terms.', icon: '❌' },
                        { title: 'Service Fee', desc: 'A platform service/convenience fee may be charged on bookings. This fee is clearly displayed before payment confirmation.', icon: '📊' },
                        { title: 'Invoices', desc: 'GST-compliant tax invoices are generated for all bookings and can be downloaded from your My Bookings section.', icon: '🧾' },
                      ].map((item) => (
                        <div key={item.title} className="bg-gray-50 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">{item.icon}</div>
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4 - Prohibited Activities */}
                <div id="prohibited" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <Ban size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Prohibited Activities</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>The following activities are strictly prohibited on BookAGround:</p>
                    <div className="space-y-3">
                      {[
                        'Creating fake accounts or using false identity information',
                        'Making fraudulent bookings or payments',
                        'Harassing, threatening, or abusing ground owners or other users',
                        'Posting fake, misleading, or defamatory reviews',
                        'Attempting to hack, disrupt, or exploit the platform',
                        'Using the platform for any illegal or unauthorized purpose',
                        'Scraping or copying platform data without permission',
                        'Circumventing the platform to make direct payments to avoid service fees',
                        'Damaging or vandalizing booked sports grounds or equipment',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                          <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Ban size={12} className="text-red-700" />
                          </div>
                          <span className="text-sm text-red-800">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 mt-4">
                      <p className="text-sm text-yellow-800"><strong>Warning:</strong> Violation of these terms may result in immediate account suspension, permanent ban, and/or legal action as deemed appropriate.</p>
                    </div>
                  </div>
                </div>

                {/* Section 5 - Liability & Disclaimers */}
                <div id="liability" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <ShieldCheck size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Liability & Disclaimers</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <div className="space-y-4">
                      {[
                        { title: 'Platform Role', desc: 'BookAGround acts as a marketplace connecting ground owners and players. We are not responsible for the condition, safety, or quality of the grounds listed on the platform.' },
                        { title: 'Ground Accuracy', desc: 'While we strive to ensure accurate listing information, we cannot guarantee the accuracy of all details provided by ground owners including photos, amenities, and availability.' },
                        { title: 'Injury Disclaimer', desc: 'BookAGround is not liable for any physical injury, accident, or health issue that occurs during or as a result of using any sports ground booked through our platform.' },
                        { title: 'Service Availability', desc: 'We do not guarantee uninterrupted access to our platform. Maintenance, updates, or technical issues may temporarily affect availability.' },
                        { title: 'Third-Party Services', desc: 'We are not responsible for third-party payment processors, communication services, or other external services integrated with our platform.' },
                        { title: 'Maximum Liability', desc: 'Our total liability for any claim arising from use of BookAGround shall not exceed the amount paid by you for the specific booking in question.' },
                      ].map((item) => (
                        <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-purple-50 border border-purple-100">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 6 - Dispute Resolution */}
                <div id="disputes" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                      <Gavel size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Dispute Resolution & Governing Law</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <div className="space-y-4">
                      {[
                        { step: '1', title: 'Contact Support', desc: 'First, try to resolve the issue by contacting our support team at info@bookaground.com. Most issues are resolved within 48 hours.' },
                        { step: '2', title: 'Formal Complaint', desc: 'If unsatisfied, submit a formal written complaint. We will investigate and respond within 15 business days with a resolution.' },
                        { step: '3', title: 'Mediation', desc: 'If the complaint remains unresolved, both parties agree to participate in good-faith mediation before seeking legal remedies.' },
                        { step: '4', title: 'Legal Action', desc: 'As a last resort, disputes shall be subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan, India.' },
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-gray-50">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-blue-800 mb-3">Governing Law</h4>
                          <p className="text-sm text-blue-700">
                            These terms shall be governed by and construed in accordance with the laws of India, 
                            specifically the Information Technology Act, 2000 and the Consumer Protection Act, 2019.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-800 mb-3">Contact for Legal</h4>
                          <div className="space-y-2 text-sm text-blue-700">
                            <p className="flex items-center gap-2"><Mail size={14} /> info@bookaground.com</p>
                            <p className="flex items-center gap-2"><Shield size={14} /> KKHS Media Pvt Ltd, 190A Krishna Kunj, Kalwar Road, Jaipur 302012</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link to="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                        <Mail size={14} /> Contact Us
                      </Link>
                      <Link to="/privacy-policy" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Questions About Our Terms?</h2>
          <p className="text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
            We want to make sure you understand our terms clearly. If you have any questions 
            or need clarification, our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition text-sm">
              <Mail size={16} /> Contact Our Team
            </Link>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
