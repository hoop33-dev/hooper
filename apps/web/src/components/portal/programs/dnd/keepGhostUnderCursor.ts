import type { Modifier } from "@dnd-kit/core";
import { getEventCoordinates } from "@dnd-kit/utilities";

/**
 * The drag ghost is a small fixed-size card, but dnd-kit pins it to the
 * top-left of the element being dragged. Grabbing a tall element (a sequence
 * row, a whole block) low down would leave the ghost floating above the
 * pointer. When the grab point falls outside the ghost on an axis, this
 * centres the ghost on the pointer along that axis instead.
 */
export const keepGhostUnderCursor: Modifier = ({
  transform,
  activatorEvent,
  activeNodeRect,
  overlayNodeRect,
}) => {
  if (!activatorEvent || !activeNodeRect || !overlayNodeRect) return transform;
  const pointer = getEventCoordinates(activatorEvent);
  if (!pointer) return transform;

  const grabX = pointer.x - activeNodeRect.left;
  const grabY = pointer.y - activeNodeRect.top;
  return {
    ...transform,
    x:
      grabX > overlayNodeRect.width
        ? transform.x + grabX - overlayNodeRect.width / 2
        : transform.x,
    y:
      grabY > overlayNodeRect.height
        ? transform.y + grabY - overlayNodeRect.height / 2
        : transform.y,
  };
};
