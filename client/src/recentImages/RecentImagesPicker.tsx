import {
  ActionIcon,
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconArrowBackUp, IconUpload, IconX } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import { notifyError } from "../notifyError";
import classes from "./RecentImagesPicker.module.css";
import { forgetImage, restoreImage, type RecentImage } from "./recentImages";

export interface ChoiceTile {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

export interface RecentImagesPickerProps {
  images: RecentImage[];
  // A map image or a background is one picture; tokens may be several.
  multiple: boolean;
  confirmLabel: string;
  onChoose: (images: RecentImage[]) => void;
  onUpload: () => void;
  // Other ways to add, shown beside "Upload"; with them the dialog opens even without images.
  moreTiles: ChoiceTile[];
  onDone: () => void;
}

function without(ids: ReadonlySet<string>, id: string) {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export function RecentImagesPicker({
  images,
  multiple,
  confirmLabel,
  onChoose,
  onUpload,
  moreTiles,
  onDone,
}: RecentImagesPickerProps) {
  const tiles: ChoiceTile[] = [
    { label: "Upload", icon: <IconUpload size={20} />, onClick: onUpload },
    ...moreTiles,
  ];
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  // Removed images keep their tile until the dialog closes, so a slip can be undone in place.
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());

  function toggle(id: string) {
    setChosen((previous) => {
      const next = new Set(multiple ? previous : []);
      if (!previous.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function remove(image: RecentImage) {
    try {
      await forgetImage(image.id);
    } catch (error) {
      notifyError(`Could not remove ${image.name}`, error);
      return;
    }
    setRemoved((previous) => new Set(previous).add(image.id));
    setChosen((previous) => without(previous, image.id));
  }

  async function undoRemove(image: RecentImage) {
    try {
      await restoreImage(image);
    } catch (error) {
      notifyError(`Could not bring back ${image.name}`, error);
      return;
    }
    setRemoved((previous) => without(previous, image.id));
  }

  return (
    <Stack>
      <Group gap="xs">
        {tiles.map(({ label, icon, onClick }) => (
          <UnstyledButton
            key={label}
            className={`${classes.image} ${classes.tile}`}
            onClick={() => {
              onClick();
              onDone();
            }}
          >
            {icon}
            <Text size="xs">{label}</Text>
          </UnstyledButton>
        ))}
        {images.map((image) => {
          const isRemoved = removed.has(image.id);
          return (
            <div key={image.id} className={classes.entry}>
              <Tooltip label={image.name} disabled={image.name === ""}>
                <UnstyledButton
                  className={classes.image}
                  aria-label={image.name}
                  aria-pressed={chosen.has(image.id)}
                  disabled={isRemoved}
                  onClick={() => toggle(image.id)}
                >
                  <img src={image.dataUrl} alt="" width={64} height={64} />
                </UnstyledButton>
              </Tooltip>
              {isRemoved ? (
                <Tooltip label="Undo">
                  <ActionIcon
                    className={classes.undo}
                    variant="default"
                    radius="xl"
                    aria-label={`Undo removing ${image.name}`}
                    onClick={() => void undoRemove(image)}
                  >
                    <IconArrowBackUp size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Tooltip label="Remove from recent images">
                  <ActionIcon
                    className={classes.remove}
                    variant="default"
                    size="sm"
                    radius="xl"
                    aria-label={`Remove ${image.name} from recent images`}
                    onClick={() => void remove(image)}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </div>
          );
        })}
      </Group>
      <Group justify="flex-end">
        <Button variant="default" onClick={onDone}>
          Cancel
        </Button>
        <Button
          disabled={chosen.size === 0}
          onClick={() => {
            onChoose(images.filter(({ id }) => chosen.has(id)));
            onDone();
          }}
        >
          {confirmLabel}
        </Button>
      </Group>
    </Stack>
  );
}
