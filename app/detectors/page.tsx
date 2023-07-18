"use client"

import { DetectorCard } from "@/components/DetectorCard";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function Home() {
  const [detectors, setDetectors] = useState<DetType[]>([]);
  const [availableDetectors, setAvailableDetectors] = useState<DetBaseType[]>([]);
  const [showEditOverlay, setShowEditOverlay] = useState<boolean>(false);
  const [editOverlayIndex, setEditOverlayIndex] = useState<number>(0);
  const [lastButtonWasAdd, setLastButtonWasAdd] = useState<boolean>(false);

  useEffect(() => {
    // fetch detector configs
    fetch("/api/config").then((res) => res.json()).then((data) => {
      setDetectors(data.detectors as DetType[] ? data.detectors as DetType[] : []);
    });

    // fetch available detectors
    fetch("/api/detectors").then((res) => res.json()).then((data) => {
      setAvailableDetectors(data as DetBaseType[] ? data as DetBaseType[] : []);
    });
  }, []);

  const saveDetectors = (detectors_to_save: DetType[]) => {
    // save detector configs
    fetch("/api/config/detectors", {
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
    const res = await fetch("/api/new-detector", {
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
      <div className="flex flex-wrap items-center gap-2 mx-10 my-5">
        {detectors && detectors.map((detector, index) => (
          <div className="flex flex-col items-center" key={index}>
            <DetectorCard detector={detector} index={index} onclick={() => {
              setEditOverlayIndex(index);
              setShowEditOverlay(true);
              setLastButtonWasAdd(false);
            }} />
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
      { detectors.length > 0 && showEditOverlay &&
        <EditDetectorOverlay detector={detectors[editOverlayIndex]} detectors={availableDetectors} index={0} onSave={ async (e) => {
          if (e.isNewDetector) {
            const id = await makeNewDetector(e.detector);
            if (id === "Failed") {
              // TODO: delete just created det
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
