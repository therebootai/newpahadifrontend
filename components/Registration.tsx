"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HiOutlinePhone, HiOutlineShieldCheck } from "react-icons/hi";
import { AxiosError } from "axios";
import { shopApi } from "@/lib/fetchers";
import { useCustomerStore } from "@/lib/store/useCustomerStore";

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }

  return fallback;
};

const Registration = () => {
  const router = useRouter();
  const setCustomerAuth = useCustomerStore((state) => state.setCustomerAuth);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10 digit mobile number.");
      return;
    }

    setIsSending(true);
    setError("");
    setMessage("");

    try {
      await shopApi.post("/auth/login/send-otp", {
        phone,
      });
      setOtpSent(true);
      setMessage("OTP sent on WhatsApp.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP."));
    } finally {
      setIsSending(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpSent) {
      await sendOtp();
      return;
    }

    if (otp.trim().length < 4) {
      setError("Please enter the OTP.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setMessage("");

    try {
      const response = await shopApi.post("/auth/login/verify", {
        phone,
        otp: otp.trim(),
      });
      const data = response.data.data;
      const customer = {
        ...data.user,
        id: data.user?._id || data.user?.id,
      };

      setCustomerAuth(customer, data.accessToken);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid OTP. Please try again."));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Pahadi Collections
          </h1>

          <p className="mt-2 text-gray-500">
            Login or register with WhatsApp OTP
          </p>
        </div>

        <form onSubmit={verifyOtp} className="mt-10 space-y-5">
          <div className="relative">
            <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />

            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => setPhone(normalizePhone(event.target.value))}
              placeholder="Mobile Number"
              disabled={otpSent || isSending || isVerifying}
              className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 outline-none transition-all focus:border-gray-400 disabled:bg-gray-50"
            />
          </div>

          {otpSent && (
            <div className="relative">
              <HiOutlineShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter OTP"
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 outline-none transition-all focus:border-gray-400"
              />
            </div>
          )}

          {message && (
            <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSending || isVerifying}
            className="w-full cursor-pointer rounded-2xl bg-amber-600 py-4 text-lg font-medium text-white transition-all hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {otpSent
              ? isVerifying
                ? "Verifying..."
                : "Verify OTP"
              : isSending
              ? "Sending OTP..."
              : "Send WhatsApp OTP"}
          </button>

          {otpSent && (
            <button
              type="button"
              onClick={sendOtp}
              disabled={isSending || isVerifying}
              className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Resend OTP
            </button>
          )}
        </form>
      </div>
    </section>
  );
};

export default Registration;
