import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import ReactSwitch from "react-switch";
import { PushStacklightConfigButton } from "./PushStacklightConfigButton";
import useEscape from "@/hooks/useEscape";
import { Dropdown } from "./Dropdown";
import Link from "next/link";

export const EditNotificationsOverlay = ({ detector, index, onSave, onBack }:
    { detector: DetType, detectors: DetBaseType[], index: number, onSave: (e: { config: NotificationOptionsType, index: number }) => void, onBack: () => void }
) => {
    useEscape(onBack);
    const [condition, setCondition] = useState<NotificationCondition>(detector.config.notifications?.condition || "FAIL");
    const [slackNotification, setSlackNotification] = useState<{
		token: string;
		channel_id: string;
	} | undefined>(detector.config.notifications?.slack);
    const [twilioNotification, setTwilioNotification] = useState<{
		account_sid: string;
		auth_token: string;
		from_number: string;
		to_number: string;
	} | undefined>(detector.config.notifications?.twilio);
    const [emailNotification, setEmailNotification] = useState<{
		from_email: string;
		to_email: string;
		email_password: string;
        host: string;
	} | undefined>(detector.config.notifications?.email);
    const [stacklightNotification, setStacklightNotification] = useState<{
		ip?: string;
		id?: string;
		ssid?: string;
		password?: string;
	} | undefined>(detector.config.notifications?.stacklight);
    const [stacklightConfigSelected, setStacklightConfigSelected] = useState<string>("Setup with IP Addr");

    const slackValid = !(slackNotification && (slackNotification.token === "" || slackNotification.channel_id === ""));
    const twilioValid = !(twilioNotification && (twilioNotification.account_sid === "" || twilioNotification.auth_token === "" || twilioNotification.from_number === "" || twilioNotification.to_number === ""));
    const emailValid = !(emailNotification && (emailNotification.from_email === "" || emailNotification.to_email === "" || emailNotification.email_password === "" || emailNotification.host === ""));
    const stacklightValid = !(stacklightNotification && stacklightNotification.ip === "");
    const isDetectorValid = slackValid && twilioValid && emailValid && stacklightValid;

    return (
        <div className="bg-blend-darken w-full h-full absolute backdrop-blur-lg top-0 left-0 flex pt-5 place-items-start justify-center" >
            <div className="flex flex-col items-center shadow-md bg-white rounded-md p-5 w-[40%] relative overflow-y-scroll overflow-x-visible max-h-[calc(100%-40px)]">
                <div className="flex flex-col gap-2 relative">
                    <div className="flex gap-2">
                        <div className="font-bold place-self-center">Detector Name:</div>
                        <div className="border-2 border-gray-300 rounded-md p-2 w-full"><div className="pt-0.5">{detector.name}</div></div>
                    </div>
                    <div className="flex gap-2">
                        <div className="font-bold place-self-center">Detector Query:</div>
                        <div className="border-2 border-gray-300 rounded-md p-2 w-full"><div className="pt-0.5">{detector.query}</div></div>
                    </div>

                    {/* Notifification Condition Switch */}
                    <div className="p-2"></div>
                    <div className="font-bold place-self-center">Notification On:</div>
                    <div className="flex gap-2 w-full justify-center place-items-center">
                        <div className={`font-bold place-self-center px-4 py-2 border-2 rounded-md ${condition === "FAIL" ? "border-red-500" : "border-white"}`}>Fail</div>
                        <ReactSwitch checked={condition === "PASS"} onChange={(checked) => {
                            setCondition(checked ? "PASS" : "FAIL");
                        }} checkedIcon={false} uncheckedIcon={false} offColor="#CC3333" />
                        <div className={`font-bold place-self-center px-4 py-2 border-2 rounded-md ${condition === "PASS" ? "border-[#080]" : "border-white"}`}>Pass</div>
                    </div>
                    <div className="p-2"></div>

                    <div className="flex gap-2">
                        <div className="font-bold  place-self-center">Enable Slack:</div>
                        <ReactSwitch checked={!!slackNotification} onChange={(checked) => {
                            if (checked) {
                                setSlackNotification({
                                    token: "",
                                    channel_id: "",
                                });
                            } else {
                                setSlackNotification(undefined);
                            }
                        }} />
                    </div>
                    {
                        slackNotification &&
                        <>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Slack Token:</div>
                                <input className={`border-2 ${slackValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Slack Token" value={slackNotification.token} onChange={(e) => setSlackNotification({
                                    ...slackNotification,
                                    token: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Slack Channel ID:</div>
                                <input className={`border-2 ${slackValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Slack Channel ID" value={slackNotification.channel_id} onChange={(e) => setSlackNotification({
                                    ...slackNotification,
                                    channel_id: e.target.value,
                                })} />
                            </div>
                        </>
                    }
                    <div className="flex gap-2">
                        <div className="font-bold  place-self-center">Enable Twilio:</div>
                        <ReactSwitch checked={!!twilioNotification} onChange={(checked) => {
                            if (checked) {
                                setTwilioNotification({
                                    account_sid: "",
                                    auth_token: "",
                                    from_number: "",
                                    to_number: "",
                                });
                            } else {
                                setTwilioNotification(undefined);
                            }
                        }
                        } />
                    </div>
                    {
                        twilioNotification &&
                        <>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Twilio Account SID:</div>
                                <input className={`border-2 ${twilioValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Twilio Account SID" value={twilioNotification.account_sid} onChange={(e) => setTwilioNotification({
                                    ...twilioNotification,
                                    account_sid: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Twilio Auth Token:</div>
                                <input className={`border-2 ${twilioValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Twilio Auth Token" value={twilioNotification.auth_token} onChange={(e) => setTwilioNotification({
                                    ...twilioNotification,
                                    auth_token: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Twilio Sender Number:</div>
                                <input className={`border-2 ${twilioValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Twilio From Number" value={twilioNotification.from_number} onChange={(e) => setTwilioNotification({
                                    ...twilioNotification,
                                    from_number: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Twilio Recipient Number:</div>
                                <input className={`border-2 ${twilioValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Twilio To Number" value={twilioNotification.to_number} onChange={(e) => setTwilioNotification({
                                    ...twilioNotification,
                                    to_number: e.target.value,
                                })} />
                            </div>
                        </>
                    }
                    <div className="flex gap-2">
                        <div className="font-bold  place-self-center">Enable Email:</div>
                        <ReactSwitch checked={!!emailNotification} onChange={(checked) => {
                            if (checked) {
                                setEmailNotification({
                                    from_email: "",
                                    to_email: "",
                                    email_password: "",
                                    host: "",
                                });
                            } else {
                                setEmailNotification(undefined);
                            }
                        }
                        } />
                    </div>
                    {
                        emailNotification &&
                        <>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Email Sender:</div>
                                <input className={`border-2 ${emailValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Email Sender" value={emailNotification.from_email} onChange={(e) => setEmailNotification({
                                    ...emailNotification,
                                    from_email: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Email Recipient:</div>
                                <input className={`border-2 ${emailValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Email Recipient" value={emailNotification.to_email} onChange={(e) => setEmailNotification({
                                    ...emailNotification,
                                    to_email: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Email Token:</div>
                                <input className={`border-2 ${emailValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Email Token" value={emailNotification.email_password} onChange={(e) => setEmailNotification({
                                    ...emailNotification,
                                    email_password: e.target.value,
                                })} />
                            </div>
                            <div className="flex gap-2">
                                <div className="font-bold  place-self-center">Email Host:</div>
                                <input className={`border-2 ${emailValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Email Host" value={emailNotification.host} onChange={(e) => setEmailNotification({
                                    ...emailNotification,
                                    host: e.target.value,
                                })} />
                            </div>
                        </>
                    }
                    <div className="p-2"></div>
                    <div className="font-bold place-self-center">Plugins:</div>
                    <div className="p-1"></div>
                    <div className="flex gap-2">
                        <div className="font-bold  place-self-center">Enable Stacklight:</div>
                        <ReactSwitch checked={!!stacklightNotification} onChange={(checked) => {
                            if (checked) {
                                setStacklightNotification({
                                    id: "",
                                });
                            } else {
                                setStacklightNotification(undefined);
                            }
                        }
                        } />
                        </div>
                    {
                        stacklightNotification &&
                        <>
                            <Dropdown options={["Setup with IP Addr", "Initial setup with USB"]} selected={stacklightConfigSelected} setSelected={setStacklightConfigSelected} />
                            <div className="p-1"></div>
                            {
                                stacklightConfigSelected === "Setup with IP Addr" ?
                                <>
                                    <div className="flex gap-2">
                                        <div className="font-bold  place-self-center">Stacklight IP:</div>
                                        <input className={`border-2 ${stacklightValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Stacklight IP" value={stacklightNotification.ip} onChange={(e) => setStacklightNotification({
                                            ...stacklightNotification,
                                            ip: e.target.value,
                                        })} />
                                    </div>
                                </>
                                :
                                <>
                                    {
                                        !!navigator.serial ?
                                        <>
                                            <div className="flex gap-2">
                                                <div className="font-bold  place-self-center">Stacklight SSID:</div>
                                                <input className={`border-2 ${stacklightValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Stacklight SSID" value={stacklightNotification.ssid} onChange={(e) => setStacklightNotification({
                                                    ...stacklightNotification,
                                                    ssid: e.target.value,
                                                })} />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="font-bold  place-self-center">Stacklight Password:</div>
                                                <input className={`border-2 ${stacklightValid ? "border-gray-300" : "border-red-500"} rounded-md p-2 w-full`} type="text" placeholder="Stacklight Password" value={stacklightNotification.password} onChange={(e) => setStacklightNotification({
                                                    ...stacklightNotification,
                                                    password: e.target.value,
                                                })} />
                                            </div>
                                            <div className="ml-auto">
                                                <PushStacklightConfigButton valid={
                                                    stacklightNotification.ssid !== undefined && stacklightNotification.ssid !== "" && stacklightNotification.password !== undefined && stacklightNotification.password !== ""
                                                } ssid={stacklightNotification.ssid || ""} password={stacklightNotification.password || ""} callback={(worked, ip) => {
                                                    if (worked) {
                                                        setStacklightNotification({
                                                            ...stacklightNotification,
                                                            ip: ip,
                                                        });
                                                    }
                                                }} />
                                            </div>
                                        </>
                                        :
                                        <div className="ml-auto">
                                            <a href={"https://code.groundlight.ai/groundlight-embedded-uploader/stacklight"} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex gap-1 items-center" >
                                                Setup Stacklight Here <ArrowRightIcon className="h-5 w-5" />
                                            </a>
                                        </div>
                                    }
                                </>
                            }
                        </>
                    }
                    
                </div>
                <div className="p-4"></div>
                <div className="flex gap-2 justify-between w-full">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-md flex place-items-center gap-1" onClick={() => onBack()} >
                        <ArrowLeftIcon className="h-5 w-5" /> {"Back"}
                    </button>

                    <button className={`${isDetectorValid ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-500"} text-white font-bold py-2 px-4 rounded`} disabled={!isDetectorValid} onClick={() => {
                        onSave({
                            config: {
                                condition: condition,
                                slack: slackNotification,
                                twilio: twilioNotification,
                                email: emailNotification,
                                stacklight: stacklightNotification,
                            },
                            index: index,
                        })
                    }}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}