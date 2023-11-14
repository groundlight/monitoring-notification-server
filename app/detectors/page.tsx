"use client"

import { Dropdown } from "@/components/Dropdown";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import { EditNotificationsOverlay } from "@/components/EditNotificationsOverlay";
import { useAvailableDetectors } from "@/utils/useAvailableDetectors";
import { useDetectors } from "@/utils/useDetectors";
import { useImageSources } from "@/utils/useImageSources";
import { ArrowPathIcon, ArrowUpRightIcon, Cog6ToothIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import ReactSwitch from "react-switch";

type LastActionType = 'CreateNewDetector' | 'AddExistingDetector' | 'EditDetector' | 'EditNotifications' | 'AddImageSourceToDetector';

export default function Home() {
	const { isLoading, isError, detectors, detectorsByGroup, refetchDetectors, newDetector } = useDetectors();
	const { detectors: availableDetectors } = useAvailableDetectors();
	const [showEditOverlay, setShowEditOverlay] = useState<boolean>(false);
	const [editOverlayDet, setEditOverlayDet] = useState<DetExpType | undefined>(undefined);
	const [lastAction, setLastAction] = useState<LastActionType>('CreateNewDetector');
	const { imageSources, imageSourcesLoaded, refreshImageSource } = useImageSources();
	const camerasWaiting = imageSourcesLoaded.map(val => !val);
	const [showEditNotificationsOverlay, setShowEditNotificationsOverlay] = useState<boolean>(false);
	const [editNotificationsOverlayGroupIndex, setEditNotificationsOverlayGroupIndex] = useState<number>(0);

	const makeNewDetector = async (detector: DetType) => {
		const res = await fetch("/api/new-detector", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(detector),
		}).then((res) => res.json());

		return res;
	}

	const changeDetectorImgSrc = (detector: DetExpType, imgsrc_idx: number) => {
		detector.edit({ ...detector, config: {
			...detector.config, imgsrc_idx: imgsrc_idx, image: imageSources[imgsrc_idx].image
		} })
	}

	const refreshDetectorImg = (idx: number, det: DetExpType) => {
		refreshImageSource(idx).then(() => {
			det.edit({ ...det, config: { ...det.config, image: imageSources[idx].image } })
		});
    }

	return (
		<main className="flex flex-col items-start px-10 py-5 gap-2 relative h-full">
			<div className="flex w-full gap-4 flex-wrap">
				{/* title bar */}
				<h1 className="text-3xl font-semibold">Configure your Groundlight Detectors</h1>
				<div className="flex gap-4 ml-auto">
					<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-lg flex items-center text-sm" onClick={async () => {
						setShowEditOverlay(true);
						setLastAction('CreateNewDetector');
						setEditOverlayDet(await newDetector({
							name: "New Detector",
							query: "New Query?",
							id: "",
							config: {
								enabled: false,
								imgsrc_idx: -1,
								image: "",
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
						<Dropdown options={availableDetectors.map(d => d.name)} selected="Add Existing Detector" setSelected={async (e, idx) => {
							setLastAction('AddExistingDetector');
							setEditOverlayDet(await newDetector({
								name: availableDetectors[idx].name,
								query: availableDetectors[idx].query,
								id: availableDetectors[idx].id,
								config: {
									enabled: false,
									imgsrc_idx: -1,
									image: "",
									trigger_type: "time",
									cycle_time: 30,
								}
							}));
						}} className="!border-0 !bg-blue-500 hover:!bg-blue-700 !font-bold !text-white"/>
					</div>
				</div>
			</div>
			<div className="p-1"></div>
			<div className="bg-white overflow-scroll p-4 rounded-xl min-h-[600px] shadow-md w-full">
				{detectorsByGroup && detectorsByGroup.map((group, indexA) => (
					<div className="flex flex-col items-start" key={indexA}>
						<div className="p-1"></div>
						<div className="grid grid-cols-[minmax(0,1fr),minmax(0,1fr),56px] gap-4 w-full px-4 py-1 border-y-[1px] border-black">
							<a
								href={"https://app.groundlight.ai/reef/detectors/" + group[0].id}
								target="_blank"
								className="text-lg hover:bg-gray-200 hover:text-gray-700 rounded-md px-4 py-1 mr-auto"
							>
								{group[0].name}
								<ArrowUpRightIcon className="ml-2 w-5 h-5 inline-block" />
							</a>
							<h2 className="text-lg py-1">{group[0].query}</h2>
							<button className="hover:bg-gray-200 hover:text-gray-700 rounded-md px-2 py-1 font-bold" onClick={() => {
								setShowEditNotificationsOverlay(true);
								setEditNotificationsOverlayGroupIndex(indexA);
							}}>
								<Cog6ToothIcon className="w-6 h-6 m-auto"/>
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
									} selected={detector.config.imgsrc_idx >= 0 && imageSources.length > 0 ? imageSources[detector.config.imgsrc_idx].config.name : "Choose Img Src"} setSelected={(e, idx) => {
										changeDetectorImgSrc(detector, idx);
									}} />
								</div>
								<div className="flex flex-col place-items-center justify-center">
									<div className="font-bold place-self-center text-center mb-2">Condition Running?</div>
									<ReactSwitch checked={detector.config.enabled} onChange={(checked) => {
										detector.edit({ ...detector, config: { ...detector.config, enabled: checked } })
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
										setEditOverlayDet(detector);
										setShowEditOverlay(true);
										setLastAction('EditDetector');
									}}>
										<Cog6ToothIcon className="w-6 h-6" />
									</button>
									<button className="bg-red-500 hover:bg-red-700 px-4 py-2 rounded text-white font-bold" onClick={() => {
										detector.delete();
									}}>
										<TrashIcon className="w-6 h-6" />
									</button>
								</div>
							</div>
						))}
						{/* add source */}
						<div className="mx-2 my-1 relative grid grid-cols-[200px,1fr,1fr,1fr] grid-rows-1 h-20 gap-4" key={indexA}>
							<div className="relative inline-block">
								<button className="w-full rounded-lg border-2 bg-gray-200 border-gray-300 text-gray-400 hover:bg-gray-300 h-full flex items-center justify-center" onClick={async () => {
									setShowEditOverlay(true);
									setLastAction('AddImageSourceToDetector');
									setEditOverlayDet(await newDetector({
										name: group[0].name,
										query: group[0].query,
										id: group[0].id,
										config: {
											enabled: false,
											imgsrc_idx: -1,
											image: "",
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
			{detectors.length > 0 && showEditOverlay && editOverlayDet &&
				<EditDetectorOverlay detector={editOverlayDet} detectors={availableDetectors} index={0} startWithNew={lastAction == 'CreateNewDetector'} onSave={async (e) => {
					if (e.isNewDetector) {
						const id = await makeNewDetector(e.detector);
						if (id === "Failed") {
							setShowEditOverlay(false);
							editOverlayDet.delete();
							return;
						}
						e.detector.id = id;
					}
					setShowEditOverlay(false);
					editOverlayDet.edit(e.detector);
				}} onDelete={() => {
					setShowEditOverlay(false);
					editOverlayDet.delete();
				}} onBack={() => {
					setShowEditOverlay(false);
					if (lastAction === 'CreateNewDetector' || lastAction === 'AddExistingDetector' || lastAction === 'AddImageSourceToDetector') {
						editOverlayDet.delete();
					}
				}} />
			}
			{
				detectors.length > 0 && showEditNotificationsOverlay && detectorsByGroup[editNotificationsOverlayGroupIndex][0] &&
				<EditNotificationsOverlay detector={detectorsByGroup[editNotificationsOverlayGroupIndex][0]} detectors={availableDetectors} index={0} onSave={async (e) => {
					setShowEditNotificationsOverlay(false);
					for (const det of detectorsByGroup[editNotificationsOverlayGroupIndex]) {
						det.edit({ ...det, config: { ...det.config, notifications: e.config } })
					}
				}} onBack={() => {
					setShowEditNotificationsOverlay(false);
				}} />
			}
		</main>
	);
}
