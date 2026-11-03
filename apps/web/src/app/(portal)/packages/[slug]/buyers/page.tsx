import { PackageBuyersTab } from "@/src/components/portal/packages/PackageBuyersTab";
import {
  getPackageBySlug,
  listPackageBuyers,
} from "@/src/services/package.service";
import { notFound } from "next/navigation";

export default async function PackageBuyersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // getPackageBySlug is cache()'d, so on a full load this reuses the
  // layout's fetch; on a tab switch both queries run together.
  const [packageResult, buyersResult] = await Promise.all([
    getPackageBySlug(slug),
    listPackageBuyers(slug),
  ]);
  if (!packageResult.ok) notFound();

  return (
    <>
      {!buyersResult.ok && (
        <div className="border-b border-red-200 bg-red-50 px-7 py-2 text-xs text-red-600">
          Couldn&apos;t load buyers: {buyersResult.error}
        </div>
      )}
      <PackageBuyersTab buyers={buyersResult.ok ? buyersResult.data : []} />
    </>
  );
}
