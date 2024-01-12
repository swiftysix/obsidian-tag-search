import { StrictMode } from "react";
import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import ReactView from "./ReactView";
import * as React from "react";
import { AppContext, PluginContext } from "src/context";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
    root: Root | null = null;
    plugin: Plugin;

    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }

    getIcon(): string {
        return "calendar-with-checkmark";
    }

    getDisplayText() {
        return "Example view";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                <PluginContext.Provider value={this.plugin}>
                    <AppContext.Provider value={this.app}>
                        <div className="tag-search bg-red-500" id="tag-search">
                            <ReactView />
                        </div>
                    </AppContext.Provider>
                </PluginContext.Provider>
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}