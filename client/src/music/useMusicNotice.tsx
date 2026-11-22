import { Button, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Room } from "../room/createRoom";
import { useMusicStarts } from "../room/useMusicStarts";

const NOTICE_ID = "music";

// iOS starts no sound without a tap in the player, so everyone is pointed to it.
export function useMusicNotice(
  room: Room,
  isSynced: boolean,
  onListen: () => void,
) {
  useMusicStarts(room.musicMap, isSynced, () =>
    notifications.show({
      id: NOTICE_ID,
      autoClose: 8000,
      message: (
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">Music is playing</Text>
          <Button
            size="compact-sm"
            variant="light"
            onClick={() => {
              notifications.hide(NOTICE_ID);
              onListen();
            }}
          >
            Listen
          </Button>
        </Group>
      ),
    }),
  );
}
