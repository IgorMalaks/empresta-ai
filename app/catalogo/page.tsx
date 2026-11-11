import { EquipmentPhoto } from "@/components/equipment-photo";
import { daySP } from "@/components/loan-dates";
import { Navigation } from "@/components/navigation";
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
    <>
      <Navigation current="catalogo" />
      <section className="page-heading">
        <p className="eyebrow">Escolha o que precisa</p>
        <h1>Catálogo de equipamentos</h1>
        <p>
          Empréstimo imediato por 14 dias úteis. Sábados e domingos não contam;
          feriados contam nesta versão.
        </p>
        <p className="counter">{loans.length} de 5 empréstimos em aberto</p>
      </section>
      {blockedReason && (
        <p className="notice" role="status">
          {blockedReason}
        </p>
      )}
      <PhotoCredit
        sources={equipments.map((equipment) => equipment.sourceUrl)}
      />
      {equipments.length === 0 ? (
        <section className="panel">
          <h2>O catálogo ainda está vazio</h2>
          <p>
            Não há equipamentos cadastrados para exibir. A preparação dos dados
            deve ser concluída pelo responsável.
          </p>
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
                  <h2>{equipment.nome}</h2>
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
    </>
  );
}
