import { useState, useEffect } from 'react';
import { RotateCcw, Clock, CreditCard, AlertCircle, CheckCircle, HelpCircle, Mail, FileText, ChevronRight, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function RefundPolicyPage() {
  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicPage('refund-policy')
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
    { icon: RotateCcw, title: 'Refund Eligibility', id: 'eligibility' },
    { icon: Clock, title: 'Cancellation Timeline', id: 'timeline' },
    { icon: CreditCard, title: 'Refund Process', id: 'process' },
    { icon: AlertCircle, title: 'Non-Refundable Cases', id: 'non-refundable' },
    { icon: CheckCircle, title: 'Refund Methods', id: 'methods' },
    { icon: HelpCircle, title: 'FAQs & Support', id: 'support' },
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
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">&#128176;</div>
          <div className="absolute bottom-10 right-10 text-8xl">&#128260;</div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
              <RotateCcw size={16} /> Hassle-Free Refunds
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Refund <span className="text-yellow-200">Policy</span>
            </h1>
            <p className="text-lg text-orange-100 max-w-2xl mx-auto">
              We want you to have a great experience. If things don't go as planned, 
              our transparent refund policy ensures you're covered.
            </p>
            {lastUpdated && (
              <p className="text-sm text-orange-200 mt-4">Last Updated: {lastUpdated.replace('T', ' ').slice(0, 10)}</p>
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
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mx-auto mb-2 group-hover:bg-orange-200 transition-colors">
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
                <FileText size={16} className="text-orange-600" /> Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition py-1.5 px-3 rounded-lg hover:bg-orange-50">
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
                <div className="prose prose-orange max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-a:text-orange-600 prose-strong:text-gray-800" 
                  dangerouslySetInnerHTML={{ __html: cmsContent }} 
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Section 1 - Refund Eligibility */}
                <div id="eligibility" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                      <RotateCcw size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Refund Eligibility</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>You are eligible for a refund in the following scenarios:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { title: 'Ground Unavailable', desc: 'If the ground is unavailable or closed on your booked date/time due to owner cancellation.', icon: '🏟' },
                        { title: 'Double Booking', desc: 'If you were charged twice for the same booking due to a system error.', icon: '🔄' },
                        { title: 'Weather Cancellation', desc: 'If the booking is cancelled due to severe weather conditions (rain, storm) making play impossible.', icon: '🌧' },
                        { title: 'Advance Cancellation', desc: 'If you cancel at least 24 hours before your scheduled booking time.', icon: '⏰' },
                      ].map((item) => (
                        <div key={item.title} className="bg-green-50 rounded-xl p-4 border border-green-100">
                          <div className="text-2xl mb-2">{item.icon}</div>
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2 - Cancellation Timeline */}
                <div id="timeline" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <Clock size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Cancellation Timeline & Refund Amount</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>The refund amount depends on when you cancel your booking:</p>
                    <div className="space-y-3">
                      {[
                        { time: 'More than 48 hours before', refund: '100% Refund', color: 'green', desc: 'Full refund to original payment method' },
                        { time: '24 to 48 hours before', refund: '75% Refund', color: 'blue', desc: '25% cancellation fee applies' },
                        { time: '12 to 24 hours before', refund: '50% Refund', color: 'yellow', desc: '50% cancellation fee applies' },
                        { time: '6 to 12 hours before', refund: '25% Refund', color: 'orange', desc: '75% cancellation fee applies' },
                        { time: 'Less than 6 hours before', refund: 'No Refund', color: 'red', desc: 'Full cancellation fee - no refund available' },
                      ].map((item) => (
                        <div key={item.time} className={`flex items-center gap-4 p-4 rounded-xl bg-${item.color}-50 border border-${item.color}-100`}>
                          <div className={`px-3 py-1.5 bg-${item.color}-200 text-${item.color}-800 rounded-lg text-xs font-bold whitespace-nowrap`}>
                            {item.refund}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{item.time}</h4>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3 - Refund Process */}
                <div id="process" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                      <CreditCard size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Refund Process</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>Here's how to request and receive your refund:</p>
                    <div className="space-y-4">
                      {[
                        { step: '1', title: 'Cancel Booking', desc: 'Go to My Bookings and click "Cancel" on the booking you wish to cancel. Provide a reason for cancellation.' },
                        { step: '2', title: 'Automatic Processing', desc: 'Once cancelled, the refund is automatically calculated based on the cancellation timeline above.' },
                        { step: '3', title: 'Refund Initiated', desc: 'The refund is initiated to your original payment method or wallet within 24 hours of cancellation.' },
                        { step: '4', title: 'Refund Received', desc: 'Bank refunds take 5-7 business days. Wallet refunds are instant. UPI refunds take 2-3 business days.' },
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-gray-50">
                          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 4 - Non-Refundable */}
                <div id="non-refundable" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                      <AlertCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Non-Refundable Cases</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>Refunds are NOT applicable in the following situations:</p>
                    <div className="space-y-3">
                      {[
                        'No-show: If you don\'t arrive for your booked slot without cancelling',
                        'Late cancellation: Cancellations made less than 6 hours before the booking',
                        'Partial usage: If you use part of the booked time and leave early',
                        'Policy violation: If your booking was cancelled due to violation of ground rules',
                        'Promotional bookings: Some promotional or discounted bookings marked as non-refundable',
                        'Membership fees: Monthly or annual membership charges are non-refundable',
                        'Convenience fees: Platform convenience/service fees are non-refundable',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                          <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={12} className="text-red-700" />
                          </div>
                          <span className="text-sm text-red-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 5 - Refund Methods */}
                <div id="methods" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                      <CheckCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Refund Methods & Timeline</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>Refunds are processed through the following methods:</p>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { title: 'Wallet Refund', time: 'Instant', desc: 'Credited to your BookAGround wallet. Can be used for future bookings.', icon: '💰' },
                        { title: 'UPI Refund', time: '2-3 Business Days', desc: 'Refunded to your UPI ID used during payment.', icon: '📱' },
                        { title: 'Bank Transfer', time: '5-7 Business Days', desc: 'Refunded to your bank account/card used for payment.', icon: '🏦' },
                      ].map((item) => (
                        <div key={item.title} className="bg-gray-50 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-2">{item.icon}</div>
                          <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h4>
                          <div className="text-xs font-bold text-purple-600 mb-2">{item.time}</div>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mt-4">
                      <p className="text-sm text-blue-800"><strong>Note:</strong> You can choose to receive refund in your BookAGround Wallet for instant credit, which can be used for future bookings.</p>
                    </div>
                  </div>
                </div>

                {/* Section 6 - FAQs & Support */}
                <div id="support" className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 scroll-mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                      <HelpCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">FAQs & Support</h2>
                  </div>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <div className="space-y-4">
                      {[
                        { q: 'How long does a refund take?', a: 'Wallet refunds are instant. UPI refunds take 2-3 business days. Bank refunds take 5-7 business days.' },
                        { q: 'Can I get a refund after using the ground?', a: 'No, refunds are only available for cancelled bookings before the scheduled time.' },
                        { q: 'What if the ground owner cancels?', a: 'You will receive a 100% refund automatically, regardless of the cancellation time.' },
                        { q: 'Can I reschedule instead of cancelling?', a: 'Yes! You can reschedule your booking to a different date/time without any cancellation charges, subject to availability.' },
                        { q: 'What if my refund is delayed?', a: 'Contact our support team at info@bookaground.com with your booking ID. We will resolve it within 48 hours.' },
                      ].map((item) => (
                        <div key={item.q} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                          <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                            <HelpCircle size={14} className="text-teal-600" /> {item.q}
                          </h4>
                          <p className="text-xs text-gray-500 ml-6">{item.a}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 mt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-orange-800 mb-3">Need Help with a Refund?</h4>
                          <div className="space-y-2 text-sm text-orange-700">
                            <p className="flex items-center gap-2"><Mail size={14} /> info@bookaground.com</p>
                            <p className="flex items-center gap-2"><Shield size={14} /> KKHS Media Pvt Ltd, 190A Krishna Kunj, Kalwar Road, Jaipur 302012</p>
                            <p className="text-xs mt-1">Phone: +91 9782005500 | GSTIN: 08AAICK3853C1ZL</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-orange-800 mb-3">Response Time</h4>
                          <p className="text-sm text-orange-700">
                            Our support team typically responds within 24 hours. For urgent refund queries, 
                            please include your Booking ID in the email subject.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link to="/contact" className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
                        <Mail size={14} /> Contact Support
                      </Link>
                      <Link to="/about" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                        About Us
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
          <h2 className="text-2xl font-bold mb-3">Fair & Transparent Refund Policy</h2>
          <p className="text-gray-400 mb-6 text-sm max-w-2xl mx-auto">
            We believe in keeping things simple and fair. If you have any concerns about refunds, 
            our support team is always ready to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition text-sm">
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
