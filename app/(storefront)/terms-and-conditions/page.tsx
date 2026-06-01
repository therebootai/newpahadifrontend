import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-400 mb-8 font-bold uppercase tracking-widest">
          Effective Date: May 31, 2026
        </p>

        <div className="prose prose-amber max-w-none space-y-8 text-gray-600 leading-relaxed">
          <p>
            Welcome to Pahadi Collections. By accessing or using our website{' '}
            <a href="https://pahadicollections.com" className="text-amber-600 font-bold hover:underline">
              https://pahadicollections.com
            </a>
            , you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully before using our services.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">1</span>
              Company Information
            </h2>
            <div className="pl-11 space-y-1">
              <p className="font-bold text-gray-900">Pahadi Collections</p>
              <p>Shanti Nagar Near Jhali Basti TCP (Near Khaprail Bazar)</p>
              <p>Siliguri, West Bengal – 734009</p>
              <p>India</p>
              <p className="pt-2">
                <span className="font-bold text-gray-400 uppercase text-[10px] mr-2">GSTIN:</span>
                19CMBPG6864P1ZB
              </p>
              <p>
                <span className="font-bold text-gray-400 uppercase text-[10px] mr-2">Phone:</span>
                +91 9749388527
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">2</span>
              Nature of Products
            </h2>
            <div className="pl-11 space-y-4">
              <p>Pahadi Collections specializes in handmade Nepali-inspired fashion jewellery and accessories.</p>
              <p>Our products are:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Handmade and artisan-crafted</li>
                <li>Non-gold jewellery</li>
                <li>Non-silver jewellery</li>
                <li>Diamond-free</li>
                <li>Precious metal free</li>
              </ul>
              <p className="italic bg-gray-50 p-4 rounded-xl border-l-4 border-amber-400">
                Products sold on this website are fashion and lifestyle accessories and should not be considered fine jewellery or investment-grade ornaments.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">3</span>
              Product Representation
            </h2>
            <div className="pl-11 space-y-4">
              <p>We strive to display product images, colors, textures, and descriptions as accurately as possible. However:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Handmade products may contain slight variations</li>
                <li>Minor differences in texture, shape, finishing, and color may occur</li>
                <li>Actual product colors may vary slightly due to screen settings and photography lighting</li>
              </ul>
              <p className="font-bold text-gray-800">Such variations shall not be considered defects.</p>
              <p>Customers are advised to carefully read product descriptions, sizing details, material information, and care instructions before placing orders.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">4</span>
              Eligibility to Use
            </h2>
            <div className="pl-11">
              <p>By using this website, you confirm that:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>You are legally capable of entering into binding contracts under Indian law</li>
                <li>You are at least 18 years old or using the platform under parental supervision</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">5</span>
              Pricing & Payments
            </h2>
            <div className="pl-11 space-y-4">
              <p>All prices listed on the website are in Indian Rupees (INR).</p>
              <p>Payments are securely processed through Razorpay and may include:</p>
              <div className="flex flex-wrap gap-2">
                {['UPI', 'Debit Cards', 'Credit Cards', 'Net Banking', 'Wallets', 'EMI'].map(method => (
                  <span key={method} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">{method}</span>
                ))}
              </div>
              <p>Pahadi Collections does not store complete payment card details.</p>
              <p>We reserve the right to change pricing without prior notice, cancel orders affected by technical pricing errors, or refuse suspicious or fraudulent transactions.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">6</span>
              Order Acceptance & Cancellation
            </h2>
            <div className="pl-11 space-y-4">
              <p>Once an order is placed, you will receive an order confirmation via email or SMS.</p>
              <p>Pahadi Collections reserves the right to accept or reject any order, cancel orders due to stock unavailability, or cancel suspicious transactions.</p>
              <p>In such cases, refunds (if applicable) will be processed to the original payment method.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">7</span>
              Shipping & Delivery
            </h2>
            <div className="pl-11 space-y-4">
              <p>Shipping timelines, delivery procedures, and logistics information are governed by our Shipping Policy.</p>
              <p>Delivery timelines are estimated and may vary due to courier delays, weather conditions, regional restrictions, or festivals.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">8</span>
              Returns, Refunds & Exchanges
            </h2>
            <div className="pl-11 space-y-4">
              <p>Refunds and returns are governed by our Refund Policy.</p>
              <p>Most products sold on Pahadi Collections are non-returnable unless explicitly stated otherwise on the product page.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">9</span>
              User Conduct
            </h2>
            <div className="pl-11">
              <p>You agree not to use the website for unlawful purposes, attempt unauthorized access, interfere with functionality, or upload harmful code.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">10</span>
              Intellectual Property
            </h2>
            <div className="pl-11 space-y-4">
              <p>All content on this website including logos, branding, product photography, text, graphics, and designs are the intellectual property of Pahadi Collections.</p>
              <p>Unauthorized use, reproduction, or distribution is prohibited.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">11</span>
              Limitation of Liability
            </h2>
            <div className="pl-11 space-y-4">
              <p>Pahadi Collections shall not be liable for indirect damages, delayed deliveries, losses arising from misuse of products, or allergic reactions.</p>
              <p className="font-bold">Customers are advised to discontinue use if any irritation or discomfort occurs from accessories.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">12</span>
              Third-Party Services
            </h2>
            <div className="pl-11">
              <p>Our platform may integrate third-party services including Razorpay and Shiprocket. We are not directly responsible for operational failures of third-party platforms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">13</span>
              Privacy
            </h2>
            <div className="pl-11">
              <p>Customer data handling practices are governed by our Privacy Policy.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">14</span>
              Governing Law & Jurisdiction
            </h2>
            <div className="pl-11">
              <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts located in Siliguri, West Bengal.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">15</span>
              Modifications
            </h2>
            <div className="pl-11">
              <p>Pahadi Collections reserves the right to modify these Terms & Conditions at any time without prior notice.</p>
            </div>
          </section>

          <section className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 text-xs">16</span>
              Contact Information
            </h2>
            <div className="pl-11 space-y-2">
              <p>For any questions, concerns, or support requests, reach us using the details below:</p>
              <p><span className="font-bold text-gray-400 uppercase text-[10px] mr-2">Phone:</span> +91 9749388527</p>
              <p><span className="font-bold text-gray-400 uppercase text-[10px] mr-2">Website:</span> https://pahadicollections.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
