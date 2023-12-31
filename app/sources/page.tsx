"use client"

import { NewCameraOverlay } from "@/components/NewCameraOverlay";
import { Spinner } from "@/components/Spinner";
import { useImageSources } from "@/utils/useImageSources";
import { ArrowPathIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function VideoPage() {
    const { imageSources: cameras, imageSourcesLoaded, refreshImageSource, refetchImageSources: fetchCameras } = useImageSources();
    const camerasWaiting = imageSourcesLoaded.map(val => !val);
    const [addCameraOverlayOpen, setAddCameraOverlayOpen] = useState<boolean>(false);

    const autodetect = () => {
        fetch("/api/cameras/autodetect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
        }).then(() => fetchCameras());
    }

    const deleteCamera = (idx: number) => {
        fetch("/api/cameras/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({idx: idx})
        }).then(() => fetchCameras());
    }

    return (
        <main className="flex flex-col items-start px-10 py-5 gap-2 relative overflow-scroll h-full">
            <h1 className="text-3xl font-semibold">Configure your Image Sources</h1>
            <Spinner hidden={cameras !== undefined} />
            <div className="flex flex-wrap items-stretch gap-8 mx-10 my-5">
                {cameras && cameras.map((camera, index) => (
                    <div key={index} className="w-60 flex flex-col shadow-xl rounded-md p-5 bg-white">
                        {
                            camera.image ?
                                <div className="relative m-1">
                                    <img src={`data:image/jpeg;base64,${camera.image}`} width={640} height={480} key={index} alt={camera.config.name} className="rounded" />
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute -right-1 -bottom-1" onClick={() => refreshImageSource(index)}>
                                        <ArrowPathIcon className={`h-4 w-4 ${camerasWaiting[index] && "animate-spin"}`} />
                                    </button>
                                </div>
                            :
                            <div className="bg-red-300 h-28 rounded p-10 flex place-content-center place-items-center text-center" >
                                Image Source Not Found
                            </div>
                        }
                        <div className="m-auto p-2"></div>
                        <div className="font-bold">{camera.config.name}</div>
                        <div className="m-auto p-2"></div>
                        <button className="bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-2 rounded mr-auto" onClick={() => deleteCamera(index)}>
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="fixed bottom-10 right-10 flex flex-col gap-4" >
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center" onClick={() => {
                    autodetect();
                }} >
                    <PlusIcon className="h-6 w-6" />
                    <div className="p-1 m-auto"></div>
                    Autodetect Sources
                    <div className="p-1 m-auto"></div>
                </button>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center" onClick={() => {
                    setAddCameraOverlayOpen(true);
                }} >
                    <PlusIcon className="h-6 w-6" />
                    <div className="p-1 m-auto"></div>
                    Add Other Image Source
                    <div className="p-1 m-auto"></div>
                </button>
            </div>
            {
                addCameraOverlayOpen &&
                <NewCameraOverlay onBack={() => {
                    setAddCameraOverlayOpen(false);
                    fetchCameras();
                }} />
            }
        </main>
    );
}