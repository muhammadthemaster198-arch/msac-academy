"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { State } from "@/app/auth/actions";
type Field = { name: string; label: string; type?: string; autoComplete?: string; defaultValue?: string; required?: boolean };
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 w-full rounded-full bg-navy px-5 py-3 font-bold text-white hover:bg-violet disabled:opacity-60">{pending ? "Please wait..." : label}</button>;
}
export default function AuthForm({ action, fields, submit, hidden }: { action: (s: State, f: FormData) => Promise<State>; fields: Field[]; submit: string; hidden?: Record<string, string> }) {
  const [state, formAction] = useFormState(action, {} as State);
  return (<form action={formAction} className="space-y-4">
    {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    {fields.map(f => (<div key={f.name}><label htmlFor={f.name} className="mb-1 block text-sm font-semibold">{f.label}</label>
      <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} defaultValue={f.defaultValue} required={f.required !== false}
        className="min-h-12 w-full rounded-xl border border-navy/20 bg-white px-4 text-base" /></div>))}
    {state.error && <p role="alert" className="rounded-xl bg-coral/15 p-3 text-sm font-medium text-navy">{state.error}</p>}
    {state.ok && <p role="status" className="rounded-xl bg-mint/25 p-3 text-sm font-medium text-navy">{state.ok}</p>}
    <Submit label={submit} />
  </form>);
}
