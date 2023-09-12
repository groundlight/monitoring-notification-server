"use client"

import { useEffect, useState } from "react";

export default function Page() {
    const [apiKeyTemp, setApiKeyTemp] = useState<string>("");
    const [configFile, setConfigFile] = useState<File | null>(null);
    const [jsonDataUrl, setJsonDataUrl] = useState<string>("");
    const [yamlDataUrl, setYamlDataUrl] = useState<string>("");

    const updateState = () => {
        // update json data url
        fetch("/api/config-json-pretty").then((res) => res.json()).then((data) => {
          setJsonDataUrl(`data:application/json,${encodeURIComponent(data)}`);
        });
        // update yaml data url
        fetch("/api/config-yaml-pretty").then((res) => res.json()).then((data) => {
          setYamlDataUrl(`data:application/yaml,${encodeURIComponent(data)}`);
        });
        // fetch detector configs
        fetch("/api/config").then((res) => res.json()).then((data) => {
            setApiKeyTemp(data.api_key && data.api_key != "" ? (data.api_key as string).substring(0, 15) + "..." : "");
        });
    }

    useEffect(() => {
        updateState();
    }, []);

    const saveApiKey = (apiKey: string) => {
        // save api key
        fetch("/api/config/api_key", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
            }),
        }).then(() => {
            updateState();
        });
    }

    const uploadConfig = (config: string) => {
        // upload config
        fetch("/api/set_config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                config: config,
            }),
        }).then(() => {
            updateState();
        });
    }

    return (
        <div className="m-10" >
            <div className="text-2xl" >
                Set your Groundlight API Key:
            </div>
            <div className="p-2"></div>
            <div className="flex gap-2 mx-4">
                <input className="border-2 border-gray-300 rounded-md p-2" type="text" placeholder="API Key" value={apiKeyTemp} onChange={(e) => setApiKeyTemp(e.target.value)} />
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => {
                    saveApiKey(apiKeyTemp);
                }}>
                    Save
                </button>
            </div>
            <div className="p-10"></div>
            <div className="text-2xl" >
                Additional Settings:
            </div>
            <div className="p-2"></div>
            <div className="text-xl" >
                Download your Groundlight config file:
            </div>
            <div className="flex flex-col gap-5 p-5 w-80">
                <a className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded text-center" href={jsonDataUrl} download="detector-configs.json" >
                    Download Config as JSON
                </a>
                <a className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded text-center" href={yamlDataUrl} download="detector-configs.yaml" >
                    Download Config as YAML
                </a>
            </div>
            <div className="p-2"></div>
            <div className="text-xl" >
                Upload your Groundlight config file:
            </div>
            <div className="p-2"></div>
            <div className="flex gap-2 mx-4">
                <input className="border-2 border-gray-300 rounded-md p-2" type="file" onChange={(e) => setConfigFile(e.target.files ? e.target.files[0] : null)} />
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={(e) => {
                    e.preventDefault();
                    if (!configFile) return;
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const text = (e.target?.result as string);
                        console.log(text);
                        uploadConfig(text);
                    };
                    reader.readAsText(configFile);
                }}>
                    Upload
                </button>
            </div>
        </div>
    );
}