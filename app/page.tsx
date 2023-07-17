"use client"

import { DetectorCard } from "@/components/DetectorCard";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import Image from "next/image";
import Link from "next/link";
// import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
	const [detectors, setDetectors] = useState<DetType[]>([]);
	const [isApiKey, setIsApiKey] = useState<boolean>(false);
	const [isImgSrc, setIsImgSrc] = useState<boolean>(false);
	const [isDet, setIsDet] = useState<boolean>(false);

	useEffect(() => {
		// fetch detector configs
		fetch("/api/config").then((res) => res.json()).then((data) => {
			setDetectors(data.detectors as DetType[] ? (data.detectors as DetType[]).filter(d => d.config.enabled) : []);
			setIsDet(!!data.detectors);
			setIsApiKey(!!data.api_key);
			// setIsImgSrc(data.image_sources?);
		});
	}, []);

	return (
		<main className="flex flex-col px-10 py-5 gap-2">
			{/* onboarding checklist */}
			<h1 className="text-4xl font-bold">Welcome!</h1>
			{/* <h2 className="text-2xl text-gray-600">Come to this page to check on your enabled detectors.</h2> */}
			<h2 className="text-xl text-gray-600 px-10 w-3/4 pt-2">Use this website to configure and check in on your Groundlight detectors</h2>
			<div className="p-10">
				<h2 className="text-3xl">Getting started:</h2>
				<div className="px-10 py-5 w-3/4">
					<form className="flex flex-col gap-4">
						{/* <div className="flex gap-2 bg-blue-500 text-white px-6 py-3 rounded"> */}
						{/* <a className="flex gap-2 border-4 border-blue-500 px-6 py-3 rounded-2xl" href="/"> */}
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
					</form>
				</div>
			</div>



			{/* <h1 className="text-4xl font-bold">Your enabled detectors:</h1>
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
            <DetectorCard detector={detector} index={index} onclick={() => {}} />
          </div>
        ))}
      </div> */}
		</main>
	);
}
