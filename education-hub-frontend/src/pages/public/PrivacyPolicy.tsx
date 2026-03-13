import SEO from "../../components/SEO";

export default function PrivacyPolicy() {
  return (
    <div>
      <SEO
        title="Privacy Policy"
        description="Education Hub's privacy policy. Learn how we collect, use, and protect your personal information including academic data, documents, and financial information."
        keywords="privacy policy, data protection, education hub privacy, student data privacy"
        canonical="/privacy-policy"
        noindex={true}
      />
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-300">Last updated: February 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose max-w-none">
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">Education Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services. Please read this privacy policy carefully.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-2">We may collect information about you in a variety of ways including:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li><strong>Personal Data:</strong> Name, email address, phone number, date of birth, address, and other contact details you provide during registration or enquiry.</li>
                <li><strong>Academic Information:</strong> Educational qualifications, university preferences, course selections, enrollment numbers, and academic records.</li>
                <li><strong>Financial Information:</strong> Fee payment details, transaction records, and UTR numbers for payment verification.</li>
                <li><strong>Documents:</strong> Identity proofs, educational certificates, photographs, and other documents uploaded for admission processing.</li>
                <li><strong>Usage Data:</strong> Browser type, IP address, pages visited, time spent on pages, and other diagnostic data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>To process and manage university admissions</li>
                <li>To provide student counseling and support services</li>
                <li>To communicate with you about your admission status and updates</li>
                <li>To process fee payments and maintain financial records</li>
                <li>To send promotional communications (with your consent)</li>
                <li>To improve our website and services</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing & Disclosure</h2>
              <p className="text-gray-600 leading-relaxed">We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li><strong>Partner Universities:</strong> For admission processing and enrollment</li>
                <li><strong>Branch Offices:</strong> For local support and counseling</li>
                <li><strong>Service Providers:</strong> For SMS, email notifications, and payment processing</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Student records are maintained for the duration of the academic program plus 5 years.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
              <p className="text-gray-600 leading-relaxed">Our website uses cookies and similar tracking technologies to enhance your browsing experience. You can control cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">If you have any questions about this Privacy Policy, please contact us:</p>
              <div className="mt-2 text-gray-600">
                                <p><strong>A Step For Future - Education Hub</strong></p>
                                <p>Email: privacy@asffeducationhub.com</p>
                                <p>Phone: +91-9876543210</p>
                <p>Address: Jaipur, Rajasthan, India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
