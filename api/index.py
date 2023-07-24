from dataclasses import dataclass
import multiprocessing
import time
from typing import List, Union
from fastapi import FastAPI, WebSocket
import json
import yaml
import groundlight
import pydantic
from api.gl_process import run_process, push_label_result
import framegrab
from framegrab import FrameGrabber
import cv2
import base64
import asyncio

class Config(pydantic.BaseModel):
    enabled: bool
    imgsrc_idx: int
    vid_config: dict
    image: str
    trigger_type: str
    cycle_time: Union[int, None]
    pin: Union[int, None]
    pin_active_state: Union[int, None]

class Detector(pydantic.BaseModel):
    name: str
    id: str
    query: str
    config: Config

class DetectorList(pydantic.BaseModel):
    detectors: List[Detector]

@dataclass
class FakeDetector:
    config: dict

app = FastAPI()

app.DETECTOR_PROCESSES: List[multiprocessing.Process] = []
app.DETECTOR_PHOTO_QUEUES: List[multiprocessing.Queue] = []
app.DETECTOR_GRAB_NOTIFY_QUEUES: List[multiprocessing.Queue] = []
app.DETECTOR_WEBSOCKET_RESPONSE_QUEUES: List[multiprocessing.Queue] = []
app.DETECTOR_CONFIG = {}
app.WEBSOCKET_IMG_QUEUE: multiprocessing.Queue = multiprocessing.Queue(10)
app.WEBSOCKET_METADATA_QUEUE: multiprocessing.Queue = multiprocessing.Queue(10)
app.WEBSOCKET_CANCEL_QUEUE: multiprocessing.Queue = multiprocessing.Queue(10)
app.WEBSOCKET_RESPONSE_QUEUE: multiprocessing.Queue = multiprocessing.Queue(10)
# app.WEBSOCKET_RESPONSE_QUEUES: List[multiprocessing.Queue] = []
# app.WEBSOCKET_RESPONSE_QUEUE

def get_base64_img(g: FrameGrabber) -> Union[str, None]:
    try:
        return base64.b64encode(cv2.imencode(".jpg", g.grab())[1])
    except:
        # g.release()
        return None

def fetch_config() -> dict:
    with open("./api/gl_config.json", "r") as f:
        return json.load(f)

def store_config(config: dict):
    with open("./api/gl_config.json", "w") as f:
        json.dump(config, f, indent=4)

def set_in_config(params: dict):
    config = fetch_config()
    for k, v in params.items():
        config[k] = v
    store_config(config)

def start_processes(api_key, endpoint, detectors):
    app.DETECTOR_CONFIG = {
        "api_key": api_key,
        "endpoint": endpoint,
        "detectors": detectors,
    }
    detectors = list(filter(lambda d: d["config"]["enabled"], detectors))
    app.DETECTOR_PHOTO_QUEUES = [multiprocessing.Queue(1) for _ in detectors]
    app.DETECTOR_GRAB_NOTIFY_QUEUES = [multiprocessing.Queue(1) for _ in detectors]
    app.DETECTOR_WEBSOCKET_RESPONSE_QUEUES = [multiprocessing.Queue(1) for _ in detectors]
    app.DETECTOR_PROCESSES = []
    for i in range(len(detectors)):
        process = multiprocessing.Process(target=run_process, args=(
            i,
            detectors[i],
            api_key,
            endpoint,
            app.DETECTOR_GRAB_NOTIFY_QUEUES[i],
            app.DETECTOR_PHOTO_QUEUES[i],
            # app.WEBSOCKET_IMG_QUEUE,
            app.WEBSOCKET_METADATA_QUEUE,
            app.WEBSOCKET_CANCEL_QUEUE,
            app.DETECTOR_WEBSOCKET_RESPONSE_QUEUES[i],
        ))
        app.DETECTOR_PROCESSES.append(process)
        process.start()

def make_grabbers():
    grabbers: List[framegrab.grabber.WebcamFrameGrabber | framegrab.grabber.BaslerUSBFrameGrabber | framegrab.grabber.RealSenseFrameGrabber | framegrab.grabber.RTSPFrameGrabber] = []
    config = fetch_config()
    if "image_sources" not in config:
        print("Failed to make grabbers")
        return grabbers

    for src in config["image_sources"]:
        try:
            g = framegrab.FrameGrabber.create_grabber(src)
            grabbers.append(g)
        except:
            print(f"Failed to create image source [{src['name']}]")
            grabbers.append(FakeDetector(src))

    return grabbers

print("Loading config...")
try:
    config = fetch_config()
    detectors = config["detectors"] if "detectors" in config else []
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None
except:
    print("Failed to load config")
    app.DETECTOR_PROCESSES = []
    store_config({})

try:
    start_processes(api_key, endpoint, detectors)
except:
    print("Failed to start processes")

app.ALL_GRABBERS: List[FrameGrabber] = make_grabbers()

###################### the api #######################

@app.get("/api/config")
def get_config():
    return fetch_config()
    
@app.get("/api/config-json-pretty")
def get_config_json_pretty():
    config = fetch_config()
    if "detectors" in config:
        for d in config["detectors"]:
            del d["config"]["image"]
    return json.dumps(config, indent=4)

@app.get("/api/config-yaml-pretty")
def get_config_json_pretty():
    config = fetch_config()
    if "detectors" in config:
        for d in config["detectors"]:
            del d["config"]["image"]
    return yaml.dump(config, indent=4)
    
@app.get("/api/detectors")
def get_detectors():
    config = fetch_config()
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None
    # TODO: use this as default gl
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    try:
        return [json.loads(d.json()) for d in gl.list_detectors().results]
    except:
        return []
    
