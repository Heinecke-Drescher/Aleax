import {
  Alert,
  Anchor,
  Button,
  Center,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { createRoomId } from "../../../shared/roomId";
import { RecentRooms } from "../recentRooms/RecentRooms";
import { IS_PEER_TO_PEER } from "../room/connection/connectRoom";
import { NEW_ROOM_STATE } from "./newRoom";

// The guide in the README, as the website itself points to no server of its own.
const SERVER_GUIDE =
  "https://github.com/Heinecke-Drescher/Aleax#host-a-game-for-your-friends";

export function HomePage() {
  const navigate = useNavigate();

  return (
    // At least the screen's height, so the notice can make a small phone scroll.
    <Center mih="100dvh" p="md">
      <Stack align="center">
        <Title>Aleax</Title>
        <Text c="dimmed">A shared map and dice for your tabletop group.</Text>
        {IS_PEER_TO_PEER && (
          // Without a server, no copy outlives the players' browsers.
          <Alert
            color="red"
            icon={<IconAlertTriangle />}
            title="Rooms are saved only in this browser"
            maw={420}
          >
            Browsers can delete them without asking, for example when site data
            is cleared, a private window is closed, space runs low or the site
            was not visited for a while. Another browser or device has no copy.
            To keep a room, use <b>Export map</b> in the map menu.
            <Text size="sm" mt="xs">
              This version connects the players directly (peer to peer). For
              rooms that are saved automatically, run Aleax on a server:{" "}
              <Anchor href={SERVER_GUIDE} target="_blank" size="sm">
                Host a game on a server
              </Anchor>
              .
            </Text>
          </Alert>
        )}
        <Button
          size="lg"
          onClick={() =>
            navigate(`/r/${createRoomId()}`, { state: NEW_ROOM_STATE })
          }
        >
          Create room
        </Button>
        <RecentRooms />
        <Anchor
          href={`${import.meta.env.BASE_URL}licenses.txt`}
          size="xs"
          c="dimmed"
        >
          Open source licenses
        </Anchor>
      </Stack>
    </Center>
  );
}
