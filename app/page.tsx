"use client"

import { DetectorCard } from "@/components/DetectorCard";
import { BASE_SERVER_URL } from "@/utils/config";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
	const [detectors, setDetectors] = useState<DetType[]>([]);
	const [isApiKey, setIsApiKey] = useState<boolean>(false);
	const [isImgSrc, setIsImgSrc] = useState<boolean>(false);
	const [isDet, setIsDet] = useState<boolean>(false);
	const [introCompleted, setIntroCompleted] = useState<boolean>(true);

	useEffect(() => {
		// fetch detector configs
		fetch(BASE_SERVER_URL + "/api/config").then((res) => res.json()).then((data) => {
			setDetectors(data.detectors as DetType[] ? (data.detectors as DetType[]).filter(d => d.config.enabled) : []);
			setIsDet(!!data.detectors && data.detectors.length > 0);
			setIsApiKey(!!data.api_key && data.api_key != "");
			setIsImgSrc(!!data.image_sources && data.image_sources.length > 0);
			setIntroCompleted(!!data.intro_sequence_finished && data.intro_sequence_finished);
		});
	}, []);

	return (
		<main className="flex flex-col px-10 py-5 gap-2">
			{
				!introCompleted &&
				<>
					{/* onboarding checklist */}
					<h1 className="text-4xl font-bold">Welcome!</h1>
					<h2 className="text-xl text-gray-600 px-10 w-3/4 pt-2">Use this website to configure and check in on your Groundlight detectors</h2>
					<div className="p-10">
						<h2 className="text-3xl">Getting started:</h2>
						<div className="px-10 py-5 w-3/4 flex flex-col gap-4">
							<Link className="flex gap-2 border-4 border-blue-500 px-6 py-3 rounded-2xl" href="/api-key">
								<div className="font-semibold place-self-center">Add your api key</div>
								{/* <input className="rounded-md w-8 ml-auto" type="checkbox" checked={isImgSrc} onChange={(e) => setIsImgSrc(e.target.checked)}/> */}
								<input className="rounded-md w-8 ml-auto" type="checkbox" checked={isApiKey} readOnly />
							</Link>
							<Link className="flex gap-2 border-4 border-blue-500 px-6 py-3 rounded-2xl" href="/sources">
								<div className="font-semibold place-self-center">Add an image source</div>
								<input className="rounded-md w-8 ml-auto" type="checkbox" checked={isImgSrc} readOnly />
							</Link>
							<Link className="flex gap-2 border-4 border-blue-500 px-6 py-3 rounded-2xl" href="/detectors">
								<div className="font-semibold place-self-center">Make a detector</div>
								<input className="rounded-md w-8 ml-auto" type="checkbox" checked={isDet} readOnly />
							</Link>
							<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-6 py-3 m-1 w-40 rounded-xl" onClick={() => {
								fetch(BASE_SERVER_URL + "/api/finished_intro").then(() => setIntroCompleted(true));
							}}>
								{(isApiKey && isImgSrc && isDet) ? "Continue!" : "Skip"}
							</button>
						</div>
					</div>
				</>
			}

			{
				introCompleted &&
				<>
					<h1 className="text-4xl font-bold">Your enabled detectors:</h1>
					{
						false &&
						<div className="mx-10 mt-5 text-xl">
							You have no image sources.
							Go <Link href="/sources" className="text-blue-500 underline" >here</Link> to add some!
						</div>
					}
					{
						detectors && detectors.length == 0 &&
						<div className="mx-10 mt-5 text-xl">
							You have no running detectors.
							Go <Link href="/detectors" className="text-blue-500 underline" >here</Link> to create some!
						</div>
					}
					<div className="flex flex-col gap-2 items-start mx-10 my-5">
						{detectors && detectors.map((detector, index) => (
							<div className="flex flex-col items-center" key={index}>
								<DetectorCard detector={detector} index={index} onclick={() => { }} />
							</div>
						))}
					</div>
				</>
			}
		</main>
	);
}
