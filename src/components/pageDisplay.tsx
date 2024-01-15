import { Page } from "@/ReactView";
import * as React from "react";
import { useEffect, useState } from "react";
import { Plugin } from "obsidian";
import { useApp, usePlugin } from "src/hooks";
import { DataviewApi, getAPI } from "obsidian-dataview";

export default function PageDisplay({ taggedPages }: { taggedPages: Page[] }) {
    const api = getAPI() as DataviewApi;
    const app = useApp();
    const plugin = usePlugin() as Plugin;
    const [searchTextPages, setSearchTextPages] = useState<string>("");
    const pages: Page[] = taggedPages ?? [];
    const [filteredPages, setFilteredPages] = useState<Page[]>([]);
    const [isCtrlPressed, setIsCtrlPressed] = useState<boolean>(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Control') {
                setIsCtrlPressed(true);
            }
        };
        const handleKeyUp = (event) => {
            if (event.key === 'Control') {
                setIsCtrlPressed(false);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }), [isCtrlPressed];

    const filterPages = (keyword: string) => {
        let results: Page[] = [];
        if (keyword !== '') {
            results = pages.filter((page: Page) => page.title.toLowerCase().includes(keyword.toLowerCase()))
        } else {
            results = pages;
        }
        setFilteredPages(results ?? []);
        console.log(results)
    };

    useEffect(() => {
        filterPages(searchTextPages);
    }, [taggedPages]);

    const pageSearchOnChange = (e) => {
        const keyword = e.target.value;
        filterPages(keyword);
        setSearchTextPages(keyword);
    };

    return (
        <>
            <div className="">
                <p>Found tagged pages:</p>
                <input
                    className="w-full"
                    type="search"
                    placeholder="Filter pages by..."
                    value={searchTextPages}
                    onChange={pageSearchOnChange}
                />
                <div className="">
                    <ul>
                        {filteredPages && filteredPages.map((pagePath, index) => (
                            <li key={index}><span className="cm-hmd-internal-link">
                                <span className="cm-underline hover:underline" draggable="true" onClick={() => {
                                    app.workspace.openLinkText(pagePath.path, '', isCtrlPressed ? 'tab' : false);
                                }}>
                                    {pagePath.title}
                                </span>
                            </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}