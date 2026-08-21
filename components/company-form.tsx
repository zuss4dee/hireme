"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCompanyAction, type FormState } from "@/lib/actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Creating profile…" : "Create company profile"}</button>;
}

export function CompanyForm() {
  const [state, action] = useActionState<FormState, FormData>(createCompanyAction, undefined);
  return (
    <form action={action} className="card flex flex-col gap-5 p-6">
      {state?.error ? <p className="rounded-xl border border-pink/30 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">{state.error}</p> : null}
      <div>
        <label className="label" htmlFor="name">Company name</label>
        <input id="name" name="name" required className="field" placeholder="Nova AI" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="logo">Logo URL</label>
          <input id="logo" name="logo" className="field" placeholder="https://…/logo.png" />
        </div>
        <div>
          <label className="label" htmlFor="website">Website</label>
          <input id="website" name="website" required className="field" placeholder="nova.ai" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">About the company</label>
        <textarea id="description" name="description" rows={5} className="field resize-none" placeholder="What are you building, and why should talented people care?" />
      </div>
      <Submit />
    </form>
  );
}
