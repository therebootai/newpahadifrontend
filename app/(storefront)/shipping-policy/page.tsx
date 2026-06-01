import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Policy</h1>
        <p className="text-sm text-gray-400 mb-8 font-bold uppercase tracking-widest">
          Effective Date: May 31, 2026
        </p>

        <div className="prose prose-amber max-w-none space-y-8 text-gray-600 leading-relaxed">
          <p>Thank you for shopping with Pahadi Collections.</p>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">1</span>
              Order Processing Time
            </h2>
            <div className="pl-11 space-y-4">
              <p>Orders are generally processed and dispatched within 24 to 48 working hours after successful payment confirmation.</p>
              <p>Orders placed on Sundays or public holidays may be processed on the next working day.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">2</span>
              Shipping Partner
            </h2>
            <div className="pl-11 space-y-4">
              <p>All shipping and logistics operations are managed through Shiprocket and its associated courier partners.</p>
              <p>Courier partner allocation depends on:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Delivery location</li>
                <li>Service availability</li>
                <li>Shipment weight</li>
                <li>Operational efficiency</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">3</span>
              Delivery Timeline
            </h2>
            <div className="pl-11 space-y-4">
              <p>Estimated delivery timelines may vary depending on the customer’s location.</p>
              <p>Approximate timelines:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Metro cities: 3–7 business days</li>
                <li>Other locations: 4–10 business days</li>
                <li>Remote or restricted areas: Additional time may apply</li>
              </ul>
              <p className="italic">These are estimated timelines and not guaranteed delivery commitments.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">4</span>
              Tracking Orders
            </h2>
            <div className="pl-11">
              <p>Once shipped, customers will receive tracking details through SMS, email, or WhatsApp (where applicable).</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">5</span>
              Delayed Shipments
            </h2>
            <div className="pl-11 space-y-4">
              <p>Delays may occur due to weather conditions, logistics disruptions, courier issues, festivals, high order volume, or regional restrictions.</p>
              <p>Pahadi Collections shall not be held responsible for delays caused by third-party courier services.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">6</span>
              Incorrect Address
            </h2>
            <div className="pl-11 space-y-4">
              <p>Customers are responsible for providing accurate shipping details.</p>
              <p>Pahadi Collections shall not be responsible for delivery failures due to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Incorrect address</li>
                <li>Wrong phone number</li>
                <li>Incomplete delivery details</li>
              </ul>
              <p>Additional re-shipping charges may apply if shipments are returned.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">7</span>
              Refused Deliveries
            </h2>
            <div className="pl-11">
              <p>If a customer refuses delivery without valid reason, re-shipping charges may apply for future dispatches.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">8</span>
              Damaged Packaging
            </h2>
            <div className="pl-11 space-y-4">
              <p>If the package appears visibly damaged during delivery:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Customers should record an unboxing video</li>
                <li>Report the issue within 24 hours of delivery</li>
                <li>Contact support through the Contact page</li>
              </ul>
              <p className="font-bold">Claims without proper proof may not be eligible for resolution.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs">9</span>
              International Shipping
            </h2>
            <div className="pl-11 space-y-4">
              <p>International shipping availability, charges, customs duties, and timelines may vary depending on destination country and logistics support.</p>
              <p>Additional customs or import charges, if applicable, shall be borne by the customer.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
