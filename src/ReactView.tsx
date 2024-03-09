import { useApp, usePlugin } from "src/hooks";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { DataArray, DataviewApi, Literal, getAPI, Link } from "obsidian-dataview";
import { Plugin } from "obsidian";
import PageDisplay from "./components/pageDisplay";

interface Tag {
    name: string;
    children: Tag[];
}

interface TagList {
    tags: Tag[];
}

export interface Page {
    path: string;
    title: string;
    tags: string[];
}

export default function ReactView() {
    const api = getAPI() as DataviewApi;
    const app = useApp();
    const plugin = usePlugin() as Plugin;
    let tagList: TagList = { tags: [] };
    const [pages, setPages] = useState<DataArray<Record<string, Literal>>>(api.pages());
    const [searchText, setSearchText] = useState<string>("");
    const [foundTags, setFoundTags] = useState<string[]>([]);
    const foundTagsRef = useRef(foundTags);
    const searchTextRef = useRef(searchText);
    const [closestMatch, setClosestMatch] = useState<string>("");
    const [highlightedTagIndex, setHighlightedTagIndex] = useState<number>(0);
    const highlightedTagIndexRef = useRef(highlightedTagIndex);
    let taggedPages: Page[] = [];
    const [isTagInputFocused, setIsTagInputFocused] = useState(false);
    const isTagInputFocusedRef = useRef(isTagInputFocused);
    const canUpdateTagListRef = useRef(true);

    useEffect(() => {
        foundTagsRef.current = foundTags;
        searchTextRef.current = searchText;
        highlightedTagIndexRef.current = highlightedTagIndex;
        isTagInputFocusedRef.current = isTagInputFocused;
    }, [foundTags, searchText, highlightedTagIndex, isTagInputFocused]);

    useEffect(() => {
        filter({ target: { value: searchText } })
    }, []);

    useEffect(() => {
        // Function to handle the key press event
        const handleKeyPress = (event) => {
            if (!isTagInputFocusedRef.current) {
                return;
            }
            // Check if the pressed key is 'Enter'
            if (event.key === 'Enter' && foundTagsRef.current.length > 0) {

                // check if there is a '/' in the searchTextRef.current, if so then delete all characters up to the next '/'
                // else delete all characters up to the start of the string
                // then concatenate the foundTagsRef.current[0] to the searchTextRef.current
                // then set the searchTextRef.current to the new string
                let index = searchTextRef.current.lastIndexOf('/')
                let newSearchText = ""
                const foundTag = foundTagsRef.current[highlightedTagIndexRef.current]
                if (index > 0) {
                    newSearchText = searchTextRef.current.substring(0, index + 1) + foundTag + '/'
                    setSearchText(newSearchText)
                } else {
                    newSearchText = foundTag + '/'
                    setSearchText(newSearchText)
                }
                updateClosestMatch(foundTagsRef.current, newSearchText, setClosestMatch);
                filter({ target: { value: newSearchText } })
            }

            if (event.key === 'ArrowDown') {
                setHighlightedTagIndex((highlightedTagIndexRef.current + 1) % foundTagsRef.current.length);
            }
            if (event.key === 'ArrowUp') {
                setHighlightedTagIndex((highlightedTagIndexRef.current - 1 + foundTagsRef.current.length) % foundTagsRef.current.length);
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyPress);

        plugin.registerEvent(api.app.metadataCache.on("dataview:index-ready", () => {
            console.log("index-ready 123");
            updatePagesAndTags();
        }));
        plugin.registerEvent(api.app.metadataCache.on("dataview:metadata-change", () => {
            console.log("metadata-change 123");
            updatePagesAndTags();
        }));

        // Cleanup the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    const filter = (e) => {
        const keyword = e.target.value;
        let foundTagList: string[] = [];
        if (keyword !== '') {
            const results = findTagsByPath(keyword, tagList)
            if (results) {
                foundTagList = results.map((tag: Tag) => tag.name)
                setFoundTags(foundTagList);
            }
        } else {
            foundTagList = tagList.tags.map((tag: Tag) => tag.name)
            setFoundTags(foundTagList);
        }

        setSearchText(keyword);

        updateClosestMatch(foundTags, keyword, setClosestMatch);
        setHighlightedTagIndex(foundTagList.length === 0 ? 0 : highlightedTagIndex % foundTagList.length)
    };

    const updatePagesAndTags = () => {
        if (!canUpdateTagListRef.current) {
            return;
        }
        setPages(api.pages());
        setTimeout(() => {
            filter({ target: { value: searchText } })
            console.log("foundTags", foundTags)
        }, 1000);
        canUpdateTagListRef.current = false;
        setTimeout(() => {
            canUpdateTagListRef.current = true;
        }, 1000);
    }

    // plugin.registerEvent(plugin.app.metadataCache.on("dataview:metadata-change",

    

    let tagListRaw: string[] = [];
    pages.forEach((page: any) => {
        if (page && page.tags) {
            page.tags.forEach((tag: string) => {
                tag = TagRemoveHash(tag);
                tagListRaw = [...tagListRaw, tag];
            })
        }
    });
    tagList = buildTagTree(tagListRaw);

    if (closestMatch !== "") {
        const tag = '#' + closestMatch;
        taggedPages = api.pages(tag).values.map((page: Record<string, Literal>) => ({ path: page.file.path, title: page.file.name, tags: page.tags }));
    }

    return (
        <>
            <h2>Tag based Page Search</h2>
            <p className="">
                Tag based page search.
            </p>
            <div className="">
                <input
                    className="w-full"
                    type="search"
                    placeholder="Type a tag..."
                    value={searchText}
                    onChange={filter}
                    onFocus={() => setIsTagInputFocused(true)}
                    onBlur={() => setIsTagInputFocused(false)}
                />
            </div>
            <div className="h-40 mt-2 overflow-auto">
                {foundTags && foundTags.length > 0 ? (
                    foundTags.map((tag, index) => (
                        <li key={index} className="">
                            <span className={`${highlightedTagIndex === index ? 'bg-gray-300' : ''}`}>{tag}</span>
                        </li>
                    ))
                ) : (
                    <p>No results found!!</p>
                )}
            </div>
            <hr />
            <PageDisplay taggedPages={taggedPages}/>
        </>
    );
};

function buildTagTree(tags: string[]): TagList {
    const root: TagList = { tags: [] };

    const findOrCreateTag = (name: string, parent: Tag[]): Tag => {
        let tag = parent.find(t => t.name === name);
        if (!tag) {
            tag = { name: name, children: [] };
            parent.push(tag);
        }
        return tag;
    };

    for (const tagPath of tags) {
        if(typeof tagPath !== 'string') continue;   // if there is a tag like #3d then dataView parses it to an date object. Tags like #3d are not supported by obsidian anyway.
        let parts = tagPath.split('/');
        let currentLevel = root.tags;

        parts.forEach(part => {
            const tag = findOrCreateTag(part, currentLevel);
            currentLevel = tag.children;
        });
    }
    return root;
}

function findTagsByPath(path: string, tagList: TagList): Tag[] {
    const parts = path.split('/');
    const foundTags: Tag[] = [];

    const findTags = (tags: Tag[], partIndex: number) => {
        if (partIndex >= parts.length) {
            return;
        }

        const part = TagRemoveHash(parts[partIndex]).toLowerCase();
        const matchingTags = tags.filter(t => t.name.toLowerCase().startsWith(part));

        matchingTags.forEach(tag => {
            if (partIndex === parts.length - 1) {
                foundTags.push(tag);
            } else {
                findTags(tag.children, partIndex + 1);
            }
        });
    };

    findTags(tagList.tags, 0);
    return foundTags;
}

function updateClosestMatch(foundTags: string[], keyword: any, setClosestMatch: React.Dispatch<React.SetStateAction<string>>) {
    for (var tag of foundTags) {
        const parts = keyword.split('/');
        const lastPart = parts[parts.length - 1];
        if (tag.toLowerCase() === lastPart.toLowerCase()) {  // match
            setClosestMatch(keyword);
            break;
        } else {
            const index = keyword.lastIndexOf('/');
            if (index > 0) {    // match
                setClosestMatch(keyword.substring(0, index));
                break;
            } else {    // no match, continue searching
                setClosestMatch("");
            }
        }
    }
}

function TagRemoveHash(tag: string) {
    if (tag[0] === '#') {
        tag = tag.substring(1);
    }
    return tag;
}

