import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link to="/account" className="p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Privacy Policy
        </h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">1. Introduction</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Pacifika Wear is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our e-commerce platform. By using our services, you consent to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">2. Information We Collect</h2>
          <div className="text-sm text-[#F0EDE6]/80 leading-relaxed space-y-2">
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1 text-[#F0EDE6]/70">
              <li><strong className="text-[#F0EDE6]/90">Personal Information:</strong> Name, email address, phone number, and shipping address provided during checkout.</li>
              <li><strong className="text-[#F0EDE6]/90">Payment Information:</strong> Payment card details processed securely through Stripe. We do not store your full card number.</li>
              <li><strong className="text-[#F0EDE6]/90">Order History:</strong> Records of purchases, returns, and product preferences.</li>
              <li><strong className="text-[#F0EDE6]/90">Usage Data:</strong> Pages visited, products viewed, and interactions with our app to improve user experience.</li>
              <li><strong className="text-[#F0EDE6]/90">Device Information:</strong> Browser type, IP address, and operating system for analytics and security.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">3. How We Use Your Information</h2>
          <div className="text-sm text-[#F0EDE6]/80 leading-relaxed space-y-2">
            <p>Your information is used for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-[#F0EDE6]/70">
              <li>Processing and fulfilling your orders</li>
              <li>Providing customer support and responding to inquiries</li>
              <li>Sending order confirmations, shipping updates, and delivery notifications</li>
              <li>Administering promo codes and loyalty programs</li>
              <li>Analysing site usage to improve our products and services</li>
              <li>Detecting and preventing fraud and unauthorised access</li>
              <li>Complying with legal obligations</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">4. Data Sharing & Disclosure</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We do not sell your personal information to third parties. We may share data with trusted service providers who assist in operating our platform, including Stripe for payment processing, shipping carriers for delivery, and analytics providers. These parties are contractually obligated to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">5. Data Security</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We implement industry-standard security measures including SSL encryption, PCI-DSS compliance for payment processing, and regular security audits. While we strive to protect your data, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">6. Cookies & Tracking</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We use cookies and similar technologies to remember your preferences, analyse site traffic, and personalise content. You can control cookie settings through your browser. We may also use Facebook Pixel and Google Analytics for advertising and traffic analysis.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">7. Your Rights</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Under Australian privacy law, you have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time. To exercise these rights, contact us at{" "}
            <a href="mailto:joelandamale@gmail.com" className="text-[#5BA4CF]">joelandamale@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">8. Data Retention</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, or as required by law. Order records are kept for a minimum of 7 years for tax and accounting purposes.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">9. Contact Us</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us through our{" "}
            <Link to="/contact" className="text-[#5BA4CF]">Contact page</Link>{" "}
            or email{" "}
            <a href="mailto:joelandamale@gmail.com" className="text-[#5BA4CF]">joelandamale@gmail.com</a>.
          </p>
        </section>

        <p className="text-xs text-[#8A94A6] pt-4 border-t border-[#8A94A6]/20">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
