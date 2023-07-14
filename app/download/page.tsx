"use client"

import { useEffect, useState } from "react";

export default function Page() {
    const [jsonDataUrl, setJsonDataUrl] = useState<string>("");
    const [yamlDataUrl, setYamlDataUrl] = useState<string>("");

    useEffect(() => {
        // update json data url
        fetch("/api/config-json-pretty").then((res) => res.json()).then((data) => {
          setJsonDataUrl(`data:application/json,${encodeURIComponent(data)}`);
        });
        // update yaml data url
        fetch("/api/config-yaml-pretty").then((res) => res.json()).then((data) => {
          setYamlDataUrl(`data:application/yaml,${encodeURIComponent(data)}`);
        });
      }, []);

    return (
        // <div className="flex fixed top-5 right-5 gap-5">
        <div className="flex flex-col gap-5 p-5 w-80">
            <a className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded text-center" href={jsonDataUrl} download="detector-configs.json" >
                Download Config as JSON
            </a>
            <a className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded text-center" href={yamlDataUrl} download="detector-configs.yaml" >
                Download Config as YAML
            </a>
        </div>
    );
}