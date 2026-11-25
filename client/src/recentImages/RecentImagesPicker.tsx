import {
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import classes from "./RecentImagesPicker.module.css";
import type { RecentImage } from "./recentImages";

export interface RecentImagesPickerProps {
  images: RecentImage[];
  // A map image or a background is one picture; tokens may be several.
  multiple: boolean;
  confirmLabel: string;
  onChoose: (images: RecentImage[]) => void;
  onUpload: () => void;
  onDone: () => void;
}

export function RecentImagesPicker({
  images,
  multiple,
  confirmLabel,
  onChoose,
  onUpload,
  onDone,
}: RecentImagesPickerProps) {
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
        <UnstyledButton
          className={`${classes.image} ${classes.upload}`}
          onClick={() => {
            onUpload();
            onDone();
          }}
        >
          <IconUpload size={20} />
          <Text size="xs">Upload</Text>
        </UnstyledButton>
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
