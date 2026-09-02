import { resolveDisplayName } from "@/src/lib/blockExerciseDisplay";
import { cn } from "@/src/lib/cn";
import { LOGO_PRINT_DATA_URI } from "@/src/lib/print/logoPrintDataUri";
import {
  blockMetaLine,
  buildSetTableModel,
  countExercises,
  groupSessionsByWeek,
  resolveStyleName,
  sessionsPerWeekLabel,
  supersetLetter,
  thumbnailFor,
  weekCoverageLabel,
} from "@/src/lib/programExport";
import type {
  BlockExerciseWithDetails,
  BlockWithExercises,
  ExerciseStyleRow,
  ProgramWithSessions,
  SessionWithBlocks,
} from "@hooper/db";
import type { ElementType } from "react";

/** `<doc-page>` is a custom element defined by /vendor/doc-page.js at
 * runtime — React just needs to emit the tag and its light-DOM children. */
const DocPage = "doc-page" as unknown as ElementType;

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;900&family=Outfit:wght@300;400;500;600;700&display=swap";

/** Ported from the Claude Design source (`Program Export -PDF-.html`), with
 * the metagrid trimmed to 3 columns (no stored "Phase"), `<image-slot>`
 * swapped for `<img>`, and a body reset so the portal's dark theme doesn't
 * bleed into the sheet. */
