import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LIVEBLOCKS_KEY } from "./config";

const PLACEHOLDER = "pk_dev_not_configured_placeholder_key_000000000000000000000";

export const client = createClient({
  publicApiKey: LIVEBLOCKS_KEY || PLACEHOLDER,
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
