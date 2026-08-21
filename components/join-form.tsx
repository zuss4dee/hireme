"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "./avatar";
import { createProfileAction, type FormState } from "@/lib/actions";
import { AVAILABILITY_LABEL, type Availability } from "@/lib/types";
import { parseSkills } from "@/lib/skills";
import { MIN_BID, usd } from "@/lib/money";
import { profilePath } from "@/lib/site";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full text-base disabled:opacity-60">
      {pending ? "Taking you to payment…" : "Claim my spot →"}
    </button>
  );
}

export function JoinForm({ boardBids }: { boardBids: number[] }) {
  const [state, action] = useActionState<FormState, FormData>(createProfileAction, undefined);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState<Availability>("open");
  const [bid, setBid] = useState(MIN_BID);
  const username = slug(name) || "you";
  const parsedSkills = parseSkills(skills);
  // Same arithmetic the server does: your bid slots you in wherever it lands.
  const projectedRank = boardBids.filter((b) => b >= bid).length + 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={action} className="flex flex-col gap-5">
        {state?.error ? (
          <p className="rounded-xl border border-pink/40 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">{state.error}</p>
        ) : null}

        <div className="card flex flex-col gap-4 p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Who are you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Damilare Adeosun" />
            </div>
            <div>
              <label className="label" htmlFor="title">Role / title</label>
              <input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="AI Product Builder" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="photo">Profile picture (image URL)</label>
            <input id="photo" name="photo" value={photo} onChange={(e) => setPhoto(e.target.value)} className="field" placeholder="https://…/me.jpg" />
            <p className="mt-1 text-xs text-muted">No link? We&apos;ll draw you a loud gradient instead.</p>
          </div>
          <div>
            <label className="label" htmlFor="bio">Why hire me</label>
            <textarea id="bio" name="bio" rows={3} maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} className="field resize-none" placeholder="I ship AI products fast. Last one went 0 → 40k users in six weeks." />
            <p className="mt-1 text-right text-xs text-muted">{bio.length}/280</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="location">Location</label>
              <input id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} className="field" placeholder="London, UK" />
            </div>
            <div>
              <label className="label" htmlFor="availability">Availability</label>
              <select id="availability" name="availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)} className="field">
                {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((k) => (
                  <option key={k} value={k} className="bg-surface">{AVAILABILITY_LABEL[k]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Proof</h2>
          <div>
            <label className="label" htmlFor="portfolio_url">Show your work *</label>
            <input id="portfolio_url" name="portfolio_url" required className="field" placeholder="yoursite.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="linkedin_url">LinkedIn</label>
              <input id="linkedin_url" name="linkedin_url" className="field" placeholder="optional" />
            </div>
            <div>
              <label className="label" htmlFor="github_url">GitHub</label>
              <input id="github_url" name="github_url" className="field" placeholder="optional" />
            </div>
            <div>
              <label className="label" htmlFor="twitter_url">X / Twitter</label>
              <input id="twitter_url" name="twitter_url" className="field" placeholder="optional" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="skills">Skills</label>
            <textarea
              id="skills"
              name="skills"
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="field resize-y"
              placeholder={"Paste them however you like:\nNext.js, LLM apps, Product\n• TypeScript\n• Design systems"}
            />
            <p className="mt-1 text-xs text-muted">
              Commas, new lines or bullets — paste straight from your CV and we&apos;ll sort it out.
            </p>
            {parsedSkills.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parsedSkills.map((sk) => (
                  <span key={sk} className="chip border-violet/30 bg-violet/10 text-violet">{sk}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="contact_email">Contact email</label>
            <input id="contact_email" name="contact_email" type="email" required className="field" placeholder="you@example.com" />
            <p className="mt-1 text-xs text-muted">Hidden until a company pays to unlock it. Never shown publicly.</p>
          </div>
          <input type="hidden" name="username" value={username} />
        </div>

        <div className="card flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Claim your position</h2>
            <p className="mt-1 text-sm text-muted">
              Your bid is your rank. Outbid someone and you take their place — {usd(bid)} puts you at{" "}
              <span className="font-black text-fg">#{projectedRank}</span> right now.
            </p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-money">$</span>
            <input
              id="bid"
              name="bid"
              type="number"
              required
              min={MIN_BID / 100}
              step="1"
              value={Number.isFinite(bid) ? bid / 100 : ""}
              onChange={(e) => setBid(Math.round(Number(e.target.value) * 100))}
              className="field !py-4 !pl-10 !text-3xl !font-black tabular-nums"
            />
          </div>
          <p className={`text-xs ${bid < MIN_BID ? "text-pink" : "text-muted"}`}>
            Minimum {usd(MIN_BID)}. You pay on the next screen — nothing goes public until it clears.
          </p>
        </div>

        <Submit />
        <p className="text-center text-xs text-muted">
          No free spots, and no account to create — you&apos;ll get a private link to manage your
          listing after paying.
        </p>
      </form>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted">Live preview</p>
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || "You"} src={photo} size={64} />
            <div className="min-w-0">
              <div className="truncate text-xl font-black tracking-tight">{name || "Your name"}</div>
              <div className="truncate text-sm text-muted">{title || "Your role"}</div>
              <div className="mt-1 text-xs text-muted">{profilePath(username)}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-fg/80">{bio || "Your pitch shows up right here. Make it embarrassing to ignore."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip border-lime/30 text-money">{AVAILABILITY_LABEL[availability]}</span>
            {location ? <span className="chip">📍 {location}</span> : null}
            {parsedSkills.slice(0, 5).map((s) => (
              <span key={s} className="chip">{s}</span>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">opening bid</div>
              <div className="text-2xl font-black text-money">{usd(bid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">lands at</div>
              <div className="text-2xl font-black text-gold">#{projectedRank}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
