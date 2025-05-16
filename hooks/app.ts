import { useContext } from "react";
import { createContext } from "react";
import SageAI from "main";

export const AppContext = createContext<SageAI | undefined>(undefined);

export const useApp = (): SageAI | undefined => {
	return useContext(AppContext);
};
