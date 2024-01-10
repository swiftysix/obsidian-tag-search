import { useContext } from "react";
import { AppContext, PluginContext } from "./context";
import { App, Plugin } from "obsidian";

export const useApp = (): App | undefined => {
  return useContext(AppContext);
};

export const usePlugin = (): Plugin | undefined => {
  return useContext(PluginContext);
};