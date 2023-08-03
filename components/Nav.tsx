"use client"

import { BASE_SERVER_URL } from "@/utils/config";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

const link_style = "rounded-md bg-white mx-6 my-2 py-2 px-4";

export const Nav = () => {
	const [introCompleted, setIntroCompleted] = useState<boolean>(true);

	useEffect(() => {
		// fetch intro completed
		fetch(BASE_SERVER_URL + "/api/config").then((res) => res.json()).then((data) => {
			setIntroCompleted(!!data.intro_sequence_finished && data.intro_sequence_finished);
		});
	}, []);

    return (
        <nav className="bg-blue-500 flex flex-col">
            <div className="p-1"></div>
            {
                !introCompleted &&
                <Link href="/" className={link_style} >
                    {/* Dashboard */}
                    Onboarding
                </Link>
            }
            <Link href="/detectors" className={link_style} >
                {/* Configure Detectors */}
                Detector Dashboard
            </Link>
            <Link href="/sources" className={link_style} >
                Configure Image Sources
            </Link>
            <div className="m-auto"></div>
            <Link href="/settings" className={link_style + " flex place-items-center"} >
                Settings
                <div className="p-1 m-auto"></div>
                <Cog6ToothIcon className="inline-block h-5 w-5" />
            </Link>
            {/* <Link href="/api-key" className={link_style} >
                Set API Key
            </Link> */}
            {/* <Link href="/download" className={link_style} >
                Download Configuration
            </Link> */}
            <div className="p-1"></div>
        </nav>
    );
}