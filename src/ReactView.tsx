import { useApp, usePlugin } from "src/hooks";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { DataArray, DataviewApi, Literal, getAPI, isPluginEnabled } from "obsidian-dataview";
import { Plugin, getLinkpath } from "obsidian";
import Select, { SingleValue, StylesConfig, components, ContainerProps, ControlProps, ActionMeta } from 'react-select'

interface Tag {
    name: string;
    children: Tag[];
}

interface TagList {
    tags: Tag[];
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


export default function ReactView() {
    const api = getAPI() as DataviewApi;
    const app = useApp();
    const plugin = usePlugin() as Plugin;
    let tagList: TagList = { tags: [] };
    let tagOptionsList: { value: string, label: string }[] = [];
    let pagePathList: string[] = [];
    const [pages, setPages] = useState<DataArray<Record<string, Literal>>>(api.pages());
    const [selectedTag, setSelectedTag] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [foundTags, setFoundTags] = useState<string[]>([]);
    const foundTagsRef = useRef(foundTags);
    const searchTextRef = useRef(searchText);
    const [closestMatch, setClosestMatch] = useState<string>("");
    const [highlightedTagIndex, setHighlightedTagIndex] = useState<number>(0);
    const highlightedTagIndexRef = useRef(highlightedTagIndex);

    useEffect(() => {
        foundTagsRef.current = foundTags;
        searchTextRef.current = searchText;
        highlightedTagIndexRef.current = highlightedTagIndex;
    }, [foundTags, searchText, highlightedTagIndex]);

    useEffect(() => {
        // Function to handle the key press event
        const handleKeyPress = (event) => {
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
                newSearchText = searchTextRef.current.substring(0, index+1) + foundTag
                setSearchText(newSearchText)
            } else {
                newSearchText = foundTag
                setSearchText(newSearchText)
            }
            updateClosestMatch(foundTagsRef.current, newSearchText, setClosestMatch);
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
        // console.log(foundTags.length)
        setHighlightedTagIndex(highlightedTagIndex % foundTagList.length)
    };


    const buildTagTree = (tags: string[]): TagList => {
        const root: TagList = { tags: [] };

        const findOrCreateTag = (name: string, parent: Tag[]): Tag => {
            let tag = parent.find(t => t.name === name);
            if (!tag) {
                tag = { name: name, children: [] };
                parent.push(tag);
            }
            return tag;
        };

        tags.forEach(tagPath => {
            let parts = tagPath.split('/');
            let currentLevel = root.tags;

            parts.forEach(part => {
                const tag = findOrCreateTag(part, currentLevel);
                currentLevel = tag.children;
            });
        });
        return root;
    }

    plugin.registerEvent(plugin.app.metadataCache.on("dataview:metadata-change",
        (type, file, oldPath?) => {
            setPages(api.pages());
        }))


    let tagListRaw: string[] = [];
    pages.forEach((page: any) => {
        if (page && page.tags) {
            page.tags.forEach((tag: string) => {
                tag = TagRemoveHash(tag);
                tagListRaw = [...tagListRaw, tag];
            })
        }
    });
    // tagOptionsList = tagList.map((tag: string) => { return { value: tag, label: tag } });
    tagList = buildTagTree(tagListRaw);

    if (closestMatch !== "") {
        const tag = '#' + closestMatch;
        console.log(tag)
        pagePathList = api.pages(tag).values.map((page: Record<string, Literal>) => page.file.path);
        console.log(pagePathList)
    }

    return (
        <>
            <h2>Tag based Page Search</h2>
            <p className="">
                Tag based page search.
            </p>
            <div className="">
                <label htmlFor="input">Tags</label>
                <input
                    className=""
                    type="search"
                    placeholder="Type something..."
                    value={searchText}
                    onChange={filter}
                />
            </div>
            <div className="mt-2">
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
            <h3>Tagged pages</h3>
            <p>Found tagged pages:</p>
            <ul>
                {pagePathList && pagePathList.map((pagePath, index) => (
                    <li key={index}><span className="cm-hmd-internal-link">
                        <span className="cm-underline hover:underline" draggable="true" onClick={() => {
                            app.workspace.openLinkText(pagePath, '', false);
                        }}>
                            {pagePath}
                        </span>
                    </span>
                    </li>
                ))}
            </ul>
        </>
    );
};

function updateClosestMatch(foundTags: string[], keyword: any, setClosestMatch: React.Dispatch<React.SetStateAction<string>>) {
    for(var tag of foundTags) {
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

