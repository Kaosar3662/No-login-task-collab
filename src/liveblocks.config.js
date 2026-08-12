import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey:
    'pk_dev_Y1FQR6LojJu11g3VXOV1omy3ozXE-hYXP9hAP9gnRX2tmDk5F28CYjpdakI2_BiE',
});

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  useMyPresence,
  useHistory,
  useCanUndo,
  useCanRedo,
} = createRoomContext(client);
