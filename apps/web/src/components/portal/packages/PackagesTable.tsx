"use client";

import { formatPackagePriceCell } from "@/src/lib/packages";
import type { PackageSummary } from "@hooper/db";
import { AppLink } from "../ui/AppLink";
import { UsersIcon } from "../ui/icons";
import { CoachAvatar, PackageTile } from "./PackageAtoms";

const COLUMNS = ["Package", "Programs", "Coaches", "Price", "Active", ""];

function Dash() {
  return <span className="text-portal-text3">—</span>;
}

function ProgramsCell({ programs }: { programs: PackageSummary["programs"] }) {
  if (programs.length === 0) return <Dash />;
  return (
    <>
      {programs[0].name}
      {programs.length > 1 && ` +${programs.length - 1}`}
    </>
  );
}

function CoachesCell({ coaches }: { coaches: PackageSummary["coaches"] }) {
  if (coaches.length === 0) return <Dash />;
  return (
    <div className="flex">
      {coaches.map((coach, i) => (
        <CoachAvatar
          key={coach.id}
          coach={coach}
          size={26}
          className={
            i > 0 ? "-ml-2 border-2 border-white" : "border-2 border-white"
          }
        />
      ))}
    </div>
  );
}

export function PackagesTable({ packages }: { packages: PackageSummary[] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-portal-border border-b">
          {COLUMNS.map((h) => (
            <th
              key={h}
              className="text-portal-text3 pt-4 pr-6 pb-3 text-left text-[11px] font-semibold tracking-widest uppercase last:pr-0">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {packages.map((pkg) => {
          const price = formatPackagePriceCell(pkg);
          return (
            <tr
              key={pkg.id}
              className="border-portal-border hover:bg-portal-bg relative cursor-pointer border-b">
              <td className="py-3.5 pr-6">
                <AppLink
                  href={`/packages/${pkg.slug}`}
                  className="flex items-center gap-3 after:absolute after:inset-0 after:z-0">
                  <PackageTile size={36} />
                  <div className="min-w-0">
                    <div className="text-portal-text1 text-[13px] font-bold">
                      {pkg.name}
                    </div>
                    <div className="text-portal-text3 mt-px text-[11px]">
                      {pkg.slug}
                    </div>
                  </div>
                </AppLink>
              </td>
              <td className="text-portal-text2 py-3.5 pr-6 text-[13px]">
                <ProgramsCell programs={pkg.programs} />
              </td>
              <td className="py-3.5 pr-6">
                <CoachesCell coaches={pkg.coaches} />
              </td>
              <td className="py-3.5 pr-6 text-[13px]">
                <div className="text-portal-text1 font-semibold">
                  {price.price}
                </div>
                <div className="text-portal-text3 mt-px text-[11px]">
                  {price.sub}
                </div>
              </td>
              <td className="py-3.5 pr-6 text-[13px]">
                {/* Purchases arrive in a later billing phase. */}
                <span className="text-portal-text3 inline-flex items-center gap-1.5 font-semibold">
                  <UsersIcon size={14} />0
                </span>
              </td>
              <td className="py-3.5 text-right">
                <span className="border-portal-border text-portal-text2 rounded-md border px-3 py-1.5 text-xs font-semibold whitespace-nowrap">
                  View package
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
