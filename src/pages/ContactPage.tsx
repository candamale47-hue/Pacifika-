import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageCircle, Facebook, Instagram, Clock } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const { data: storeSettings } = trpc.settings.getGroup.useQuery({ group: "general" });

  const settings = storeSettings ?? [];
  const storeEmail = settings.find((s) => s.key === "store_email")?.value ?? "joelandamale@gmail.com";
  const storePhone = settings.find((s) => s.key === "store_phone")?.value ?? "+61 460 786 986";
  const storeAddress = settings.find((s) => s.key === "store_address")?.value ?? "Cairns, QLD, Australia";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const openMessenger = () => {
    window.open("https://m.me/pacifikawear", "_blank");
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent("Hi! I have a question about Pacifika Wear.");
    window.open(`https://wa.me/${storePhone.replace(/\D/g, "")}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 bg-[#0F1923]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <Link to="/account" className="p-1">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Contact Us
        </h1>
      </header>

      {/* Store Info Cards */}
      <div className="px-4 mt-4 space-y-3">
        <div className="bg-[#243656] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#5BA4CF]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-[#5BA4CF]" />
          </div>
          <div>
            <p className="text-xs text-[#8A94A6]">Email</p>
            <a href={`mailto:${storeEmail}`} className="text-sm font-medium text-[#F0EDE6]">
              {storeEmail}
            </a>
          </div>
        </div>

        <div className="bg-[#243656] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#5BA4CF]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone size={18} className="text-[#5BA4CF]" />
          </div>
          <div>
            <p className="text-xs text-[#8A94A6]">Phone</p>
            <a href={`tel:${storePhone.replace(/\s/g, "")}`} className="text-sm font-medium text-[#F0EDE6]">
              {storePhone}
            </a>
          </div>
        </div>

        <div className="bg-[#243656] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#5BA4CF]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-[#5BA4CF]" />
          </div>
          <div>
            <p className="text-xs text-[#8A94A6]">Store Location</p>
            <p className="text-sm font-medium text-[#F0EDE6]">{storeAddress}</p>
          </div>
        </div>

        <div className="bg-[#243656] rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#D4A03C]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-[#D4A03C]" />
          </div>
          <div>
            <p className="text-xs text-[#8A94A6]">Business Hours</p>
            <p className="text-sm font-medium text-[#F0EDE6]">Mon - Fri: 9am - 5pm AEST</p>
            <p className="text-xs text-[#8A94A6]">Sat: 10am - 2pm &middot; Sun: Closed</p>
          </div>
        </div>
      </div>

      {/* Quick Messaging Buttons */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold mb-3">Message Us</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={openMessenger}
            className="bg-[#0084FF]/20 border border-[#0084FF]/30 rounded-xl p-4 flex flex-col items-center gap-2 active:scale-[0.98]"
          >
            <MessageCircle size={22} className="text-[#0084FF]" />
            <span className="text-xs font-medium">Facebook Messenger</span>
          </button>
          <button
            onClick={openWhatsApp}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col items-center gap-2 active:scale-[0.98]"
          >
            <Phone size={22} className="text-green-400" />
            <span className="text-xs font-medium">WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="px-4 mt-5">
        <h3 className="text-sm font-semibold mb-3">Follow Us</h3>
        <div className="flex gap-3">
          <a
            href="https://facebook.com/pacifikawear"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#243656] rounded-xl flex items-center justify-center"
          >
            <Facebook size={20} className="text-[#5BA4CF]" />
          </a>
          <a
            href="https://instagram.com/pacifikawear"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#243656] rounded-xl flex items-center justify-center"
          >
            <Instagram size={20} className="text-[#E1306C]" />
          </a>
        </div>
      </div>

      {/* Contact Form */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold mb-3">Send a Message</h3>
        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <Send size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-semibold mb-1">Message Sent!</p>
            <p className="text-sm text-[#8A94A6]">We will get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Your Name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
            <input
              type="email"
              placeholder="Email Address *"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            />
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none"
            >
              <option value="">Select a topic</option>
              <option value="order">Order Inquiry</option>
              <option value="return">Return / Exchange</option>
              <option value="product">Product Question</option>
              <option value="sizing">Sizing Help</option>
              <option value="wholesale">Wholesale / Bulk</option>
              <option value="other">Other</option>
            </select>
            <textarea
              placeholder="Your Message *"
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-[#243656] rounded-lg px-4 py-3 text-sm border border-transparent focus:border-[#D4A03C] outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full bg-[#D4A03C] text-[#1B2A4A] py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
