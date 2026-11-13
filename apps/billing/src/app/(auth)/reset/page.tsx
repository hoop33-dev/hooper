import { AuthWrap } from "@/src/components/auth/AuthWrap";
import { parsePackageParam } from "@/src/lib/routes";
import { type SearchParams } from "../loadPackage";
import { ResetForm } from "./ResetForm";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const slug = parsePackageParam((await searchParams).package);
  return (
    <AuthWrap>
      <ResetForm slug={slug} />
    </AuthWrap>
  );
}
