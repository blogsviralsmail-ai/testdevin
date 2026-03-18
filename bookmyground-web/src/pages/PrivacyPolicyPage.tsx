import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Server, UserCheck, Bell, Mail, FileText, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicPage('privacy-policy')
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
    { icon: Eye, title: 'Information We Collect', id: 'collect' },
    { icon: Server, title: 'How We Use Your Data', id: 'use' },
    { icon: Lock, title: 'Data Security', id: 'security' },
    { icon: UserCheck, title: 'Your Rights', id: 'rights' },
    { icon: Bell, title: 'Notifications & Communications', id: 'notifications' },
    { icon: Mail, title: 'Contact Us', id: 'contact' },
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
      <div className="relative bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">&#128274;</div>
          <div className="absolute bottom-10 right-10 text-8xl">&#128220;</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield size={16} /> Your Privacy Matters
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy <span className="text-yellow-300">Policy</span>
            </h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              We are committed to protecting your privacy and ensuring the security of your personal information.
              Read our privacy policy to understand how we handle your data.
            </p>
            {lastUpdated && (
              <p className="text-sm text-green-200 mt-4">Last Updated: {lastUpdated.replace('T', ' ').slice(0, 10)}</p>
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
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mx-auto mb-2 group-hover:bg-green-200 transition-colors">
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
          {/* Sidebar - Table of Contents */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-4">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-green-600" /> Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition py-1.5 px-3 rounded-lg hover:bg-green-50">
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
              /* Dynamic CMS Content */
              <div className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-gray-100">
                <div className="prose prose-green max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-green-600 prose-strong:text-gray-800" 
                  dangerouslySetInnerHTML={{ __html: cmsContent }} 
                />
              </div>
            ) : (
              /* Default Content */
              <div className="space-y-8">
                {/* Section 1 */}
                <div id="collect" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <Eye size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>When you use BookAGround, we collect the following types of information:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Personal Information', items: ['Full Name', 'Phone Number', 'Email Address', 'City/Location'] },
                        { title: 'Booking Information', items: ['Ground preferences', 'Booking history', 'Payment details', 'Reviews & ratings'] },
                        { title: 'Device Information', items: ['Device type & model', 'Operating system', 'Browser type', 'IP address'] },
                        { title: 'Usage Data', items: ['Pages visited', 'Search queries', 'Feature usage', 'Session duration'] },
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

                {/* Section 2 */}
                <div id="use" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Server size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">How We Use Your Data</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>We use the collected information for the following purposes:</p>
                    <div className="space-y-3">
                      {[
                        { title: 'Service Delivery', desc: 'To process bookings, manage payments, and provide customer support for your ground bookings.' },
                        { title: 'Personalization', desc: 'To show you relevant grounds, personalized recommendations, and offers based on your preferences and location.' },
                        { title: 'Communication', desc: 'To send booking confirmations, payment receipts, important updates, and promotional offers (with your consent).' },
                        { title: 'Improvement', desc: 'To analyze usage patterns, improve our platform features, fix bugs, and enhance user experience.' },
                        { title: 'Security', desc: 'To detect and prevent fraud, unauthorized access, and other security threats to protect your account.' },
                        { title: 'Legal Compliance', desc: 'To comply with applicable laws, regulations, and legal processes as required by Indian law.' },
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

                {/* Section 3 */}
                <div id="security" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                      <Lock size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>We take the security of your data very seriously. Here's how we protect your information:</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { title: 'Encryption', desc: 'All data is encrypted in transit (TLS/SSL) and sensitive data is encrypted at rest.', icon: '🔐' },
                        { title: 'Secure Payments', desc: 'Payment processing through PCI-DSS compliant gateways. We never store card details.', icon: '💳' },
                        { title: 'Access Controls', desc: 'Strict access controls ensure only authorized personnel can access your data.', icon: '🛡' },
                        { title: 'Regular Audits', desc: 'We conduct regular security audits and vulnerability assessments.', icon: '🔍' },
                        { title: 'Data Backup', desc: 'Regular encrypted backups ensure your data is never lost.', icon: '💾' },
                        { title: 'Incident Response', desc: 'Dedicated team to handle security incidents and notify affected users promptly.', icon: '🚨' },
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

                {/* Section 4 */}
                <div id="rights" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <UserCheck size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>Under applicable data protection laws, you have the following rights:</p>
                    <div className="space-y-3">
                      {[
                        'Right to access your personal data at any time',
                        'Right to correct or update inaccurate information',
                        'Right to delete your account and associated data',
                        'Right to withdraw consent for marketing communications',
                        'Right to data portability - export your data',
                        'Right to restrict or object to data processing',
                        'Right to lodge a complaint with relevant authorities',
                      ].map((right) => (
                        <div key={right} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                          <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserCheck size={12} className="text-purple-700" />
                          </div>
                          <span className="text-sm text-purple-800">{right}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      To exercise any of these rights, please contact us at <a href="mailto:info@bookaground.com" className="text-green-600 font-medium hover:underline">info@bookaground.com</a>. 
                      We will respond to your request within 30 days.
                    </p>
                  </div>
                </div>

                {/* Section 5 */}
                <div id="notifications" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                      <Bell size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Notifications & Communications</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>We may send you the following types of communications:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                        <h4 className="font-semibold text-green-800 text-sm mb-2">Essential (Cannot opt-out)</h4>
                        <ul className="space-y-1 text-xs text-green-700">
                          <li>- Booking confirmations & updates</li>
                          <li>- Payment receipts & refund notifications</li>
                          <li>- Account security alerts</li>
                          <li>- Terms & policy changes</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
                        <h4 className="font-semibold text-blue-800 text-sm mb-2">Promotional (Can opt-out)</h4>
                        <ul className="space-y-1 text-xs text-blue-700">
                          <li>- Special offers & discounts</li>
                          <li>- New ground listings</li>
                          <li>- Tournament announcements</li>
                          <li>- Newsletter & tips</li>
                        </ul>
                      </div>
                    </div>
                    <p className="text-sm">You can manage your notification preferences from your Profile Settings or by contacting us.</p>
                  </div>
                </div>

                {/* Section 6 */}
                <div id="contact" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <Mail size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>If you have any questions or concerns about this Privacy Policy, please contact us:</p>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-bold text-green-800 mb-3">KKHS Media Private Limited</h4>
                            <div className="space-y-2 text-sm text-green-700">
                              <p className="flex items-center gap-2"><Mail size={14} /> info@bookaground.com</p>
                              <p className="flex items-center gap-2"><Shield size={14} /> 190A Krishna Kunj, Kalwar Road, Jaipur 302012</p>
                              <p className="text-xs">GSTIN: 08AAICK3853C1ZL | Phone: +91 9782005500</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800 mb-3">Data Protection</h4>
                          <p className="text-sm text-green-700">
                            For data protection inquiries, please email us with the subject line "Data Protection Request" 
                            and we will respond within 30 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link to="/contact" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                        <Mail size={14} /> Contact Us
                      </Link>
                      <Link to="/about" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                        About Us
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Additional Sections */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
                  <div className="space-y-6 text-gray-600 leading-relaxed">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Cookies & Tracking</h3>
                      <p className="text-sm">We use cookies and similar technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Third-Party Services</h3>
                      <p className="text-sm">We may share data with trusted third-party service providers (payment processors, analytics tools, cloud hosting) who help us deliver our services. They are bound by confidentiality agreements.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Data Retention</h3>
                      <p className="text-sm">We retain your personal data only as long as necessary for the purposes described in this policy. Account data is retained for the duration of your account and deleted within 90 days of account closure.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Children's Privacy</h3>
                      <p className="text-sm">BookAGround is not intended for children under 13. We do not knowingly collect personal information from children. If we become aware of such data, we will delete it immediately.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Changes to This Policy</h3>
                      <p className="text-sm">We may update this policy from time to time. We will notify you of significant changes through email or in-app notifications. Continued use of the platform constitutes acceptance of the updated policy.</p>
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
          <h2 className="text-2xl font-bold mb-3">Your Privacy is Our Priority</h2>
          <p className="text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
            We are committed to being transparent about how we collect and use your data. 
            If you have any concerns, please don't hesitate to reach out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition text-sm">
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
