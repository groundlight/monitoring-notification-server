"use client"

import { DetectorCard } from "@/components/DetectorCard";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import { BASE_SERVER_URL } from "@/utils/config";
import { ArrowRightIcon, ArrowUturnDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function Home() {
	const [detectors, setDetectors] = useState<DetType[]>([]);
	const [detectorsByGroup, setDetectorsByGroup] = useState<DetType[][]>([]);
	const [availableDetectors, setAvailableDetectors] = useState<DetBaseType[]>([]);
	const [showEditOverlay, setShowEditOverlay] = useState<boolean>(false);
	const [editOverlayIndex, setEditOverlayIndex] = useState<number>(0);
	const [lastButtonWasAdd, setLastButtonWasAdd] = useState<boolean>(false);

	useEffect(() => {
		// fetch detector configs
		fetch(BASE_SERVER_URL + "/api/config").then((res) => res.json()).then((data) => {
			setDetectors(data.detectors as DetType[] ? data.detectors as DetType[] : []);
			if (data?.detectors) {
				const detByGroup = (data.detectors as DetType[]).reduce((acc: DetType[][], cur: DetType) => {
					const idx = acc.reduce((pre: number, group: DetType[], idx) => group[0].name === cur.name ? idx : pre, -1);
					if (idx !== -1) {
						acc[idx].push(cur);
					} else {
						acc.push([cur]);
					}
					return acc;
				}, []);
				setDetectorsByGroup(detByGroup);
			}
		});

		// fetch available detectors
		fetch(BASE_SERVER_URL + "/api/detectors").then((res) => res.json()).then((data) => {
			setAvailableDetectors(data as DetBaseType[] ? data as DetBaseType[] : []);
		});
	}, []);

	const saveDetectors = (detectors_to_save: DetType[]) => {
		// save detector configs
		fetch(BASE_SERVER_URL + "/api/config/detectors", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				detectors: detectors_to_save,
			}),
		});
	};

	const makeNewDetector = async (detector: DetType) => {
		// make new detector
		const res = await fetch(BASE_SERVER_URL + "/api/new-detector", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(detector),
		}).then((res) => res.json());
		return res;
	}

	return (
		<main className="flex flex-col items-start px-10 py-5 gap-2 relative h-full">
			<h1 className="text-3xl font-semibold">Configure your Groundlight Detectors</h1>
			{/* <div className="flex flex-wrap items-center gap-2 mx-10 my-5">
				{detectors && detectors.map((detector, index) => (
					<div className="flex flex-col items-center" key={index}>
						<DetectorCard detector={detector} index={index} onclick={() => {
							setEditOverlayIndex(index);
							setShowEditOverlay(true);
							setLastButtonWasAdd(false);
						}} />
					</div>
				))}
			</div> */}
			<div className="p-2"></div>
			<div className="bg-white overflow-scroll p-4 rounded-xl min-h-[600px] shadow-md w-full">
				{detectorsByGroup && detectorsByGroup.map((group, index) => (
					<div className="flex flex-col items-start" key={index}>
						{/* <h2 className="text-xl font-semibold">{group[0].name}</h2> */}
						{/* <div className="grid grid-cols-2 gap-4 w-full bg-white px-4 py-2 rounded border-b-2 border-black"> */}
						<div className="p-3"></div>
						<div className="grid grid-cols-2 gap-4 w-full px-4 py-1 border-y-[1px] border-black">
							<h2 className="text-lg">{group[0].name}</h2>
							<h2 className="text-lg">{group[0].query}</h2>
						</div>
						{/* <div className="flex flex-wrap items-center gap-2 mx-10 my-5">
							{group.map((detector, index) => (
								<div className="flex flex-col items-center" key={index}>
									<DetectorCard detector={detector} index={index} onclick={() => {
										setEditOverlayIndex(index);
										setShowEditOverlay(true);
										setLastButtonWasAdd(false);
									}} />
								</div>

							))}
						</div> */}
						<div className="flex w-full" key={index}>
							<h3 className="flex items-start my-3 mx-8">
								Image Sources
								<div className="p-1"></div>
								{/* <ArrowUturnDownIcon className="w-6 h-6 -rotate-90"/> */}
								<ArrowRightIcon className="w-6 h-6"/>
							</h3>
							<div className="p-1 m-auto"></div>
							{group.map((detector, index) => (
								<button className="mx-2 my-1 relative" key={index} onClick={() => {
									setEditOverlayIndex(index);
									setShowEditOverlay(true);
									setLastButtonWasAdd(false);
								}}>
									{
										!detector.config.enabled &&
										<div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-bold py-2 px-2 rounded-lg">
											disabled
										</div>
									}
									<img src={`data:image/jpeg;base64,${detector.config.image}`} key={index} alt={detector.name} className="w-32 rounded-lg"/>
								</button>
							))}
						</div>
					</div>
				))}
			</div>
			<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded fixed bottom-10 right-10 flex items-center" onClick={() => {
				setShowEditOverlay(true);
				setLastButtonWasAdd(true);
				setEditOverlayIndex(detectors.length);
				let detectors_copy = [...detectors, {
					name: availableDetectors[0]?.name ? availableDetectors[0].name : "New Detector",
					query: availableDetectors[0]?.query ? availableDetectors[0].query : "New Query?",
					id: availableDetectors[0]?.id ? availableDetectors[0].id : "",
					config: {
						enabled: true,
						imgsrc_idx: 0,
						vid_config: detectors[0]?.config?.vid_config ? detectors[0].config.vid_config : {
							name: "webcam",
						},
						image: detectors[0]?.config?.image ? detectors[0].config.image : "",
						trigger_type: "time",
						cycle_time: 30,
					}
				}];
				setDetectors(detectors_copy);
			}}>
				<PlusIcon className="h-6 w-6" />
				<div className="p-1"></div>
				Add Detector
			</button>
			{detectors.length > 0 && showEditOverlay &&
				<EditDetectorOverlay detector={detectors[editOverlayIndex]} detectors={availableDetectors} index={0} onSave={async (e) => {
					if (e.isNewDetector) {
						const id = await makeNewDetector(e.detector);
						if (id === "Failed") {
							setShowEditOverlay(false);
							let detectors_copy = [...detectors];
							detectors_copy.splice(editOverlayIndex, 1);
							setDetectors(detectors_copy);
							saveDetectors(detectors_copy);
							return;
						}
						e.detector.id = id;
					}
					setShowEditOverlay(false);
					let detectors_copy = [...detectors];
					detectors_copy[editOverlayIndex] = e.detector;
					setDetectors(detectors_copy);
					saveDetectors(detectors_copy);
				}} onDelete={() => {
					setShowEditOverlay(false);
					let detectors_copy = [...detectors];
					detectors_copy.splice(editOverlayIndex, 1);
					setDetectors(detectors_copy);
					saveDetectors(detectors_copy);
				}} onBack={() => {
					setShowEditOverlay(false);
					if (lastButtonWasAdd) {
						let detectors_copy = [...detectors];
						detectors_copy.splice(editOverlayIndex, 1);
						setDetectors(detectors_copy);
					}
				}} />
			}
		</main>
	);
}
