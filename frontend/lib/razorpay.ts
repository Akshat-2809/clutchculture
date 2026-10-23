// Razorpay Standard Checkout loader (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: "INR";
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (res: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: () => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Couldn't load Razorpay. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return loading;
}

/** Opens the Razorpay popup. Resolves with the signed result, or null if closed/failed. */
export async function openRazorpay(
  options: Omit<RazorpayOptions, "handler" | "modal" | "currency">,
): Promise<RazorpaySuccess | null> {
  await loadScript();
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: RazorpaySuccess | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const rzp = new window.Razorpay!({
      ...options,
      currency: "INR",
      theme: { color: "#efcf6a" },
      handler: (res) => done(res),
      modal: { ondismiss: () => done(null) },
    });
    rzp.on("payment.failed", () => done(null));
    rzp.open();
  });
}
