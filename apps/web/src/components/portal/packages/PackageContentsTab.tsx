"use client";

import { formatProgramSub, plural } from "@/src/lib/format";
import { TeamTile } from "../athletes/AthleteAvatar";
import {
  DetailError,
  DetailListCard,
  DetailRow,
  RemoveButton,
} from "../ui/DetailListCard";
import { LetterTile } from "../ui/LetterTile";
import { CoachAvatar, coachName } from "./PackageAtoms";
import { coachSub, usePackageDetailContext } from "./PackageDetailShell";

function CoachesCard() {
  const { state, openModal } = usePackageDetailContext();
  const { coaches } = state.local;
  return (
    <DetailListCard
      title="Coaches"
      count={coaches.length}
      onAdd={() => openModal("coach")}
      emptyLabel="No coaches on this package."
      emptyCta="Add coach">
      {coaches.map((c) => (
        <DetailRow
          key={c.id}
          lead={<CoachAvatar coach={c} size={34} />}
          title={coachName(c)}
          sub={coachSub(c)}
          trail={
            <RemoveButton
              label={coachName(c)}
              onClick={() => state.removeCoach(c.id)}
            />
          }
        />
      ))}
    </DetailListCard>
  );
}

function ProgramsCard() {
  const { state, openModal } = usePackageDetailContext();
  const { programs } = state.local;
  return (
    <DetailListCard
      title="Programs"
      count={programs.length}
      onAdd={() => openModal("program")}
      emptyLabel="No programs in this package."
      emptyCta="Add program">
      {programs.map((p) => (
        <DetailRow
          key={p.id}
          href={`/programs/${p.id}`}
          lead={<LetterTile name={p.name} />}
          title={p.name}
          sub={formatProgramSub(p)}
          trail={
            <RemoveButton
              label={p.name}
              onClick={() => state.removeProgram(p.id)}
            />
          }
        />
      ))}
    </DetailListCard>
  );
}

/** Buyers join these teams while their plan is active. */
function TeamsCard() {
  const { state, memberCounts, openModal } = usePackageDetailContext();
  const { teams } = state.local;
  return (
    <DetailListCard
      title="Teams"
      count={teams.length}
      onAdd={() => openModal("team")}
      emptyLabel="Buyers join these teams while their plan is active."
      emptyCta="Add team">
      {teams.map((t) => (
        <DetailRow
          key={t.id}
          href={`/teams/${t.id}`}
          lead={<TeamTile team={t} size={34} />}
          title={t.name}
          sub={plural(memberCounts.get(t.id) ?? 0, "athlete")}
          trail={
            <RemoveButton
              label={t.name}
              onClick={() => state.removeTeam(t.id)}
            />
          }
        />
      ))}
    </DetailListCard>
  );
}

/** What a buyer gets: coaches, programs and teams, each addable and
 * removable. */
export function PackageContentsTab() {
  const { state } = usePackageDetailContext();
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-7">
      <DetailError error={state.error} />
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <CoachesCard />
        <ProgramsCard />
        <TeamsCard />
      </div>
    </div>
  );
}
