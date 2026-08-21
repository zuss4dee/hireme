"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createOpportunityAction, type FormState } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Publishing…" : "Create opportunity"}</button>;
}

export function OpportunityForm() {
  const [state, action] = useActionState<FormState, FormData>(createOpportunityAction, undefined);
  return (
    <form action={action} className="card flex flex-col gap-5 p-6">
      {state?.error ? <p className="rounded-xl border border-pink/30 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">{state.error}</p> : null}
      <div>
        <label className="label" htmlFor="title">Role / title</label>
        <input id="title" name="title" required className="field" placeholder="Growth Marketing Lead" />
      </div>
      <div>
        <label className="label" htmlFor="description">What are you looking for?</label>
        <textarea id="description" name="description" required rows={6} className="field resize-none" placeholder="We are looking for someone who can own our growth strategy and help scale our product." />
      </div>
      <div>
        <label className="label" htmlFor="skills">Skills needed</label>
        <textarea id="skills" name="skills" rows={3} className="field resize-none" placeholder="Growth, Lifecycle, SQL, Product marketing" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="salary_range">Salary range <span className="font-normal normal-case tracking-normal">optional</span></label>
          <input id="salary_range" name="salary_range" className="field" placeholder="$100k–$140k" />
        </div>
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" name="location" className="field" placeholder="London, UK" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="remote_status">Work style</label>
        <select id="remote_status" name="remote_status" defaultValue="remote" className="field">
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">On-site</option>
        </select>
      </div>
      <Submit />
    </form>
  );
}
