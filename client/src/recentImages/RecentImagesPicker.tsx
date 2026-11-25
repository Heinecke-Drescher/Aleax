import {
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import classes from "./RecentImagesPicker.module.css";
import type { RecentImage } from "./recentImages";

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

  function toggle(id: string) {
    setChosen((previous) => {
      const next = new Set(multiple ? previous : []);
      if (!previous.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
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
        {images.map((image) => (
          <Tooltip
            key={image.id}
            label={image.name}
            disabled={image.name === ""}
          >
            <UnstyledButton
              className={classes.image}
              aria-label={image.name}
              aria-pressed={chosen.has(image.id)}
              onClick={() => toggle(image.id)}
            >
              <img src={image.dataUrl} alt="" width={64} height={64} />
            </UnstyledButton>
          </Tooltip>
        ))}
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
