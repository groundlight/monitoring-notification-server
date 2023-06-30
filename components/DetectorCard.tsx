export const DetectorCard = ({ detector, index, onclick, }: 
    { detector: DetType, index: number, onclick: () => void }
) => {
    return (
        <div className="flex flex-col items-center shadow-md bg-white rounded-md p-5 relative" onClick={() => onclick()} >
            <div>{detector.name}</div>
            <div>{detector.query}</div>
            <div>Video Source #: {detector.config.vid_src}</div>
            {/* <div className="p-5"></div> */}
            {/* <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded absolute bottom-2 right-2" onClick={() => onclick({ api_key, detector, index })}>
                Delete
            </button> */}
        </div>
    );
};