const DOC_CSS = `
doc-page:not(:defined){visibility:hidden}
:root{--ink:#000;--ink2:#3a3a3a;--ink3:#6b6b6b;--hair:#c9c9c9;--fill:#f0f0f0;--accent:#F15825}
html,body{margin:0!important;padding:0!important;background:#fff!important;color:#000!important}
h1,h2,h3,.blockname,.sessnum,.num,.setcount{font-family:'Barlow Condensed',sans-serif;letter-spacing:0.015em}
.doc{font-family:'Outfit',sans-serif;color:var(--ink);font-size:12px;line-height:1.5}
.rh{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;border-bottom:2px solid var(--ink);padding-bottom:8px}
.rh img{height:34px;width:auto;display:block}
.rh .rht{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:0.06em;text-transform:uppercase}
.rh .rhs{font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3)}
.rf{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--hair);padding-top:6px;font-size:9.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3)}
.cover{margin-top:26px}
.cover .logo{height:78px;width:auto;display:block;margin-bottom:22px}
.eyebrow{font-size:10.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px}
h1{font-size:46px;font-weight:900;text-transform:uppercase;line-height:0.98;margin:0 0 6px}
.sub{font-size:14px;color:var(--ink2);margin-bottom:24px}
.fields{display:grid;gap:18px;margin-bottom:26px}
.field label{display:block;font-size:9.5px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink3);margin-bottom:5px}
.field .val{border-bottom:1px solid var(--ink);padding:2px 0 6px;font-size:16px;font-weight:500;min-height:22px;white-space:pre-wrap}
.field .val.multi{font-size:13px;font-weight:400;line-height:1.6;min-height:74px;border:1px solid var(--hair);border-bottom-color:var(--ink);padding:9px 11px}
.field .val.empty{color:#b4b4b4}
.metagrid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--ink);margin-bottom:26px}
.metagrid div{padding:11px 12px;border-right:1px solid var(--hair)}
.metagrid div:last-child{border-right:none}
.metagrid dt{font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink3);margin-bottom:3px}
.metagrid dd{margin:0;font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:700;line-height:1}
.metagrid dd small{font-family:'Outfit',sans-serif;font-size:11px;font-weight:400;color:var(--ink2)}
h3.sec{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;padding-bottom:5px;border-bottom:1px solid var(--ink)}
h3.sec.spaced{margin-top:22px}
table.week{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:22px}
table.week th{text-align:left;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink3);padding:0 8px 6px 0;border-bottom:1px solid var(--hair)}
table.week td{padding:8px 8px 8px 0;border-bottom:1px solid var(--hair);vertical-align:top}
table.week td.num,table.week th.num{font-variant-numeric:tabular-nums}
.legend{border:1px solid var(--hair);background:var(--fill);padding:12px 14px;font-size:11px;line-height:1.6;color:var(--ink2);break-inside:avoid}
.legend b{color:var(--ink);font-weight:600}
.session{break-before:auto;margin-top:26px}
.session.weekstart{break-before:page;margin-top:0}
.sesshead{break-after:avoid;break-inside:avoid;display:flex;align-items:center;gap:14px;background:var(--ink);color:#fff;padding:12px 14px;margin:0 0 16px}
.sessnum{font-size:40px;font-weight:900;line-height:1;color:#fff}
.sesstitle{flex:1}
.sesstitle h2{font-size:26px;font-weight:900;text-transform:uppercase;margin:0;line-height:1}
.sessmeta{font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.72);margin-top:4px}
.sessdate{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.6)}
.sessdate .rule{display:block;width:96px;border-bottom:1px solid rgba(255,255,255,0.55);height:14px}
.block{margin-bottom:18px;break-inside:avoid}
.blockhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;border-bottom:1.5px solid var(--ink);padding-bottom:4px;margin-bottom:10px}
.blockname{font-size:16px;font-weight:700;text-transform:uppercase}
.blockmeta{font-size:9.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3)}
.superset .exlist{border-left:3px solid var(--ink);padding-left:11px}
.exlist{display:flex;flex-direction:column;gap:12px}
.ex{display:flex;gap:12px;break-inside:avoid}
.thumb{width:104px;flex-shrink:0}
.thumb img{display:block;width:104px;height:68px;border:1px solid var(--ink);object-fit:cover}
.thumb .ph{display:flex;width:104px;height:68px;border:1px solid var(--ink);align-items:center;justify-content:center;font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink3);background:var(--fill);text-align:center}
.vlink{display:block;font-size:8.5px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink);text-decoration:none;border-bottom:1px solid var(--hair);padding-top:4px}
.exbody{flex:1;min-width:0}
.exhead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.exhead .letter{width:17px;height:17px;flex-shrink:0;background:var(--ink);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
.exname{font-size:15px;font-weight:600}
.setcount{font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink3)}
.tag{font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;border:1px solid var(--ink);padding:2px 6px}
table.sets{width:100%;border-collapse:collapse;font-size:12px}
table.sets th{text-align:left;font-size:8.5px;font-weight:600;letter-spacing:0.11em;text-transform:uppercase;color:var(--ink3);padding:0 6px 4px 0;border-bottom:1px solid var(--ink);white-space:nowrap}
table.sets td{padding:5px 6px 5px 0;border-bottom:1px solid var(--hair);font-variant-numeric:tabular-nums}
table.sets .c-set{width:34px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700}
table.sets .c-style{width:88px;font-size:10.5px;letter-spacing:0.04em;text-transform:uppercase;color:var(--ink2)}
table.sets .c-log{width:30%;background:var(--fill)}
.note{font-size:11px;color:var(--ink2);margin-top:5px;padding-left:9px;border-left:2px solid var(--hair)}
a{color:#000}
/* In print, doc-page.js fixes the running header/footer to the page edge and
 * relies on ::slotted padding that reads var(--doc-page-margin) to inset
 * them. That custom property doesn't reach the slotted (light-DOM) element
 * in Chrome's print path, so the inset collapses and the header/footer bleed
 * off the page. Give them their own box with margin (so the rule border
 * insets too, matching the on-screen sheet) — !important because an
 * outer-tree declaration must beat the shadow ::slotted rule. Keep 0.6in in
 * sync with the <doc-page margin="…"> attribute. */
@media print{
  .vlink{border-bottom-color:transparent}
  .rh{margin:0 0.6in!important;padding:0.28in 0 8px!important}
  .rf{margin:0 0.6in!important;padding:6px 0 0.28in!important}
}
`;

export type ProgramExportDocumentProps = {
  program: ProgramWithSessions;
  styles: ExerciseStyleRow[];
  coach: string;
  athlete: string;
  notes: string;
  /** Week numbers to include, sorted and validated (see resolveExportWeeks).
   * Equal in length to program.weeks means "the whole program". */
  weeks: number[];
};
type Props = ProgramExportDocumentProps;

type WeekGroup = { weekNumber: number; sessions: SessionWithBlocks[] };

function Field({
  label,
  value,
  multi,
}: {
  label: string;
  value: string;
  multi?: boolean;
}) {
  const empty = value.trim() === "";
  return (
    <div className="field">
      <label>{label}</label>
      <div className={cn("val", multi && "multi", empty && "empty")}>
        {empty ? "—" : value}
      </div>
    </div>
  );
}

