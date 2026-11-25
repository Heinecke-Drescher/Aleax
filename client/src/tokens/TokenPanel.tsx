import { ActionIcon, Group, Stack, Title, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCategory, IconPlus } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useImageFileDialog } from "../images/useImageFileDialog";
import { notifyError } from "../notifyError";
import { rememberUse, type RecentImage } from "../recentImages/recentImages";
import { openImageChoice } from "../recentImages/openImageChoice";
import { useRoom } from "../room/RoomContext";
import { TOKEN_FILE_MEGABYTES, tokenFromFile } from "./addTokenFromFile";
import { useHoldTokens } from "./holdTokens";
import { PlaceholderModal } from "./PlaceholderModal";
import { TokenList } from "./TokenList";

export function TokenPanel() {
  const room = useRoom();
  const holdTokens = useHoldTokens();
  const [isPlaceholderOpen, placeholderModal] = useDisclosure(false);
  const chooseTokens = useImageFileDialog({
    maxMegabytes: TOKEN_FILE_MEGABYTES,
    multiple: true,
    // Images that arrive while others are held join them.
    onFile: async (file) => holdTokens([await tokenFromFile(room, file)]),
  });

  function holdRecentImages(images: RecentImage[]) {
    try {
      room.assertSpaceForImages(images.map(({ dataUrl }) => dataUrl));
    } catch (error) {
      notifyError("Could not add tokens", error);
      return;
    }
    images.forEach(rememberUse);
    holdTokens(
      images.map(({ name, dataUrl }) => ({ name, imageDataUrl: dataUrl })),
    );
  }

  return (
    // Fills a panel of limited size and scrolls the list below the title. The containment keeps a
    // long name from widening the panel around it, so the name is cut off instead.
    <Stack gap="xs" mih={0} flex={1} style={{ contain: "inline-size" }}>
      <Group justify="space-between" wrap="nowrap">
        <Title order={4}>Tokens</Title>
        <Tooltip label="Add tokens">
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Add tokens"
            onClick={() =>
              void openImageChoice({
                title: "Add tokens",
                kind: "token",
                multiple: true,
                confirmLabel: "Add",
                onChoose: holdRecentImages,
                onUpload: chooseTokens,
                moreTiles: [
                  {
                    label: "Placeholders",
                    icon: <IconCategory size={20} />,
                    onClick: placeholderModal.open,
                  },
                ],
              })
            }
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      {/* Measures its scrolling, so rows dragged in a scrolled list land where they are shown. */}
      <motion.div
        layoutScroll
        style={{ minHeight: 0, overflowY: "auto", scrollbarWidth: "thin" }}
      >
        <TokenList />
      </motion.div>
      <PlaceholderModal
        opened={isPlaceholderOpen}
        onClose={placeholderModal.close}
      />
    </Stack>
  );
}