@app.post("/api/new-detector")
def make_new_detector(detector: Detector):
    config = fetch_config()
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None
    # TODO: use this as default gl
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    try:
        det = gl.create_detector(detector.name, detector.query)
        return det.id
    except:
        return "Failed"

@app.post("/api/config/detectors")
async def post_detectors(detectors: DetectorList):
    config = fetch_config()
    config["detectors"] = json.loads(detectors.json())["detectors"]
    endpoint = config["endpoint"] if "endpoint" in config else None
    api_key = config["api_key"] if "api_key" in config else None

    # stop all processes
    for p in app.DETECTOR_PROCESSES:
        p.terminate()
    
    # # start new processes
    print("Loading config...")
    try:
        start_processes(api_key, endpoint, config["detectors"])
    except:
        print("Failed to start processes")
        pass

    store_config(config)
    return config

class ApiKey(pydantic.BaseModel):
    api_key: str

@app.post("/api/config/api_key")
def post_api_key(key: ApiKey):
    set_in_config({"api_key": key.api_key})

@app.post("/api/refresh-camera")
def refresh_camera(config: dict):
    for g in app.ALL_GRABBERS:
        if g.config == config:
            return {"config": config, "image": get_base64_img(g)}
        
    return None

@app.get("/api/cameras")
def get_cameras():
    return [{"config": g.config, "image": get_base64_img(g)} for g in app.ALL_GRABBERS]

@app.post("/api/cameras/autodetect")
def autodetect_cameras():
    new_grabbers: List[FrameGrabber] = framegrab.FrameGrabber.autodiscover().values()
    app.ALL_GRABBERS.extend(new_grabbers)
    set_in_config({"image_sources": list(map(lambda g: g.config, app.ALL_GRABBERS))})

@app.post("/api/cameras/new")
def make_camera(config: dict):
    grabber = framegrab.FrameGrabber.create_grabber(config)
    app.ALL_GRABBERS.append(grabber)
    set_in_config({"image_sources": list(map(lambda g: g.config, app.ALL_GRABBERS))})

@app.post("/api/cameras/delete")
def make_camera(index: dict):
    index = index["idx"]
    config = fetch_config()
    config["image_sources"].pop(index)
    app.ALL_GRABBERS.pop(index)
    if "detectors" in config:
        for i in range(len(config["detectors"])):
            if config["detectors"][i]["config"]["imgsrc_idx"] == index:
                config["detectors"][i]["config"]["imgsrc_idx"] = -1
            elif config["detectors"][i]["config"]["imgsrc_idx"] > index:
                config["detectors"][i]["config"]["imgsrc_idx"] -= 1
        app.DETECTOR_CONFIG["detectors"] = config["detectors"]
    store_config(config)

@app.get("/api/finished_intro")
def intro_finished():
    set_in_config({"intro_sequence_finished": True})
    return "Ok"

# @app.on_event("startup")
async def test():
    while True:
        for i in range(len(app.DETECTOR_GRAB_NOTIFY_QUEUES)):
            if not app.DETECTOR_GRAB_NOTIFY_QUEUES[i].empty():
                print("Taking photo")
                app.DETECTOR_GRAB_NOTIFY_QUEUES[i].get_nowait()
                # d = app.DETECTOR_CONFIG["detectors"][i]
                d = list(filter(lambda d: d["config"]["enabled"], app.DETECTOR_CONFIG["detectors"]))[i]
                img = app.ALL_GRABBERS[d["config"]["imgsrc_idx"]].grab()
                app.DETECTOR_PHOTO_QUEUES[i].put(img)
        while not app.WEBSOCKET_RESPONSE_QUEUE.empty():
            res = app.WEBSOCKET_RESPONSE_QUEUE.get()
            det_id = res["det_id"]
            det_idx = res["det_idx"]
            img_idx = res["imgsrc_idx"]
            if len(app.DETECTOR_CONFIG["detectors"]) < det_idx \
                and app.DETECTOR_CONFIG["detectors"][det_idx]["id"] == det_id \
                and app.DETECTOR_CONFIG["detectors"][det_idx]["config"]["imgsrc_idx"] == img_idx:

                app.DETECTOR_WEBSOCKET_RESPONSE_QUEUES[det_idx].put_nowait(res)

        await asyncio.sleep(.01)

@app.on_event("startup")
async def app_startup():
    loop = asyncio.get_event_loop()
    loop.create_task(test())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("started")
    
    # asyncio.create_task(run_websocket(websocket))
    # asyncio.ensure_future(run_websocket(websocket))

# async def run_websocket(websocket: WebSocket):
    await websocket.accept()

    config = fetch_config()
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None

    data_task = asyncio.create_task(websocket.receive_json())
    try:
        while True:
            while not app.WEBSOCKET_METADATA_QUEUE.empty():
                metadata = app.WEBSOCKET_METADATA_QUEUE.get() # get metadata from queue (blocking, wait forever)
                await websocket.send_json(metadata)

            # check for cancel
            while not app.WEBSOCKET_CANCEL_QUEUE.empty():
                cancel_data = app.WEBSOCKET_CANCEL_QUEUE.get()
                await websocket.send_json(cancel_data)

            # check for response
            if data_task.done():
                data = data_task.result()
                data_copy = data.copy()
                data_copy["image"] = None
                print(data_copy)
                try:
                    push_label_result(api_key, endpoint, data["query_id"], data["label"])
                except Exception as e:
                    print("Exception while pushing label result:")
                    print(e)
                data_task = asyncio.create_task(websocket.receive_json())

            await asyncio.sleep(0.01)

    except Exception as e:
        print(e)
    finally:
        data_task.cancel()
        await websocket.close()
