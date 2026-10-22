import { PlusIcon, UsersIcon } from "@/src/components/icons";
import { BtnLink } from "@/src/components/ui/Btn";
import { Card, Label, Title } from "@/src/components/ui/primitives";

export function AddChildCard() {
  return (
    <Card>
      <Label className="mb-2.5">Add a child</Label>
      <div className="text-bp-text2 mb-3.5 text-[12.5px] leading-normal">
        Create their profile here — they get their own app login, and you stay
        in charge of billing.
      </div>
      <BtnLink href="/children/new" variant="primary" size="sm" full>
        <PlusIcon size={14} /> Add child
      </BtnLink>
    </Card>
  );
}

export function EmptyHousehold() {
  return (
    <Card className="mx-auto max-w-[560px] p-9 text-center md:p-9">
      <div className="bg-orange/10 text-orange mx-auto mb-4 flex size-[46px] items-center justify-center rounded-xl">
        <UsersIcon size={22} />
      </div>
      <Title className="mb-2">No children yet</Title>
      <div className="text-bp-text2 mb-5 text-[13.5px] leading-relaxed">
        Add a child to give them their own Hooper login. You can also add one
        when you buy a package — choose “For my child” at checkout.
      </div>
      <BtnLink href="/children/new" variant="primary" size="md">
        <PlusIcon size={14} /> Add child
      </BtnLink>
    </Card>
  );
}
