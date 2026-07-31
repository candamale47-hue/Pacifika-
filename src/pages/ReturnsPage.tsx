import { Link } from "react-router";
import { ArrowLeft, Clock, Package, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link to="/account" className="p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Return & Refund Policy
        </h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#243656] rounded-xl p-4 text-center">
            <RotateCcw size={24} className="text-[#D4A03C] mx-auto mb-2" />
            <p className="text-2xl font-bold">30 Days</p>
            <p className="text-xs text-[#8A94A6]">Return Window</p>
          </div>
          <div className="bg-[#243656] rounded-xl p-4 text-center">
            <Clock size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">5-7 Days</p>
            <p className="text-xs text-[#8A94A6]">Refund Processing</p>
          </div>
        </div>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Return Eligibility</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed mb-3">
            We want you to love your Pacifika Wear purchase. If you are not completely satisfied, you may return your item under the following conditions:
          </p>
          <ul className="space-y-2">
            {[
              "Item must be returned within 30 days of delivery",
              "Item must be unworn, unwashed, and in original condition",
              "All original tags must be attached",
              "Item must be in original packaging where applicable",
              "Proof of purchase (order number or receipt) is required",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#F0EDE6]/70">
                <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Non-Returnable Items</h2>
          <ul className="space-y-2">
            {[
              "Items marked as \"Final Sale\" or purchased with a clearance discount over 50%",
              "Intimate apparel (undergarments) for hygiene reasons",
              "Custom or personalised orders",
              "Items damaged by wear, wash, or misuse",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#F0EDE6]/70">
                <AlertCircle size={14} className="text-[#E53935] mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">How to Return</h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Initiate Return", desc: "Email us at joelandamale@gmail.com with your order number and reason for return." },
              { step: "2", title: "Receive Instructions", desc: "We will send you a return authorisation and prepaid return label (for faulty items)." },
              { step: "3", title: "Package & Ship", desc: "Securely pack the item with all tags attached and send using the provided label." },
              { step: "4", title: "Refund Processed", desc: "Once we receive and inspect the item, your refund will be processed within 5-7 business days." },
            ].map((step) => (
              <div key={step.step} className="flex gap-3 bg-[#243656] rounded-lg p-3">
                <span className="w-7 h-7 bg-[#D4A03C] rounded-full flex items-center justify-center text-[#1B2A4A] text-xs font-bold flex-shrink-0">
                  {step.step}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-[#8A94A6] mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Refund Method</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            Refunds are issued to the original payment method used at checkout. Depending on your bank, it may take 5-10 business days for the refund to appear on your statement. If you paid with a gift card or store credit, the refund will be issued as store credit.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Exchanges</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            We offer exchanges for different sizes or colours, subject to availability. To exchange an item, follow the return process above and place a new order for the desired item. This ensures faster processing as popular sizes may sell out quickly.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Faulty or Damaged Items</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            If you receive a faulty or damaged item, please contact us within 7 days of delivery with photos of the damage. We will provide a prepaid return label and offer a full refund, exchange, or store credit — your choice.
          </p>
        </section>

        <section>
          <h2 className="text-[#D4A03C] font-semibold mb-2">Return Shipping Costs</h2>
          <p className="text-sm text-[#F0EDE6]/80 leading-relaxed">
            For change-of-mind returns, the customer is responsible for return shipping costs. For faulty or incorrect items, Pacifika Wear covers all return shipping costs.
          </p>
        </section>

        <section className="bg-[#243656] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#5BA4CF]" />
            <h3 className="text-sm font-semibold">Need Help?</h3>
          </div>
          <p className="text-sm text-[#F0EDE6]/70 mb-3">
            Our customer service team is here to help with any return questions.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-[#5BA4CF] text-white px-4 py-2 rounded-lg text-xs font-medium"
          >
            Contact Us
          </Link>
        </section>

        <p className="text-xs text-[#8A94A6] pt-4 border-t border-[#8A94A6]/20">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
