export const DetectorCard = ({ detector, index, onclick, }: 
    { detector: DetType, index: number, onclick: () => void }
) => {
    return (
        <div className="flex flex-col items-center shadow-md bg-white rounded-md p-5 relative w-60" onClick={() => onclick()} >
            {
                !detector.config.enabled &&
                <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold py-2 px-2 rounded-md">
                    disabled
                </div>
            }
            <img src={`data:image/jpeg;base64,${detector.config.image}`} width={640} height={480} key={index} alt={detector.name} />
            <div>{detector.name}</div>
            <div>{detector.query}</div>
        </div>
    );
};