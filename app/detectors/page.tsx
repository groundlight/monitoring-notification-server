"use client"

import { Dropdown } from "@/components/Dropdown";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import { EditNotificationsOverlay } from "@/components/EditNotificationsOverlay";
import { BASE_SERVER_URL } from "@/utils/config";
import { ArrowPathIcon, Cog6ToothIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import ReactSwitch from "react-switch";

export default function Home() {
	const [detectors, setDetectors] = useState<DetType[]>([]);
	const [detectorsByGroup, setDetectorsByGroup] = useState<DetType[][]>([]);
	const [detectorIndiciesByGroup, setDetectorIndiciesByGroup] = useState<number[][]>([]); // [group index][detector index]
	const [availableDetectors, setAvailableDetectors] = useState<DetBaseType[]>([]);
	const [showEditOverlay, setShowEditOverlay] = useState<boolean>(false);
	const [editOverlayIndex, setEditOverlayIndex] = useState<number>(0);
	const [lastButtonWasAdd, setLastButtonWasAdd] = useState<boolean>(false);
	const [imageSources, setImageSources] = useState<CameraType[]>([]);
	const [camerasWaiting, setCamerasWaiting] = useState<boolean[]>([]); // images that are waiting for a response
	const [showEditNotificationsOverlay, setShowEditNotificationsOverlay] = useState<boolean>(false);
	const [editNotificationsOverlayIndex, setEditNotificationsOverlayIndex] = useState<number>(0);
	const [editNotificationsOverlayGroupIndex, setEditNotificationsOverlayGroupIndex] = useState<number>(0);

	const fetchConfig = async () => {
		return await fetch(BASE_SERVER_URL + "/api/config").then((res) => res.json()).then((data) => {
			setDetectors(data.detectors as DetType[] ? data.detectors as DetType[] : []);
			if (data?.detectors) {
				const detIdxByGroup: number[][] = [];
				const detByGroup = (data.detectors as DetType[]).reduce((acc: DetType[][], cur: DetType, old_idx: number) => {
					const idx = acc.reduce((pre: number, group: DetType[], idx) => group[0].name === cur.name ? idx : pre, -1);
					if (idx !== -1) {
						acc[idx].push(cur);
						detIdxByGroup[idx].push(old_idx);
					} else {
						acc.push([cur]);
						detIdxByGroup.push([old_idx]);
					}
					return acc;
				}, []);
				setDetectorIndiciesByGroup(detIdxByGroup);
				setDetectorsByGroup(detByGroup);
			}
			return data;
		});
	}

	useEffect(() => {
		// fetch detector configs
		void fetchConfig();

		// fetch available image sources
		fetch(BASE_SERVER_URL + "/api/cameras").then((res) => res.json()).then((data) => {
			setImageSources(data as CameraType[] ? data as CameraType[] : []);
			setCamerasWaiting(new Array((data as CameraType[]).length).fill(false));
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
		})
		.then((res) => res.json())
		.then((data) => {
			setDetectors(data.detectors as DetType[] ? data.detectors as DetType[] : []);
			if (data?.detectors) {
				const detIdxByGroup: number[][] = [];
				const detByGroup = (data.detectors as DetType[]).reduce((acc: DetType[][], cur: DetType, old_idx: number) => {
					const idx = acc.reduce((pre: number, group: DetType[], idx) => group[0].name === cur.name ? idx : pre, -1);
					if (idx !== -1) {
						acc[idx].push(cur);
						detIdxByGroup[idx].push(old_idx);
					} else {
						acc.push([cur]);
						detIdxByGroup.push([old_idx]);
					}
					return acc;
				}, []);
				setDetectorIndiciesByGroup(detIdxByGroup);
				setDetectorsByGroup(detByGroup);
			}
			return data;
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
		})
			.then((res) => res.json());
		
		void fetchConfig();

		return res;
	}

	const changeDetectorImgSrc = (detector: DetType, imgsrc_idx: number) => {
		// change detector image source
		const det_idx = detectors.findIndex((det) => det == detector);
		if (det_idx === -1) return;
		let detectors_copy = [...detectors];
		detectors_copy[det_idx].config.imgsrc_idx = imgsrc_idx;
		detectors_copy[det_idx].config.image = imageSources[imgsrc_idx].image;
		detectors_copy[det_idx].config.vid_config = imageSources[imgsrc_idx].config;
		setDetectors(detectors_copy);
		saveDetectors(detectors_copy);
	}

	const changeDetectorEnabled = (det_idx: number, enabled: boolean) => {
		// change detector enabled
		let detectors_copy = [...detectors];
		detectors_copy[det_idx].config.enabled = enabled;
		setDetectors(detectors_copy);
		saveDetectors(detectors_copy);
	}

	const deleteDetector = (detector: DetType) => {
		// delete detector
		const det_idx = detectors.findIndex((det) => det == detector);
		if (det_idx === -1) return;
		let detectors_copy = [...detectors];
		detectors_copy.splice(det_idx, 1);
		setDetectors(detectors_copy);
		saveDetectors(detectors_copy);
	}

	const refreshDetectorImg = (idx: number, det: DetType) => {
        // set camera waiting
        const cameras_waiting_copy = camerasWaiting.slice();
        cameras_waiting_copy[idx] = true;
        setCamerasWaiting(cameras_waiting_copy);
        
        // fetch cameras
        fetch(BASE_SERVER_URL + "/api/refresh-camera", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(imageSources[idx].config)
        }).then((res) => res.json()).then((data) => {
            if (!imageSources) return;
            const cameras_copy = imageSources.slice();
            cameras_copy[idx].image = data.image;
            setImageSources(cameras_copy);

			// set detector image
			const det_idx = detectors.findIndex((d) => d == det);
			if (det_idx === -1) return;
			let detectors_copy = detectors.slice();
			detectors_copy[det_idx].config.image = data.image;
			setDetectors(detectors_copy);
			saveDetectors(detectors_copy);
            
            // set camera waiting false
            const cameras_waiting_copy = camerasWaiting.slice();
            cameras_waiting_copy[idx] = false;
            setCamerasWaiting(cameras_waiting_copy);
        });
    }

	return (
		<main className="flex flex-col items-start px-10 py-5 gap-2 relative h-full">
			<div className="flex w-full gap-4 flex-wrap">
				{/* title bar */}
				<h1 className="text-3xl font-semibold">Configure your Groundlight Detectors</h1>
				<div className="flex gap-4 ml-auto">
					<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-lg flex items-center text-sm" onClick={() => {
						setShowEditOverlay(true);
						setLastButtonWasAdd(true);
						setEditOverlayIndex(detectors.length);
						setDetectors((detectors) => detectors.concat({
							name: "New Detector",
							query: "New Query?",
							id: "",
							config: {
								enabled: false,
								imgsrc_idx: 0,
								vid_config: detectors[0]?.config?.vid_config ? detectors[0].config.vid_config : {
									name: "",
								},
								image: detectors[0]?.config?.image ? detectors[0].config.image : "",
								trigger_type: "time",
								cycle_time: 30,
							}
						}));
					}}>
						New Detector
						<div className="p-1"></div>
						<PlusIcon className="h-6 w-6" />
					</button>
					<div className="w-52">
						<Dropdown options={availableDetectors.map(d => d.name)} selected="Add Existing Detector" setSelected={(e, idx) => {
							setLastButtonWasAdd(true);
							setEditOverlayIndex(detectors.length);
							let detectors_copy = detectors.concat({
								name: availableDetectors[idx].name,
								query: availableDetectors[idx].query,
								id: availableDetectors[idx].id,
								config: {
									enabled: false,
									imgsrc_idx: 0,
									vid_config: detectors[0]?.config?.vid_config ? detectors[0].config.vid_config : {
										name: "webcam",
									},
									image: detectors[0]?.config?.image ? detectors[0].config.image : "",
									trigger_type: "time",
									cycle_time: 30,
								}
							});
							setDetectors(detectors_copy);
							saveDetectors(detectors_copy);
						}} className="!border-0 !bg-blue-500 hover:!bg-blue-700 !font-bold !text-white"/>
					</div>
				</div>
			</div>
			<div className="p-1"></div>
			<div className="bg-white overflow-scroll p-4 rounded-xl min-h-[600px] shadow-md w-full">
				{detectorsByGroup && detectorsByGroup.map((group, indexA) => (
					<div className="flex flex-col items-start" key={indexA}>
						<div className="p-1"></div>
						{/* <div className="grid grid-cols-2 gap-4 w-full px-4 py-1 border-y-[1px] border-black"> */}
						<div className="grid grid-cols-[minmax(0,1fr),minmax(0,1fr),56px] gap-4 w-full px-4 py-1 border-y-[1px] border-black">
							<h2 className="text-lg">{group[0].name}</h2>
							<h2 className="text-lg">{group[0].query}</h2>
							<button className="hover:bg-gray-200 hover:text-gray-700 rounded-md px-2 py-1 font-bold" onClick={() => {
								setShowEditNotificationsOverlay(true);
								setEditNotificationsOverlayIndex(0);
								setEditNotificationsOverlayGroupIndex(indexA);
							}}>
								<Cog6ToothIcon className="w-6 h-6 m-auto" onClick={() => {
									// setShowEditNotificationsOverlay(true);
									// setEditNotificationsOverlayIndex(0);
									// setEditNotificationsOverlayGroupIndex(indexA);
								}} />
							</button>
						</div>
						{group.map((detector, indexB) => (
							<div className="mx-2 my-1 relative grid grid-cols-[200px,100px,1fr,100px] grid-rows-1 gap-4 w-full" key={indexB}>
								<div className="relative inline-block">
									{
										detector.config.image != "" ?
										<img src={`data:image/jpeg;base64,${detector.config.image}`} key={indexB} alt={detector.name} className="w-full rounded-lg" />
									:
										<div className="w-full rounded-lg bg-red-400 h-32" />
									}
									<button className="bg-blue-500 hover:bg-blue-700ab absolute top-0 left-0 rounded-md px-2 py-1 text-white font-bold" onClick={() => {
										refreshDetectorImg(detector.config.imgsrc_idx, detector);
									}}>
										<ArrowPathIcon className={`w-6 h-6 ${camerasWaiting[detector.config.imgsrc_idx] && "animate-spin"}`} />
									</button>
									<Dropdown options={
										imageSources.map((source, idx) =>
											<div key={idx} className="flex flex-col place-items-center">
												<img src={`data:image/jpeg;base64,${source.image}`} alt={source.config.name} className="w-32 rounded-lg" />
												{ source.config.name }
											</div>
										)
									} selected={detector.config.vid_config.name != "" ? detector.config.vid_config.name : "Choose Img Src"} setSelected={(e, idx) => {
										changeDetectorImgSrc(detector, idx);
									}} />
								</div>
								<div className="flex flex-col place-items-center justify-center">
									<div className="font-bold place-self-center text-center mb-2">Condition Running?</div>
									<ReactSwitch checked={detector.config.enabled} onChange={(checked) => {
										const index = detectorIndiciesByGroup[indexA][indexB];
										changeDetectorEnabled(index, checked);
									}} />
								</div>
								<div className="flex flex-col justify-center h-full relative w-64">
									<div className="grid grid-cols-[1fr,80px] gap-2 px-5 justify-center">
										<div className="">Trigger Type:</div>
										<div className="">{detector.config.trigger_type}</div>
										<div className={` ${detector.config.trigger_type != "pin" && "hidden"}`}>Pin:</div>
										<div className={` ${detector.config.trigger_type != "pin" && "hidden"}`}>{detector.config.pin}</div>
										<div className={` ${detector.config.trigger_type != "pin" && "hidden"}`}>Pin Active State:</div>
										<div className={` ${detector.config.trigger_type != "pin" && "hidden"}`}>{detector.config.pin_active_state == 1 ? "HIGH" : "LOW"}</div>
										<div className={` ${detector.config.trigger_type != "time" && "hidden"}`}>{"Cycle Time:"}</div>
										<div className={` ${detector.config.trigger_type != "time" && "hidden"}`}>{detector.config.cycle_time + "s"}</div>
									</div>
								</div>
								<div className="w-full h-full flex flex-col place-items-center justify-center gap-4">
								<button className="flex place-items-center rounded-md backdrop-blur-xl backdrop-brightness-150 text-lg px-4 py-2 border-2 border-gray-300 bg-gray-200 hover:bg-gray-300 text-gray-600" onClick={() => {
										const index = detectorIndiciesByGroup[indexA][indexB];
										setEditOverlayIndex(index);
										setShowEditOverlay(true);
										setLastButtonWasAdd(false);
									}}>
										<Cog6ToothIcon className="w-6 h-6" />
									</button>
									<button className="bg-red-500 hover:bg-red-700 px-4 py-2 rounded text-white font-bold" onClick={() => {
										deleteDetector(detector);
									}}>
										<TrashIcon className="w-6 h-6" />
									</button>
								</div>
							</div>
						))}
						{/* add source */}
						<div className="mx-2 my-1 relative grid grid-cols-[200px,1fr,1fr,1fr] grid-rows-1 h-20 gap-4" key={indexA}>
							<div className="relative inline-block">
								<button className="w-full rounded-lg border-2 bg-gray-200 border-gray-300 text-gray-400 hover:bg-gray-300 h-full flex items-center justify-center" onClick={() => {
									setShowEditOverlay(true);
									setLastButtonWasAdd(true);
									setEditOverlayIndex(detectors.length);
									setDetectors((detectors) => detectors.concat({
										name: group[0]?.name ? group[0].name : "New Detector",
										query: group[0]?.query ? group[0].query : "New Query?",
										id: group[0]?.id ? group[0].id : "",
										config: {
											enabled: false,
											imgsrc_idx: 0,
											vid_config: detectors[0]?.config?.vid_config ? detectors[0].config.vid_config : {
												name: "webcam",
											},
											image: detectors[0]?.config?.image ? detectors[0].config.image : "",
											trigger_type: "time",
											cycle_time: 30,
										}
									}));
								}}>
									<PlusIcon className="w-16" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
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
			{
				detectors.length > 0 && showEditNotificationsOverlay && detectorsByGroup[editNotificationsOverlayGroupIndex][0] &&
				<EditNotificationsOverlay detector={detectorsByGroup[editNotificationsOverlayGroupIndex][0]} detectors={availableDetectors} index={0} onSave={async (e) => {
					setShowEditNotificationsOverlay(false);
					let detectors_copy = detectors.slice();
					for (const idx in detectorIndiciesByGroup[editNotificationsOverlayGroupIndex]) {
						detectors_copy[detectorIndiciesByGroup[editNotificationsOverlayGroupIndex][idx]].config.notifications = e.config;
					}
					setDetectors(detectors_copy);
					saveDetectors(detectors_copy);
				}} onBack={() => {
					setShowEditNotificationsOverlay(false);
				}} />
			}
		</main>
	);
}
