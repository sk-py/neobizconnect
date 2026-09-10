export type CountryCode = {
  name: string;
  dial: string;
  flag: string;
};

export const COUNTRY_CODES: CountryCode[] = [
  { name: "India", dial: "+91", flag: "🇮🇳" },
  { name: "United States", dial: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { name: "Afghanistan", dial: "+93", flag: "🇦🇫" },
  { name: "Albania", dial: "+355", flag: "🇦🇱" },
  { name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { name: "American Samoa", dial: "+1", flag: "🇦🇸" },
  { name: "Andorra", dial: "+376", flag: "🇦🇩" },
  { name: "Angola", dial: "+244", flag: "🇦🇴" },
  { name: "Anguilla", dial: "+1", flag: "🇦🇮" },
  { name: "Antigua and Barbuda", dial: "+1", flag: "🇦🇬" },
  { name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { name: "Armenia", dial: "+374", flag: "🇦🇲" },
  { name: "Australia", dial: "+61", flag: "🇦🇺" },
  { name: "Austria", dial: "+43", flag: "🇦🇹" },
  { name: "Azerbaijan", dial: "+994", flag: "🇦🇿" },
  { name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { name: "Belarus", dial: "+375", flag: "🇧🇾" },
  { name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { name: "Bhutan", dial: "+975", flag: "🇧🇹" },
  { name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { name: "Brunei", dial: "+673", flag: "🇧🇳" },
  { name: "Bulgaria", dial: "+359", flag: "🇧🇬" },
  { name: "Cambodia", dial: "+855", flag: "🇰🇭" },
  { name: "Canada", dial: "+1", flag: "🇨🇦" },
  { name: "China", dial: "+86", flag: "🇨🇳" },
  { name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { name: "Finland", dial: "+358", flag: "🇫🇮" },
  { name: "France", dial: "+33", flag: "🇫🇷" },
  { name: "Germany", dial: "+49", flag: "🇩🇪" },
  { name: "Greece", dial: "+30", flag: "🇬🇷" },
  { name: "Hong Kong", dial: "+852", flag: "🇭🇰" },
  { name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { name: "Iran", dial: "+98", flag: "🇮🇷" },
  { name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { name: "Israel", dial: "+972", flag: "🇮🇱" },
  { name: "Italy", dial: "+39", flag: "🇮🇹" },
  { name: "Japan", dial: "+81", flag: "🇯🇵" },
  { name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { name: "Kazakhstan", dial: "+7", flag: "🇰🇿" },
  { name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { name: "Maldives", dial: "+960", flag: "🇲🇻" },
  { name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { name: "Norway", dial: "+47", flag: "🇳🇴" },
  { name: "Oman", dial: "+968", flag: "🇴🇲" },
  { name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { name: "Poland", dial: "+48", flag: "🇵🇱" },
  { name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { name: "Russia", dial: "+7", flag: "🇷🇺" },
  { name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { name: "Spain", dial: "+34", flag: "🇪🇸" },
  { name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { name: "Ukraine", dial: "+380", flag: "🇺🇦" },
  { name: "Vietnam", dial: "+84", flag: "🇻🇳" },
];

export function splitPhoneNumber(full: string): { dial: string; local: string } {
  const trimmed = (full || "").trim();
  if (!trimmed.startsWith("+")) {
    return { dial: "+91", local: trimmed };
  }

  const sortedByLength = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sortedByLength) {
    if (trimmed.startsWith(c.dial)) {
      return { dial: c.dial, local: trimmed.slice(c.dial.length) };
    }
  }

  return { dial: "+91", local: trimmed.replace(/^\+91/, "") };
}