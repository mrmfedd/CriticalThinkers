"use client";

import { FormEvent, useState } from "react";

export function ContactForm({
  owner,
  email,
  emailHref,
}: {
  owner: string;
  email: string;
  emailHref: string;
}) {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const senderEmail = String(form.get("email") || "");
    const message = String(form.get("message") || "");
    const body = encodeURIComponent(
      `From: ${name} <${senderEmail}>\n\n${message}`,
    );
    window.location.href = `${emailHref}?subject=${encodeURIComponent(
      "Store inquiry",
    )}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-md border border-white/10 bg-black/30 p-6 text-steel">
        Your email app should open a message to {owner} at {email}. If
        it does not, write him directly.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        Name
        <input
          name="name"
          required
          className="rounded border border-white/20 bg-black px-3 py-2 text-white"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded border border-white/20 bg-black px-3 py-2 text-white"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Message
        <textarea
          name="message"
          required
          rows={6}
          className="rounded border border-white/20 bg-black px-3 py-2 text-white"
        />
      </label>
      <button
        type="submit"
        className="rounded bg-flagRed px-6 py-3 font-display tracking-[0.16em] text-white uppercase"
      >
        Email {owner}
      </button>
    </form>
  );
}
