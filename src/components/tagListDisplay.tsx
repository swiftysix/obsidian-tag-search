import React from "react";
import { useEffect, useRef, useState } from "react";

interface TagListDisplayProps {
    foundTags: string[];
    isTagInputFocusedRef: React.RefObject<boolean>;
    highlightedTagIndex: number;
    setHighlightedTagIndex: React.Dispatch<React.SetStateAction<number>>;
}

export default function TagListDisplay({ foundTags, isTagInputFocusedRef, highlightedTagIndex, setHighlightedTagIndex }: TagListDisplayProps) {
    const foundTagsRef = useRef(foundTags);
    const highlightedTagIndexRef = useRef(highlightedTagIndex);
    
    useEffect(() => {
        foundTagsRef.current = foundTags;
        highlightedTagIndexRef.current = highlightedTagIndex;
    }, [foundTags, highlightedTagIndex]);

    useEffect(() => {
        // Function to handle the key press event
        const handleKeyPress = (event) => {
            if (!isTagInputFocusedRef.current) {
                return;
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

    return (
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
    );
}