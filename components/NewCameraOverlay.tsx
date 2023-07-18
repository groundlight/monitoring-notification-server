import { useState } from "react";
import { Dropdown } from "./Dropdown";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BASE_SERVER_URL } from "@/utils/config";

const CameraTypes = ["RTSP Feed"];

export const NewCameraOverlay = ({ onBack }: { onBack: () => void }) => {
    const [srcType, setSrcType] = useState<string>(CameraTypes[0]);
    const [name, setName] = useState<string>("");
    const [rtspURL, setRtspURL] = useState<string>("");

    const makeNewImageSource = async () => {
        if (srcType == "RTSP Feed") {
            await fetch(BASE_SERVER_URL + "/api/cameras/new", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    input_type: "rtsp",
                    address: {
                        rtsp_url: rtspURL
                    }
                })
            })
        }
    }

    return (
        <div className="bg-blend-darken w-full h-full absolute backdrop-blur-lg top-0 left-0 flex pt-20 place-items-start justify-center">
            <div className="bg-white w-1/2 shadow-lg rounded-lg py-10 px-20 relative">
                <button className="absolute top-0 -left-16 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-lg" onClick={() => onBack()} >
                    <ArrowLeftIcon className="h-8 w-8" />
                </button>
                <div className="text-center text-lg font-semibold">
                    Camera Settings:
                </div>
                <div className="p-1"></div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <div className="font-bold place-self-center">Type:</div>
                        <Dropdown options={CameraTypes} selected={srcType} setSelected={(e, idx) => {
                            setSrcType(e);
                        }} />
                    </div>
                    <div className="flex gap-2">
                        <div className="font-bold place-self-center">Name:</div>
                        <input className="border-2 border-gray-300 rounded-md p-2 w-full" type="text" placeholder="Camera Name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    {
                        srcType === "RTSP Feed" &&
                        <div className="flex gap-2">
                            <div className="font-bold place-self-center">RTSP URL:</div>
                            <input className="border-2 border-gray-300 rounded-md p-2 w-full" type="text" placeholder="Camera RTSP URL" value={rtspURL} onChange={(e) => setRtspURL(e.target.value)} />
                        </div>
                    }
                    <div className="p-10"></div>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute bottom-5 right-5" onClick={ async () => {
                        await makeNewImageSource();
                        onBack();
                    }} >
                        Add Image Source
                    </button>
                </div>
            </div>
        </div>
    );
}