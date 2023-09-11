import { useEffect, useState } from "react";

export const useImageSources = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [imageSources, setImageSources] = useState<CameraType[]>([]);
    const [imageSourcesLoaded, setImageSourcesLoaded] = useState<boolean[]>([]);

    const fetchImageSources = async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await fetch("/api/cameras");
            const data = await res.json();
            setImageSources(data);
            setImageSourcesLoaded(data.map(() => true));
        } catch (err) {
            setIsError(true);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchImageSources();
    }, []);

    const refetchImageSources = () => {
        fetchImageSources();
    }

    const refreshImageSource = async (index: number) => {
        if (index < 0 || index >= imageSources.length) return;

        setImageSourcesLoaded(prev => {
            prev[index] = false;
            return prev;
        });

        // fetch cameras
        try {
            const res = await fetch("/api/refresh-camera", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(imageSources[index].config)
            });
            const data = await res.json();
            setImageSources(prev => {
                const copy = prev.slice();
                copy[index].image = data.image;
                return copy;
            });
        } catch {
            setIsError(true);
        }

        setImageSourcesLoaded(prev => {
            prev[index] = true;
            return prev;
        });
    }

    return { isLoading, isError, imageSources, imageSourcesLoaded, refetchImageSources, refreshImageSource };
}