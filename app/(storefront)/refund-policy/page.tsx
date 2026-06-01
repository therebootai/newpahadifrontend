import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund & Return Policy</h1>
        <p className="text-sm text-gray-400 mb-8 font-bold uppercase tracking-widest">
          Effective Date: May 31, 2026
        </p>

        <div className="prose prose-amber max-w-none space-y-8 text-gray-600 leading-relaxed">
          <p>
            At Pahadi Collections, most products are handmade and artisan-crafted. Due to the nature of these products, refunds and returns are generally not applicable unless specifically mentioned on the product page.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">1</span>
              Non-Refundable Products
            </h2>
            <div className="pl-11 space-y-4">
              <p>Unless otherwise stated, products sold on this website are:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Non-returnable</li>
                <li>Non-refundable</li>
                <li>Non-exchangeable</li>
              </ul>
              <p className="font-bold text-gray-800">Customers are strongly advised to carefully review product descriptions, measurements, and specifications before placing an order.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">2</span>
              Refund Eligibility
            </h2>
            <div className="pl-11 space-y-4">
              <p>Refunds or replacements may only be considered in the following cases:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Wrong product delivered</li>
                <li>Major manufacturing defect</li>
                <li>Product damaged during transit</li>
                <li>Missing items in shipment</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">3</span>
              Mandatory Proof Requirement
            </h2>
            <div className="pl-11 space-y-4">
              <p>For any issue claims, customers must provide:</p>
              <ul className="list-disc pl-5 space-y-2 font-bold text-gray-800">
                <li>Clear product photos</li>
                <li>Packaging images</li>
                <li>Unboxing video</li>
                <li>Order details</li>
              </ul>
              <p>Claims without sufficient proof may not be accepted.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">4</span>
              Reporting Timeline
            </h2>
            <div className="pl-11">
              <p>Any issue must be reported within <span className="font-bold text-gray-900">24 hours of delivery</span> through the Contact page available on the website. Late claims may not be eligible for review.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">5</span>
              Handmade Product Variations
            </h2>
            <div className="pl-11">
              <p>Minor variations in color, texture, shape, finishing, and craft patterns are natural characteristics of handmade products and shall not qualify as defects.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">6</span>
              Refund Processing
            </h2>
            <div className="pl-11 space-y-4">
              <p>If a refund is approved:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Refunds will be processed to the original payment method</li>
                <li>Processing timelines may vary depending on banks and payment providers</li>
                <li>Pahadi Collections shall not be responsible for banking delays</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">7</span>
              Cancellation Policy
            </h2>
            <div className="pl-11">
              <p>Orders may only be cancelled before shipment processing begins. Once shipped, cancellation requests may not be accepted.</p>
            </div>
          </section>

          <section className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 text-xs">8</span>
              Contact Support
            </h2>
            <div className="pl-11">
              <p>For any refund-related concern, customers may contact us through the Contact page or using the details available in the website footer.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
