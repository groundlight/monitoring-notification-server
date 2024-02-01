"use client"

import { useEffect, useState } from "react";

export const useDetectors = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [detectors, setDetectors] = useState<DetType[]>([]);
    const [detectorsByGroup, setDetectorsByGroup] = useState<DetExpType[][]>([]);

    const saveDetectors = async (detectors_to_save: DetType[]) => {
		// save detector configs
		await fetch("/api/config/detectors", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				detectors: detectors_to_save,
			}),
		})
	};

    const saveAndFetch = async (detectors_to_save: DetType[]) => {
        await saveDetectors(detectors_to_save);
        await fetchConfig();
    }

    const deleteDetector = async (index: number) => {
        setDetectors((prev) => {
            const new_detectors = prev.filter((_, i) => i !== index);
            saveAndFetch(new_detectors);
            return new_detectors;
        });
    }

    const editDetector = async (index: number, det: DetType) => {
        setDetectors((prev) => {
            const new_detectors = prev.map((d, i) => i === index ? det : d);
            saveAndFetch(new_detectors);
            return new_detectors;
        });
    }

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            await fetch("/api/config").then((res) => res.json()).then((data) => {
                console.log("fetchConfig", data.detectors)
                setDetectors(data.detectors as DetType[] ? data.detectors as DetType[] : []);
                if (data?.detectors) {
                    const detByGroup = (data.detectors as DetType[]).reduce((acc: DetExpType[][], cur: DetType, old_idx: number) => {
                        const idx = acc.reduce((pre: number, group: DetType[], idx) => group[0].name === cur.name ? idx : pre, -1);
                        const new_exp_det = {
                            ...cur,
                            delete: () => deleteDetector(old_idx),
                            edit: (det: DetType) => editDetector(old_idx, det),
                        };
                        if (idx !== -1) acc[idx].push(new_exp_det);
                        else acc.push([new_exp_det]);
                        return acc;
                    }, []);
                    setDetectorsByGroup(detByGroup);
                }
                return data;
            });
        } catch {
            setIsError(true);
        }
        setIsLoading(false);
	}

    useEffect(() => {
        fetchConfig();
    }, []);

    const refetchDetectors = async () => {
        fetchConfig();
    }

    const newDetector = async (det: DetType) => {
        let detectors_copy = [...detectors];
        detectors_copy.push(det);
        await saveDetectors(detectors_copy);
        await fetchConfig();
        return {
            ...det,
            delete: () => deleteDetector(detectors_copy.length - 1),
            edit: (det: DetType) => editDetector(detectors_copy.length - 1, det),
        }
    }

    return { isLoading, isError, detectors, detectorsByGroup, refetchDetectors, newDetector };
}
