"use client";

import { useActionState, useId } from "react";
import { requestLoan } from "@/server/actions/loans";

export function RequestLoanForm({
  equipmentId,
  name,
  disabledReason,
}: {
  equipmentId: string;
  name: string;
  disabledReason: string | null;
}) {
  const [state, action, pending] = useActionState(requestLoan, { message: "" });
  const statusId = useId();
  return (
    <form action={action} className="loan-form" aria-busy={pending}>
      <input type="hidden" name="equipmentId" value={equipmentId} />
      <button
        className="button"
        type="submit"
        disabled={Boolean(disabledReason) || pending}
        aria-label={`Solicitar empréstimo: ${name}`}
        aria-describedby={statusId}
      >
        {pending ? "Solicitando…" : "Solicitar empréstimo"}
      </button>
      <p id={statusId} className="form-status" role="status" aria-live="polite">
        {pending
          ? "Solicitação em andamento…"
          : state.message || disabledReason}
      </p>
    </form>
  );
}
