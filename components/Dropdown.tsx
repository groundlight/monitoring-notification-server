"use client"

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline"

export const Dropdown = ({ options, selected, setSelected, valid, onChange }:
    { options: any[], selected: string, setSelected: (e: string, idx: number) => void, valid?: boolean, onChange?: (open: boolean) => void }
    // { options: string[], selected: string, setSelected: (e: string, idx: number) => void, valid?: boolean }
) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="relative inline-block text-left w-full place-self-center">
            <div>
                <span className="rounded-md shadow-sm">
                    <button type="button" className={`inline-flex justify-center w-full rounded-md border ${valid !== false ? "border-gray-300" : "border-red-500"} px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" id="options-menu`} aria-haspopup="true" aria-expanded="true" onClick={() => {
                        if (onChange) onChange(!open);
                        setOpen(!open);
                    }}>
                        {selected}
                        {
                            !open ? (
                                <ArrowDownIcon className="-mr-1 ml-2 h-5 w-5" />
                            ) : (
                                <ArrowUpIcon className="-mr-1 ml-2 h-5 w-5" />
                            )
                        }
                    </button>
                </span>
            </div>

            <div className={`${open ? "z-10" : "hidden"} origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100`} role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {options.map((option, index) => (
                    <div key={index} className="py-1">
                        <button className="text-gray-700 block w-full text-left px-4 py-2 text-sm" role="menuitem" onClick={(e) => {
                            e.preventDefault();
                            setSelected(option, index);
                            setOpen(false);
                            if (onChange) onChange(false);
                        }}>{option}</button>
                    </div>
                ))}
            </div>
        </div>
    );
}