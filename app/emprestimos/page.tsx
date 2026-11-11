import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { EquipmentPhoto } from "@/components/equipment-photo";
import { daySP, formatDueOn } from "@/components/loan-dates";
import { PhotoCredit } from "@/components/photo-credit";
import { requireUser } from "@/server/auth/supabase";
import { listMyLoans } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const user = await requireUser();
  const loans = await listMyLoans(user.id);
  const today = daySP(new Date());
  const overdue = loans.some(
    (loan) => loan.dueOn.toISOString().slice(0, 10) < today,
  );
  return (
    <DashboardLayout current="emprestimos">
      <section className="page-heading">
        <p>Aqui aparecem apenas os seus empréstimos em aberto.</p>
        <p className="counter">{loans.length} de 5 empréstimos em aberto</p>
        <p className="muted">
          O vencimento vale até o fim do dia em São Paulo.
        </p>
      </section>
      {overdue && (
        <p className="notice" role="status">
          Você tem empréstimo em atraso. Novas solicitações estão bloqueadas.
        </p>
      )}
      {!overdue && loans.length >= 5 && (
        <p className="notice" role="status">
          Você atingiu o limite de cinco empréstimos em aberto.
        </p>
      )}
      <PhotoCredit sources={loans.map((loan) => loan.equipment.sourceUrl)} />
      {loans.length === 0 ? (
        <section className="panel empty-state">
          <h2>Nenhum empréstimo em aberto</h2>
          <p>
            Quando você solicitar um equipamento, ele aparecerá aqui com a data
            prevista.
          </p>
          <Link href="/catalogo" className="button">
            Ver catálogo
          </Link>
        </section>
      ) : (
        <ul className="equipment-grid">
          {loans.map((loan) => {
            const dueDay = loan.dueOn.toISOString().slice(0, 10);
            const late = dueDay < today;
            return (
              <li className="panel equipment-card" key={loan.id}>
                <EquipmentPhoto
                  imageUrl={loan.equipment.imageUrl}
                  name={loan.equipment.nome}
                />
                <div className="card-body">
                  <p className="muted">{loan.equipment.patrimonio}</p>
                  <h2>{loan.equipment.nome}</h2>
                  <p>
                    Vencimento:{" "}
                    <strong>
                      <time dateTime={dueDay}>{formatDueOn(loan.dueOn)}</time>
                    </strong>
                  </p>
                  <p>
                    Solicitado em{" "}
                    <time dateTime={loan.requestedAt.toISOString()}>
                      {new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        dateStyle: "short",
                      }).format(loan.requestedAt)}
                    </time>
                  </p>
                  <span
                    className={`badge ${late ? "badge-unavailable" : "badge-available"}`}
                  >
                    {late
                      ? "Em atraso"
                      : dueDay === today
                        ? "Vence hoje"
                        : "Dentro do prazo"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