function WeekSchedule({
  weekNumber,
  sessions,
  spaced,
}: {
  weekNumber: number;
  sessions: SessionWithBlocks[];
  spaced: boolean;
}) {
  return (
    <>
      <h3 className={cn("sec", spaced && "spaced")}>
        Week {weekNumber} schedule
      </h3>
      <table className="week">
        <thead>
          <tr>
            <th className="num">#</th>
            <th>Session</th>
            <th className="num">Blocks</th>
            <th className="num">Exercises</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td className="num">—</td>
              <td>No sessions yet</td>
              <td className="num">—</td>
              <td className="num">—</td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id}>
                <td className="num">{s.position + 1}</td>
                <td>{s.name}</td>
                <td className="num">{s.blocks.length}</td>
                <td className="num">{countExercises(s)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

function SetTable({
  be,
  styles,
}: {
  be: BlockExerciseWithDetails;
  styles: ExerciseStyleRow[];
}) {
  const model = buildSetTableModel(be, styles);
  return (
    <table className="sets">
      <thead>
        <tr>
          <th className="c-set">Set</th>
          {model.showStyleColumn && <th className="c-style">Style</th>}
          {model.unitColumns.map((u) => (
            <th key={u}>{u.toUpperCase()}</th>
          ))}
          <th className="c-log">Logged</th>
        </tr>
      </thead>
      <tbody>
        {model.rows.map((row) => (
          <tr key={row.setLabel}>
            <td className="c-set">{row.setLabel}</td>
            {model.showStyleColumn && (
              <td className="c-style">{row.styleName ?? "—"}</td>
            )}
            {model.unitColumns.map((u) => (
              <td key={u} className="num">
                {row.values[u]}
              </td>
            ))}
            <td className="c-log" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExerciseRow({
  be,
  letter,
  styles,
}: {
  be: BlockExerciseWithDetails;
  letter: string | null;
  styles: ExerciseStyleRow[];
}) {
  const name = resolveDisplayName(be);
  const styleTag = resolveStyleName(be, styles);
  const thumb = thumbnailFor(be.exercise);
  return (
    <div className="ex">
      <div className="thumb">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" />
        ) : (
          <div className="ph">Video frame</div>
        )}
        {be.exercise.video_url && (
          <a className="vlink" href={be.exercise.video_url}>
            Watch demo
          </a>
        )}
      </div>
      <div className="exbody">
        <div className="exhead">
          {letter && <span className="letter">{letter}</span>}
          <span className="exname">{name}</span>
          <span className="setcount">
            {be.sets} set{be.sets === 1 ? "" : "s"}
          </span>
          {styleTag && <span className="tag">{styleTag}</span>}
        </div>
        <SetTable be={be} styles={styles} />
        {be.notes && <div className="note">{be.notes}</div>}
      </div>
    </div>
  );
}

function BlockSection({
  block,
  styles,
}: {
  block: BlockWithExercises;
  styles: ExerciseStyleRow[];
}) {
  return (
    <section className={cn("block", block.is_superset && "superset")}>
      <div className="blockhead">
        <span className="blockname">{block.name}</span>
        <span className="blockmeta">
          {blockMetaLine(block.is_superset, block.sets, block.exercises.length)}
        </span>
      </div>
      <div className="exlist">
        {block.exercises.map((be, i) => (
          <ExerciseRow
            key={be.id}
            be={be}
            letter={block.is_superset ? supersetLetter(i) : null}
            styles={styles}
          />
        ))}
      </div>
    </section>
  );
}

function SessionArticle({
  session,
  weekStart,
  styles,
}: {
  session: SessionWithBlocks;
  weekStart: boolean;
  styles: ExerciseStyleRow[];
}) {
  return (
    <article className={cn("session", weekStart && "weekstart")}>
      <div className="sesshead">
        <div className="sessnum">
          {String(session.position + 1).padStart(2, "0")}
        </div>
        <div className="sesstitle">
          <h2>{session.name}</h2>
          <div className="sessmeta">
            Week {session.week_number} &nbsp;|&nbsp; Session{" "}
            {session.position + 1} &nbsp;|&nbsp; {session.blocks.length} block
            {session.blocks.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="sessdate">
          <span>Date</span>
          <span className="rule" />
        </div>
      </div>
      {session.blocks.map((block) => (
        <BlockSection key={block.id} block={block} styles={styles} />
      ))}
    </article>
  );
}

function Legend() {
  return (
    <>
      <h3 className="sec spaced">How to read this program</h3>
      <div className="legend">
        <b>Sets tables</b> list every prescribed set with its target inputs. The
        shaded <b>LOGGED</b> column is left blank for entering the actual
        result. A <b>blank</b> cell means that set doesn&apos;t use that
        measure; a <b>&mdash;</b> means the athlete records it.
        <br />
        <b>Styles</b> appear as an outlined tag next to the exercise, or per-set
        in a STYLE column when they vary.
        <br />
        <b>Supersets</b> are lettered A / B / C. Complete one round of every
        lettered exercise back to back, then repeat for the prescribed rounds.
        <br />
        <b>Videos</b> cannot play inside a PDF. Each exercise with a demo
        carries a link that opens it in the browser.
      </div>
    </>
  );
}

function CoverPage({
  program,
  coach,
  athlete,
  notes,
  sessions,
  weekGroups,
  coverage,
}: Pick<Props, "program" | "coach" | "athlete" | "notes"> & {
  sessions: SessionWithBlocks[];
  weekGroups: WeekGroup[];
  coverage: string;
}) {
  const totalSessions = sessions.length;
  const subtitle = [
    coverage || `${program.weeks} week${program.weeks === 1 ? "" : "s"}`,
    sessionsPerWeekLabel(sessions),
    `${totalSessions} session${totalSessions === 1 ? "" : "s"}`,
  ].join(" · ");

  return (
    <div className="cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src={LOGO_PRINT_DATA_URI} alt="Hoop33" />
      <div className="eyebrow">
        Training program{coverage ? ` · ${coverage}` : ""}
      </div>
      <h1>{program.name}</h1>
      <div className="sub">
        {program.description?.trim() ? program.description : subtitle}
      </div>

      <div className="fields">
        <Field label="Coach" value={coach} />
        <Field label="Program notes for the athlete" value={notes} multi />
        <Field label="Athlete" value={athlete} />
      </div>

      <div className="metagrid">
        <div>
          <dt>Duration</dt>
          <dd>
            {program.weeks} <small>weeks</small>
          </dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{sessionsPerWeekLabel(sessions)}</dd>
        </div>
        <div>
          <dt>Sessions</dt>
          <dd>
            {totalSessions} <small>{coverage ? "in export" : "total"}</small>
          </dd>
        </div>
      </div>

      {weekGroups.map((w, i) => (
        <WeekSchedule
          key={w.weekNumber}
          weekNumber={w.weekNumber}
          sessions={w.sessions}
          spaced={i > 0}
        />
      ))}

      <Legend />
    </div>
  );
}

export function ProgramExportDocument({
  program,
  styles,
  coach,
  athlete,
  notes,
  weeks,
}: Props) {
  const included = new Set(weeks);
  const sessions = program.sessions.filter((s) => included.has(s.week_number));
  const weekGroups = groupSessionsByWeek(sessions, weeks);
  const coverage = weekCoverageLabel(weeks, program.weeks);
  const sessionCount = `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
  const headerSub =
    coverage === ""
      ? `${program.weeks} weeks · ${sessionCount}`
      : `${coverage} · ${sessionCount}`;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" href={FONT_HREF} />
      <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />

      <DocPage margin="0.6in" className="doc">
        <div slot="header" className="rh">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_PRINT_DATA_URI} alt="Hoop33" />
          <div style={{ flex: 1 }}>
            <div className="rht">{program.name}</div>
            <div className="rhs">{headerSub}</div>
          </div>
          <div className="rhs">Athlete</div>
        </div>
        <div slot="footer" className="rf">
          <span>Hooper</span>
          <span>{program.name}</span>
          <span>Generated from the Hooper coach portal</span>
        </div>

        <CoverPage
          program={program}
          coach={coach}
          athlete={athlete}
          notes={notes}
          sessions={sessions}
          weekGroups={weekGroups}
          coverage={coverage}
        />

        {weekGroups.flatMap((w) =>
          w.sessions.map((session, idx) => (
            <SessionArticle
              key={session.id}
              session={session}
              weekStart={idx === 0}
              styles={styles}
            />
          )),
        )}
      </DocPage>
    </>
  );
}
