import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link to="/account" className="p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Terms of Service
        </h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">1. Overview</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Welcome to Pacifika Wear. By accessing our website or mobile application and purchasing our products, you agree to these Terms of Service. These terms govern your use of the Pacifika Wear e-commerce platform.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">2. Orders & Payments</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            All prices are listed in Australian Dollars (AUD) unless otherwise stated. We accept payment via credit/debit cards and digital wallets through our secure Stripe payment gateway. Orders are confirmed upon successful payment processing. We reserve the right to cancel orders in cases of pricing errors or stock unavailability.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">3. Shipping & Delivery</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Free local delivery is available within the Cairns, QLD region. Australian and international shipping costs are calculated at checkout based on weight, dimensions, and destination. Delivery times vary by location: Cairns (1-2 business days), Australia (3-7 business days), International (7-21 business days).
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">4. Returns & Refunds</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We accept returns within 30 days of delivery for items in original, unworn condition with tags attached. Refunds are processed within 5-7 business days after we receive the returned item. Sale items may be eligible for exchange only. Customers are responsible for return shipping costs unless the item is faulty.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">5. Product Descriptions</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We make every effort to display product colours and details accurately. However, actual colours may vary due to lighting, monitor settings, and natural variations in fabric. Sizes are provided as a guide — please refer to our size chart for measurements.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">6. Intellectual Property</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            All content on this platform, including product images, descriptions, logos, and designs, is the property of AndamaleOne Pacifika Wear and protected by Australian and international copyright laws. Unauthorized reproduction or distribution is prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">7. Limitation of Liability</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Pacifika Wear shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">8. Governing Law</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            These Terms are governed by the laws of Queensland, Australia. Any disputes shall be resolved in the courts of Queensland.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">9. Contact</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:joelandamale@gmail.com" className="text-[#5BA4CF]">joelandamale@gmail.com</a>
            {" "}or through our <Link to="/contact" className="text-[#5BA4CF]">Contact page</Link>.
          </p>
        </section>

        <p className="text-xs text-[#8A94A6] pt-4 border-t border-[#8A94A6]/20">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
