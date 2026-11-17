import { PageBody, TopBar } from "@/src/components/shell/Shell";
import { AddChildForm } from "./AddChildForm";

export default function AddChildPage() {
  return (
    <>
      <TopBar
        title="Add a child"
        sub="They get their own login for the Hooper app. You stay in charge of billing."
        back={{ href: "/children", label: "Children" }}
        crumbs={[
          { label: "Children", href: "/children" },
          { label: "Add a child" },
        ]}
      />
      <PageBody>
        <AddChildForm />
      </PageBody>
    </>
  );
}
