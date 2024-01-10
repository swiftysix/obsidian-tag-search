import { createContext } from "react";
import { App, Plugin } from "obsidian";

export const AppContext = createContext<App | undefined>(undefined);
export const PluginContext = createContext<Plugin | undefined>(undefined);