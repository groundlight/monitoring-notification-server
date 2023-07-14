"use client"

import { DetectorCard } from "@/components/DetectorCard";
import { EditDetectorOverlay } from "@/components/EditDetectorOverlay";
import Image from "next/image";
import Link from "next/link";
// import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [detectors, setDetectors] = useState<DetType[]>([]);

  useEffect(() => {
    // fetch detector configs
    fetch("/api/config").then((res) => res.json()).then((data) => {
      setDetectors(data.detectors as DetType[] ? (data.detectors as DetType[]).filter(d => d.config.enabled) : []);
    });
  }, []);

  return (
    <main className="flex flex-col px-10 py-5 gap-2">
      <h1 className="text-4xl font-bold">Your enabled detectors:</h1>
      {
        detectors && detectors.length == 0 &&
        <div className="mx-10 my-5 text-xl">
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
      </div>
    </main>
  );
}
