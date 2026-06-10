import React from "react";

import {
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { FaFileInvoice } from "react-icons/fa";

import visa from "@/public/image copy 8.png";
import mastercard from "@/public/image copy 9.png";
import rupay from "@/public/image copy 10.png";
import upi from "@/public/image copy 11.png";
import logoFooter from "@/public/footer-logo-dev.svg";
import logoPc from "@/public/logo pc copy.svg";
import msmeLogo from "@/public/national-emblem-or-symbol.webp";
import makeInIndiaLogo from "@/public/Make-in-India-LOGO.webp";

import { MdEmail } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-[#f7f7f7] border-t border-amber-200">
      {/* TOP SECTION */}
      <div className="page-shell py-12">
        <div className="flex justify-between flex-wrap flex-col sm:flex-row gap-7">
          {/* LOGO & SOCIAL */}
          <div className="w-fit">
            <Image
              height={40}
              width={120}
              src={logoPc}
              alt="Pahadi Collections"
              className="h-10 w-auto"
            />

            <p className="mt-6 text-lg font-medium text-gray-800">We Accept</p>

            <div className="flex items-center gap-3 mt-4">
              <div className="bg-white px-4 py-2 rounded-md shadow-sm text-sm font-semibold">
                <Image
                  height={24}
                  width={48}
                  src={visa}
                  alt="Visa"
                  className="h-6 w-auto"
                />
              </div>

              <div className="bg-white px-4 py-2 rounded-md shadow-sm text-sm font-semibold">
                <Image
                  height={24}
                  width={48}
                  src={mastercard}
                  alt="MasterCard"
                  className="h-6 w-auto"
                />
              </div>

              <div className="bg-white px-4 py-2 rounded-md shadow-sm text-sm font-semibold">
                <Image
                  height={24}
                  width={48}
                  src={rupay}
                  alt="RuPay"
                  className="h-6 w-auto"
                />
              </div>

              <div className="bg-white px-4 py-2 rounded-md shadow-sm text-sm font-semibold">
                <Image
                  height={24}
                  width={48}
                  src={upi}
                  alt="UPI"
                  className="h-6 w-auto"
                />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-lg font-medium text-gray-800">Follow Us</p>

              <div className="flex items-center gap-5 mt-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61585854546423#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-gray-700 hover:text-blue-600 transition-all duration-300 cursor-pointer"
                  title="Follow us on Facebook"
                >
                  <FaFacebookF />
                </a>

                <a
                  href="https://www.instagram.com/pahadi_collections/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-gray-700 hover:text-pink-600 transition-all duration-300 cursor-pointer"
                  title="Follow us on Instagram"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">My Account</h2>

            <div className="flex flex-col gap-4 mt-6 text-gray-600">
              <Link
                href="/login"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Login / Register
              </Link>

              <Link
                href="/wishlist"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Wishlist
              </Link>

              <Link
                href="/cart"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                My Cart
              </Link>

              <Link
                href="/account/orders"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Track Orders
              </Link>

              <Link
                href="/account/reviews"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                My Reviews
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Categories</h2>

            <div className="flex flex-col gap-4 mt-6 text-gray-600">
              <Link
                href="/category/all-jewellery"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                All Jewellery
              </Link>

              <Link
                href="/category/mangalsutra"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Mangalsutra
              </Link>

              <Link
                href="/category/earrings"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Earrings
              </Link>

              <Link
                href="/category/necklaces"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Necklaces
              </Link>

              <Link
                href="/category/rings"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Rings
              </Link>

              <Link
                href="/category/bridal-sets"
                className="hover:text-amber-500 cursor-pointer transition-all"
              >
                Bridal Sets
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Contact Information
            </h2>

            <div className="flex flex-col gap-5 mt-6 text-gray-600">
              <div className="flex items-start gap-3">
                <FaPhoneAlt className="mt-1 text-blue-500" />

                <p>+91 9749388527</p>
              </div>

              <div className="flex items-start gap-3">
                <FaWhatsapp className="mt-1 text-green-500" />

                <p>+91 9749388527</p>
              </div>

              <div className="flex items-start gap-3">
                <MdEmail className="mt-1 text-red-500 text-xl" />

                <p>pahadicollections124@gmail.com</p>
              </div>

              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-1 text-blue-500" />

                <p>
                  Shanti Nagar Near Jhali Basti TCP,
                  <br />
                  Near Khaprail Bazar,
                  <br />
                  Siliguri, West Bengal,
                  <br />
                  India - 734009
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COMPLIANCE SECTION */}
        <div className="mt-14 pt-10 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
            <div className="flex items-center gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-amber-200 flex items-center justify-center group-hover:border-amber-500 transition-colors p-2">
                 <FaFileInvoice className="text-2xl text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">GST Registered Business</p>
                <p className="text-lg font-extrabold text-gray-900 tracking-tight">19CMBPG6864P1ZB</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 shadow-md border border-amber-200 flex items-center justify-center group-hover:border-amber-500 transition-colors p-1.5 overflow-hidden">
                <Image
                  src={msmeLogo}
                  alt="MSME Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  MSME Udyam Registered
                </p>
                <p className="text-lg font-extrabold text-gray-900 tracking-tight">
                  UDYAM-WB-06-0067888
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 px-6 py-3 bg-white border-2 border-amber-500 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1">
              <Image
                src={makeInIndiaLogo}
                alt="Make In India"
                width={120}
                height={50}
                className="h-10 w-auto contrast-125"
              />
              <div className="h-8 w-px bg-amber-200 mx-1" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                  Proudly
                </span>
                <span className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                  Make In India 
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-10 border-t border-gray-300 relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#f7f7f7] px-4 text-amber-500 text-xl">
            ✦
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-sm">
          <p>
            © Pahadi Collections. All Rights Reserved -{" "}
            {new Date().getFullYear()}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/terms-and-conditions"
              className="hover:text-amber-500 cursor-pointer transition-all"
            >
              Terms & Conditions
            </Link>

            <span>|</span>

            <Link
              href="/privacy-policy"
              className="hover:text-amber-500 cursor-pointer transition-all"
            >
              Privacy Policy
            </Link>

            <span>|</span>

            <Link
              href="/shipping-policy"
              className="hover:text-amber-500 cursor-pointer transition-all"
            >
              Shipping Policy
            </Link>

            <span>|</span>

            <Link
              href="/refund-policy"
              className="hover:text-amber-500 cursor-pointer transition-all"
            >
              Refund & Return Policy
            </Link>
          </div>

          <p className="flex gap-2 items-center">
            <Link
              href="https://rebootai.in/"
              className="font-semibold text-black"
            >
              <Image
                height={20}
                width={80}
                src={logoFooter}
                alt="Reboot AI"
                className="h-5 w-auto brightness-200 invert"
              />
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
