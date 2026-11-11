import { DashboardLayout } from "@/components/dashboard-layout";
import { EquipmentPhoto } from "@/components/equipment-photo";
import { daySP, formatDueOn } from "@/components/loan-dates";
import { PhotoCredit, PhotographerCredit } from "@/components/photo-credit";
import { RequestLoanForm } from "@/components/request-loan-form";
import { requireUser } from "@/server/auth/supabase";
import { listEquipments, listMyLoans } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const user = await requireUser();
  const [equipments, loans] = await Promise.all([
    listEquipments(),
    listMyLoans(user.id),
  ]);
  const today = daySP(new Date());
  const overdue = loans.some(
    (loan) => loan.dueOn.toISOString().slice(0, 10) < today,
  );
  const blockedReason = overdue
    ? "Você tem empréstimo em atraso. Novas solicitações estão bloqueadas."
    : loans.length >= 5
      ? "Você atingiu o limite de cinco empréstimos em aberto."
      : null;
  const statuses: Record<string, string> = {
    disponivel: "Disponível",
    manutencao: "Em manutenção",
    emprestado: "Emprestado",
  };
  return (
    <DashboardLayout current="catalogo">
      <section className="panel loan-overview" aria-labelledby="open-loans">
        <h2 id="open-loans">Meus empréstimos em aberto</h2>
        {loans.length === 0 ? (
          <p className="muted">Você não tem empréstimos em aberto.</p>
        ) : (
          <ul>
            {loans.map((loan) => (
              <li key={loan.id}>
                {loan.equipment.nome} · Vence em{" "}
                <time dateTime={loan.dueOn.toISOString().slice(0, 10)}>
                  {formatDueOn(loan.dueOn)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <p className="muted">{loans.length} de 5 · Prazo de 14 dias úteis</p>
      </section>
      {blockedReason && (
        <p className="notice" role="status">
          {blockedReason}
        </p>
      )}
      <section aria-labelledby="equipment-title">
        <div className="equipment-heading">
          <h2 id="equipment-title">Equipamentos</h2>
          <PhotoCredit
            sources={equipments.map((equipment) => equipment.sourceUrl)}
          />
        </div>
        {equipments.length === 0 ? (
          <section className="panel empty-state">
            <p>Nenhum equipamento cadastrado.</p>
          </section>
        ) : (
          <ul className="equipment-grid">
            {equipments.map((equipment) => {
              const status = statuses[equipment.situacao] ?? "Indisponível";
              const disabledReason =
                equipment.situacao !== "disponivel" ? status : blockedReason;
              return (
                <li className="panel equipment-card" key={equipment.id}>
                  <EquipmentPhoto
                    imageUrl={equipment.imageUrl}
                    name={equipment.nome}
                  />
                  <div className="card-body">
                    <div className="card-meta">
                      <span>{equipment.patrimonio}</span>
                      <span
                        className={`badge ${equipment.situacao === "disponivel" ? "badge-available" : "badge-unavailable"}`}
                      >
                        {status}
                      </span>
                    </div>
                    <h3 className="font-semibold">{equipment.nome}</h3>
                    <p className="muted">{equipment.categoria}</p>
                    <PhotographerCredit
                      photographer={equipment.photographer}
                      sourceUrl={equipment.sourceUrl}
                    />
                    <RequestLoanForm
                      equipmentId={equipment.id}
                      name={equipment.nome}
                      disabledReason={disabledReason}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
