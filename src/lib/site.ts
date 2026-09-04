export type SiteIdentity = {
  name: string;
  tagline: string;
  owner: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  url: string;
};

export function contactHrefs(email: string, phone: string) {
  const digits = phone.replace(/\D/g, "");
  const e164 =
    digits.length === 10
      ? `+1${digits}`
      : digits.length === 11 && digits.startsWith("1")
        ? `+${digits}`
        : digits
          ? `+${digits}`
          : "";
  return {
    emailHref: email ? `mailto:${email}` : "",
    phoneHref: e164 ? `tel:${e164}` : "",
  };
}

export const site: SiteIdentity & {
  phoneHref: string;
  emailHref: string;
} = {
  name: "CriticalThinkers.us",
  tagline: "Make America Think Again",
  owner: "Joe Ierisi",
  email: "joei21407@gmail.com",
  phone: "941-447-2352",
  phoneDisplay: "(941) 447-2352",
  url: "https://criticalthinkers.us",
  ...contactHrefs("joei21407@gmail.com", "941-447-2352"),
};
