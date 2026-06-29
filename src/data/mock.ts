// Exact mock data recovered from the shipped bundle (original/index.android.bundle.decompiled.js).
// Transaction amounts were stored as uint32 in the original JS engine — small negatives like -50
// appear as 4294967246 (= 2^32 - 50). All values below are corrected back to signed integers.
//
// The mockUser object (name:'James Nthiga', phone:'0702283114', pin:'1234') that shipped in the
// original has been REMOVED (see docs/AUDIT.md §4.2). PII replaced with obviously-fake values.

export type Transaction = {
  id: number;
  date: string;
  name: string;
  phone: string;
  amount: number; // negative = money out, positive = money in
  time: string;
  initials: string;
  avatarColor: string;
};

/** 10 exact original transactions (names/phones from the bundle, amounts corrected). */
export const sampleTransactions: Transaction[] = [
  { id: 1,  date: "2026-05-07", name: "Stephen Njuguna",   phone: "254725***794", amount: -50,     time: "07:49 AM", initials: "SN", avatarColor: "#BBDEFB" },
  { id: 2,  date: "2026-05-06", name: "Margret Ndwiga",    phone: "254707***205", amount: -100,    time: "06:55 PM", initials: "MN", avatarColor: "#FCE4EC" },
  { id: 3,  date: "2026-05-06", name: "Martin Gathogo",    phone: "0703***464",   amount: -50,     time: "05:36 PM", initials: "MG", avatarColor: "#E8F5E9" },
  { id: 4,  date: "2026-05-06", name: "M-Pesa Overdraw",   phone: "232323",       amount: -172.24, time: "02:04 PM", initials: "MO", avatarColor: "#EDE7F6" },
  { id: 5,  date: "2026-05-06", name: "Emmaculate Nthiga", phone: "254725***192", amount: 400,     time: "02:04 PM", initials: "EN", avatarColor: "#E3F2FD" },
  { id: 6,  date: "2026-05-06", name: "Simon Kiarie",      phone: "0700***740",   amount: -70,     time: "07:47 AM", initials: "SK", avatarColor: "#F1F8E9" },
  { id: 7,  date: "2026-05-06", name: "M-Pesa Overdraw",   phone: "232323",       amount: -86,     time: "07:30 AM", initials: "MO", avatarColor: "#EDE7F6" },
  { id: 8,  date: "2026-05-06", name: "Im App",            phone: "517819",       amount: 400,     time: "07:29 AM", initials: "IA", avatarColor: "#E8EAF6" },
  { id: 9,  date: "2026-05-05", name: "John Kamau",        phone: "0722***111",   amount: -200,    time: "03:15 PM", initials: "JK", avatarColor: "#FFF8E1" },
  { id: 10, date: "2026-05-05", name: "Mary Wanjiru",      phone: "254701***320", amount: 1000,    time: "11:22 AM", initials: "MW", avatarColor: "#FCE4EC" },
];

export type QuickAction = {
  key: string;
  label: string;
  icon: string; // Ionicons name
  route: string;
};

/** Original action labels and order from the bundle (id-to-label map at line 338756 ff.). */
export const quickActions: QuickAction[] = [
  { key: "send",       label: "Send Money",      icon: "send-outline",          route: "/send"       },
  { key: "withdraw",   label: "Withdraw Money",  icon: "cash-outline",          route: "/withdraw"   },
  { key: "lipa",       label: "Lipa na M-PESA",  icon: "pricetags-outline",     route: "/pay"        },
  { key: "airtime",    label: "Airtime Top up",  icon: "call-outline",          route: "/airtime"    },
  { key: "bundles",    label: "Buy Bundles",     icon: "wifi-outline",          route: "/bundles"    },
  { key: "request",    label: "Request Money",   icon: "download-outline",      route: "/request"    },
  { key: "scan",       label: "Scan QR",         icon: "scan-outline",          route: "/scan"       },
  { key: "statements", label: "Statements",      icon: "document-text-outline", route: "/statements" },
];

/** Groups a transaction date string into a display header. */
export function formatDateHeader(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" });
}

/** Bundle tiers offered in the Buy Bundles screen. */
export type BundlePack = {
  id: string;
  label: string;
  data: string;
  validity: string;
  price: number;
};

export const bundlePacks: BundlePack[] = [
  { id: "d50mb",  label: "Daily 50 MB",    data: "50 MB",   validity: "1 day",    price: 20  },
  { id: "d1gb",   label: "Daily 1 GB",     data: "1 GB",    validity: "1 day",    price: 50  },
  { id: "w5gb",   label: "Weekly 5 GB",    data: "5 GB",    validity: "7 days",   price: 200 },
  { id: "w10gb",  label: "Weekly 10 GB",   data: "10 GB",   validity: "7 days",   price: 350 },
  { id: "m20gb",  label: "Monthly 20 GB",  data: "20 GB",   validity: "30 days",  price: 700 },
  { id: "m50gb",  label: "Monthly 50 GB",  data: "50 GB",   validity: "30 days",  price: 1200},
  { id: "m100gb", label: "Monthly 100 GB", data: "100 GB",  validity: "30 days",  price: 2000},
];
