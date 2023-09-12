import { useEffect, useState } from "react";

export const useAvailableDetectors = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [detectors, setDetectors] = useState<DetBaseType[]>([]);

    const fetchDetectors = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await fetch("/api/detectors");
            const data = await res.json();
            setDetectors(data);
        } catch (err) {
            setIsError(true);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchDetectors();
    }, []);

    const refetchDetectors = () => {
        fetchDetectors();
    }

    return { isLoading, isError, detectors: detectors, refetchDetectors: refetchDetectors };
}
