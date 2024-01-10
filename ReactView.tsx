import { useApp, usePlugin } from "hooks";
import * as React from "react";
import { useState } from "react";
import { DataArray, DataviewApi, Literal, getAPI, isPluginEnabled } from "obsidian-dataview";
import { Plugin } from "obsidian";
import Select, { SingleValue, StylesConfig } from 'react-select'

export default function ReactView() {
    const api = getAPI() as DataviewApi;
    const app = useApp();
    const plugin = usePlugin() as Plugin;
    let tagList: string[] = [];
    let tagOptionsList: { value: string, label: string }[] = [];
    let pagePathList: string[] = [];
    const [pages, setPages] = useState<DataArray<Record<string, Literal>>>(api.pages());
    const [selectedTag, setSelectedTag] = useState<string>("");

    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
    ]


    console.log(app);

    plugin.registerEvent(plugin.app.metadataCache.on("dataview:metadata-change",
        (type, file, oldPath?) => {
            console.log("Metadata change!");
            setPages(api.pages());
            // console.log(api.page("Daily.md").tags)
        }))


    pages.forEach((page: any) => {
        if (page && page.tags) {
            page.tags.forEach((tag: string) => { if (!tagList.includes(tag)) { tagList = [...tagList, tag]; } });
            tagOptionsList = tagList.map((tag: string) => { return { value: tag, label: tag } });
        }
    });

    console.log(selectedTag)
    if (selectedTag !== "") {
        console.log("selectedTag")
        pagePathList = api.pages(selectedTag).values.map((page: Record<string, Literal>) => page.file.path);
        // console.log(api.pages(selectedTag).map((page: Record<string, Literal>) => page.path))
    }



    return (
        <>
            <h1>ReactView</h1>
            <p>
                This is a React component rendered in an Obsidian view.
                This vault's nam is {app?.vault.getName()}.
            </p>
            <Select options={tagOptionsList} onChange={(newValue: SingleValue<string>, actionMeta) => setSelectedTag(newValue?.value)} />
            <label htmlFor="input">Tags</label>
            <input type="text" placeholder="Type something..." />
            
            <p>Found pages:</p>
            <ul>
                {pagePathList && pagePathList.map((pagePath) => (
                    <li>{pagePath}</li>
                ))}
            </ul>
        </>
    );
};