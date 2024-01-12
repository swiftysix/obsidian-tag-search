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

    useEffect(() => {
        foundTagsRef.current = foundTags;
        searchTextRef.current = searchText;
    }, [foundTags, searchText]);

    useEffect(() => {
        // Function to handle the key press event
        const handleKeyPress = (event) => {
          // Check if the pressed key is 'Enter'
          if (event.key === 'Enter' && foundTagsRef.current.length > 0) {
            setSearchText(searchTextRef.current + foundTagsRef.current[0])
            console.log(foundTagsRef.current[0])
            console.log(searchTextRef.current)

            // Add your logic here for when Enter is pressed
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
        if (keyword !== '') {
            const results = findTagsByPath(keyword, tagList)
            if (results) {
                setFoundTags(results.map((tag: Tag) => tag.name));
            }
        } else {
            setFoundTags(tagList.tags.map((tag: Tag) => tag.name));
            // If the text field is empty, show all userss
        }

        setSearchText(keyword);
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
        console.log(root)
        return root;
    }

    plugin.registerEvent(plugin.app.metadataCache.on("dataview:metadata-change",
        (type, file, oldPath?) => {
            // console.log("Metadata change!");
            setPages(api.pages());
            // console.log(api.page("Daily.md").tags)
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

    console.log(selectedTag)
    if (selectedTag !== "") {
        pagePathList = api.pages(selectedTag).values.map((page: Record<string, Literal>) => page.file.path);
        // console.log(api.pages(selectedTag).map((page: Record<string, Literal>) => page.path))
    }
    // console.log(getLinkpath("Daily.md"))


    // const SelectContainer = ({
    //     children,
    //     ...props
    // }: ControlProps) => {
    //     // console.log(props)
    //     // console.log(children)
    //     return (
    //         //   <Tooltip content={'customise your select container'} delay={0}>
    //         <components.Control {...props}>
    //             <input type="text" placeholder="Type something..." />
    //             {children}
    //         </components.Control>
    //         //   </Tooltip>
    //     );
    // };


    return (
        <>
            <h1>Tag based Page Search</h1>
            <p className="font-extrabold">
                Tag based page search.
            </p>
            {/* <Select
                options={tagOptionsList}
                onChange={(newValue: SingleValue<string>, actionMeta: ActionMeta<typeof Option>) => setSelectedTag(newValue?.value)}
                onInputChange={(inputValue: string, actionMeta: ActionMeta<typeof Option>) => console.log(inputValue)}
                placeholder={'Type a tag...'}
                menuIsOpen={false}
            // components={{ SelectContainer }}
            /> */}
            <div className="bg-blue-700">
                <label htmlFor="input">Tags</label>
                <input
                    className="bg-red-500"
                    type="search"
                    placeholder="Type something..."
                    value={searchText}
                    onChange={filter}
                />
            </div>
            <div className="user-list">
                {foundTags && foundTags.length > 0 ? (
                    foundTags.map((tag, index) => (
                        <li key={index} className="user">
                            <span className="user-name">{tag}</span>
                        </li>
                    ))
                ) : (
                    <p>No results found!</p>
                )}
            </div>

            <p>Found tagged pages:</p>
            <ul>
                {pagePathList && pagePathList.map((pagePath) => (
                    <li><span className="cm-hmd-internal-link">
                        <span className="cm-underline" draggable="true">
                            {pagePath}
                        </span>
                    </span>
                    </li>
                ))}
            </ul>
        </>
    );
};

function TagRemoveHash(tag: string) {
    if (tag[0] === '#') {
        tag = tag.substring(1);
    }
    return tag;
}

