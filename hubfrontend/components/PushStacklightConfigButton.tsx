"use client"

import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

const filters: SerialPortFilter[] = [
    { 'usbVendorId': 0x303a }, // SeeedStudio XIAO Boards!
];

const TIME_TO_RESOLVE = 10000;

export const PushStacklightConfigButton = ({ valid, ssid, password, callback }:
    {valid?: boolean, ssid: string, password: string, callback: (res: boolean, ip: string) => void }
) => {
    const [working, setWorking] = useState<boolean>(false);

    const open = async (): Promise<SerialPort | null> => {
        const Serial = navigator.serial;
        try {
            const port = await Serial.requestPort({ filters: filters });
            await port.open({ baudRate: 115200 });
            return port;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    const write = async (port: SerialPort) => {
        setWorking(true);
        if (!port.writable) {
            console.log("not writable");
            return;
        }
        if (port.writable.locked) {
            console.log("write locked");
            return;
        }

        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        const writer = textEncoder.writable.getWriter();
        await writer.write(JSON.stringify({ ssid: ssid, password: password }) + "\n");
        await writer.close();
        writer.releaseLock();
        await writableStreamClosed.catch(() => {/* ignore the error */});
    }

    const initRead = async (port: SerialPort) => {
        if (!port.readable) {
            console.log("not readable");
            return;
        }
        if (port.readable.locked) {
            console.log("read locked");
            return;
        }

        let resolved = false;
        const resolver = new Promise(resolve => setTimeout(resolve, TIME_TO_RESOLVE));
        resolver.then(() => {
            resolved = true;
        });

        const deepCompare = (arg1: any, arg2: any): boolean => {
            if (Object.prototype.toString.call(arg1) === Object.prototype.toString.call(arg2)){
              if (Object.prototype.toString.call(arg1) === '[object Object]' || Object.prototype.toString.call(arg1) === '[object Array]' ){
                if (Object.keys(arg1).length !== Object.keys(arg2).length ){
                  return false;
                }
                return (Object.keys(arg1).every(function(key){
                  return deepCompare(arg1[key],arg2[key]);
                }));
              }
              return (arg1===arg2);
            }
            return false;
          }

        // Listen to data coming from the serial device.
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();
        let input = "";
        let write_attempts = 0;
        const countChar = (str: string, char: string) => {
            return str.split(char).length - 1;
        }
        while (true) {
            const { value, done } = await reader.read();
            input += value;
            if (input.includes("{") && input.includes("}") && countChar(input, "{") === countChar(input, "}")) {
                console.log(input);
                try {
                    const json = JSON.parse(input.substring(input.indexOf("{"), input.lastIndexOf("}") + 1));
                    console.log("json:")
                    console.log(json);
                    input = "";
                    if ("ip" in json) {
                        console.log("programmed");
                        setWorking(false);
                        callback(true, json.ip);
                        break;
                    } else {
                        if (write_attempts > 6) {
                            console.log("failed to program");
                            setWorking(false);
                            callback(false, "");
                            break;
                        }
                        await write(port);
                        write_attempts++;
                    }
                } catch (e) {
                    input = "";
                    console.error(e);
                    if (write_attempts > 6) {
                        console.log("failed to program");
                        setWorking(false);
                        callback(false, "");
                        break;
                    }
                    await write(port);
                    write_attempts++;
                }
            }
            if (resolved) {
                console.log("failed to program");
                setWorking(false);
                callback(false, "");
                break;
            }
        }
        setWorking(false);
        void reader.cancel();
        await readableStreamClosed.catch(() => {/* ignore the error */});

        await port.close();
    }

    const handlePushConfig = async () => {
        // connect to esp32
        const port = await open();

        if (!port) {
            return;
        }

        // push json to esp32 with webusb
        initRead(port);
        await write(port);
        // port.close();
    }

    return (
        <button className={`${valid ? "bg-blue-500 hover:bg-blue-700" : "bg-red-500 hover:bg-red-700"} text-white font-bold py-2 px-4 rounded flex gap-1 items-center`} onClick={() => {
            if (valid === false) {
                return;
            }
            handlePushConfig();
        }}>
            <Spinner hidden={!working} />
            Push Stacklight Config
        </button>
    )
}