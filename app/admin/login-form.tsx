"use client";

import { useActionState } from "react";
import { loginAction, type AdminLoginState } from "./actions";

export function AdminLoginForm() {
  const [state, action] = useActionState<AdminLoginState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="card mx-auto mt-16 flex max-w-sm flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tighter">Moderation</h1>
        <p className="mt-1 text-sm text-muted">Paste the admin token.</p>
      </div>
      <input name="token" type="password" required autoFocus className="field" placeholder="ADMIN_TOKEN" />
      {state?.error ? <p className="text-sm font-semibold text-pink">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary">Unlock</button>
    </form>
  );
}
