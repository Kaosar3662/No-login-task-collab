import { createContext, useContext } from "react";

export const AccessCtx = createContext(null);
export const useAccess = () => useContext(AccessCtx);
