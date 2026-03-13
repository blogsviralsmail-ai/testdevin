import SEO from "../../components/SEO";

export default function TermsConditions() {
  return (
    <div>
      <SEO
        title="Terms & Conditions"
        description="Education Hub's terms and conditions. Read about our services, user registration, admission process, fees, and student responsibilities."
        keywords="terms and conditions, education hub terms, admission terms, student agreement"
        canonical="/terms-conditions"
        noindex={true}
      />
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-lg text-gray-300">Last updated: February 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">By accessing and using Education Hub's website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Services Description</h2>
            <p className="text-gray-600 leading-relaxed mb-2">Education Hub provides the following services:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>University admission counseling and processing</li>
              <li>Student registration and enrollment management</li>
              <li>Document processing and verification</li>
              <li>Fee collection and payment management</li>
              <li>Student support and guidance services</li>
              <li>Online admission portal access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Registration</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 16 years old to create an account</li>
              <li>One user account per person; sharing accounts is not permitted</li>
              <li>Admin approval is required for student account activation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Admission Process</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Education Hub acts as a facilitator between students and universities</li>
              <li>Final admission decisions are made by the respective universities</li>
              <li>We do not guarantee admission to any university or course</li>
              <li>Students must meet the eligibility criteria set by the university</li>
              <li>All documents submitted must be genuine and verifiable</li>
              <li>Submission of forged or fake documents will result in immediate cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Fees & Payments</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>All fees are as per the university fee structure and our service charges</li>
              <li>Fee payments must be made through authorized channels only</li>
              <li>UTR numbers must be provided for payment verification</li>
              <li>Processing fees are non-refundable once the admission process begins</li>
              <li>University fees refund policy will be as per the respective university norms</li>
              <li>Education Hub reserves the right to modify service charges with prior notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Student Responsibilities</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Provide accurate personal and academic information</li>
              <li>Submit all required documents within the specified timeline</li>
              <li>Pay fees on time as per the payment schedule</li>
              <li>Keep login credentials secure and confidential</li>
              <li>Inform us of any changes in contact information</li>
              <li>Comply with the rules and regulations of the enrolled university</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">All content on this website, including text, graphics, logos, images, and software, is the property of Education Hub and is protected by intellectual property laws. You may not reproduce, distribute, or modify any content without our written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">Education Hub shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services. Our total liability shall not exceed the amount paid by you for our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent activities. Upon termination, your right to use our services will immediately cease.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">For any questions regarding these Terms and Conditions:</p>
            <div className="mt-2 text-gray-600">
                            <p><strong>A Step For Future - Education Hub</strong></p>
                            <p>Email: legal@asffeducationhub.com</p>
              <p>Phone: +91-9999999999</p>
              <p>Address: Jaipur, Rajasthan, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
