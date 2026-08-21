"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar } from "./avatar";
import { createProfileAction, type FormState } from "@/lib/actions";
import { AVAILABILITY_LABEL, type Availability } from "@/lib/types";

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full text-base disabled:opacity-60">
      {pending ? "Putting you on the board…" : "Put me on the board →"}
    </button>
  );
}

export function JoinForm() {
  const [state, action] = useActionState<FormState, FormData>(createProfileAction, undefined);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState<Availability>("open");
  const username = slug(name) || "you";

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
            <label className="label" htmlFor="bio">One-line pitch</label>
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
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Your links are your CV</h2>
          <div>
            <label className="label" htmlFor="portfolio_url">Portfolio / site / GitHub *</label>
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
            <label className="label" htmlFor="skills">Skills (comma separated)</label>
            <input id="skills" name="skills" value={skills} onChange={(e) => setSkills(e.target.value)} className="field" placeholder="Next.js, LLM apps, Product" />
          </div>
          <div>
            <label className="label" htmlFor="contact_email">Contact email</label>
            <input id="contact_email" name="contact_email" type="email" required className="field" placeholder="you@example.com" />
            <p className="mt-1 text-xs text-muted">Hidden until a recruiter pays to unlock it. Never shown publicly.</p>
          </div>
          <input type="hidden" name="username" value={username} />
        </div>

        <Submit />
        <p className="text-center text-xs text-muted">Joining is free. Climbing is not.</p>
      </form>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted">Live preview</p>
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar name={name || "You"} src={photo} size={64} />
            <div className="min-w-0">
              <div className="truncate text-xl font-black tracking-tight">{name || "Your name"}</div>
              <div className="truncate text-sm text-muted">{title || "Your role"}</div>
              <div className="mt-1 text-xs text-muted">hireme.lol/{username}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-fg/80">{bio || "Your one-line pitch shows up right here. Make it embarrassing to ignore."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip border-lime/30 text-money">{AVAILABILITY_LABEL[availability]}</span>
            {location ? <span className="chip">📍 {location}</span> : null}
            {skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 5)
              .map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">starting bid</div>
              <div className="text-2xl font-black text-money">$0</div>
            </div>
            <div className="text-right text-xs text-muted">
              You&apos;ll pick a bid
              <br />
              on the next screen.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
