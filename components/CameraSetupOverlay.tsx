import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

export const CameraSetupOverlay = ({ onSelect, back }: { onSelect?: (cam: CameraType, index: number) => void, back?: () => void }) => {
    const [cameras, setCameras] = useState<CameraType[] | undefined>(undefined);
    const [camerasWaiting, setCamerasWaiting] = useState<boolean[]>([]); // cameras that are waiting for a response

    useEffect(() => {
        // fetch cameras
        fetch("/api/cameras").then((res) => res.json()).then((data) => {
            setCameras(data as CameraType[] ? data as CameraType[] : []);
            if (data as CameraType[]) setCamerasWaiting(new Array((data as CameraType[]).length).fill(false));
        });
    }, []);

    const refreshCamera = (idx: number, camera_config: CameraConfigType) => {
        // set camera waiting
        const cameras_waiting_copy = camerasWaiting.slice();
        cameras_waiting_copy[idx] = true;
        setCamerasWaiting(cameras_waiting_copy);
        
        // fetch cameras
        fetch("/api/refresh-camera", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(camera_config)
        }).then((res) => res.json()).then((data) => {
            if (!cameras) return;
            const cameras_copy = cameras.slice();
            if (!(cameras[idx].config === camera_config)) return;
            cameras_copy[idx].image = data.image;
            setCameras(cameras_copy);
            
            // set camera waiting false
            const cameras_waiting_copy = camerasWaiting.slice();
            cameras_waiting_copy[idx] = false;
            setCamerasWaiting(cameras_waiting_copy);
        });
    }

    return (
        // <div className="flex flex-col items-center shadow-md bg-white rounded-md p-5 fixed top-20 w-full left-0">
        // <div className="bg-blend-darken w-full h-full fixed backdrop-blur-lg top-0 left-0 flex pt-20 place-items-start justify-center" >
        <div className="flex flex-col items-center p-5 fixed top-10 w-[150%] -left-60 z-50">
            <div className="flex flex-col items-center shadow-md bg-white rounded-md p-5 relative w-1/2 overflow-y-scroll">
                <button className="absolute top-0 -left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-md z-51" onClick={() => back && back()} >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>

                {/* list cameras */}
                {/* <div className="flex flex-col gap-2 h-[500px]"> */}
                <div className="flex flex-col gap-2 h-[600px] relative">
                    <div className="font-bold">Cameras:</div>
                    <Spinner hidden={cameras !== undefined} />
                    <div className="flex flex-row flex-wrap gap-4 w-full place-content-center">
                        {cameras && cameras.map((camera, index) => (
                            <div key={index} className="w-60 flex flex-col shadow-xl rounded-md p-5">
                                <div className="relative m-1">
                                    <img src={`data:image/jpeg;base64,${camera.image}`} width={640} height={480} key={index} alt={camera.config.name} />
                                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute -right-1 -bottom-1" onClick={() => refreshCamera(index, camera.config)}>
                                        <ArrowPathIcon className={`h-4 w-4 ${camerasWaiting[index] && "animate-spin"}`} />
                                    </button>
                                </div>
                                <div className="m-auto p-2"></div>
                                <div className="font-bold">{camera.config.name}</div>
                                <div className="m-auto p-2"></div>
                                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded place-self-end" onClick={() => onSelect && onSelect(camera, index)}>
                                    use
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-5"></div>
                </div>
            </div>
        </div>
    );
}