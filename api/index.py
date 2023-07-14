import multiprocessing
import time
from typing import List
from fastapi import FastAPI
import json
import yaml
import groundlight
import pydantic
# from api.gl_process import Detector as GLDetector
from api.gl_process import run_process
import framegrab
from framegrab import FrameGrabber
import cv2
import base64
import asyncio

class Config(pydantic.BaseModel):
    enabled: bool
    vid_config: dict
    image: str
    trigger_type: str
    cycle_time: int | None
    pin: int | None
    pin_active_state: int | None

class Detector(pydantic.BaseModel):
    name: str
    id: str
    query: str
    config: Config

class DetectorList(pydantic.BaseModel):
    detectors: list[Detector]

app = FastAPI()

app.DETECTOR_PROCESSES: List[multiprocessing.Process] = []
app.DETECTOR_PHOTO_QUEUES: List[multiprocessing.Queue] = []
app.DETECTOR_GRAB_NOTIFY_QUEUES: List[multiprocessing.Queue] = []
app.DETECTOR_CONFIG = {}

def start_processes(api_key, endpoint, detectors):
    app.DETECTOR_CONFIG = {
        "api_key": api_key,
        "endpoint": endpoint,
        "detectors": detectors,
    }
    detectors = list(filter(lambda d: d["config"]["enabled"], detectors))
    app.DETECTOR_PHOTO_QUEUES = [multiprocessing.Queue(1) for _ in detectors]
    app.DETECTOR_GRAB_NOTIFY_QUEUES = [multiprocessing.Queue(1) for _ in detectors]
    app.DETECTOR_PROCESSES = []
    for i in range(len(detectors)):
        process = multiprocessing.Process(target=run_process, args=(
            detectors[i],
            api_key,
            endpoint,
            app.DETECTOR_GRAB_NOTIFY_QUEUES[i],
            app.DETECTOR_PHOTO_QUEUES[i],
        ))
        app.DETECTOR_PROCESSES.append(process)
        process.start()

def make_grabbers():
    grabbers: List[framegrab.grabber.WebcamFrameGrabber | framegrab.grabber.BaslerUSBFrameGrabber | framegrab.grabber.RealSenseFrameGrabber | framegrab.grabber.RTSPFrameGrabber] = []
    if "detectors" not in app.DETECTOR_CONFIG:
        print("Failed to make grabbers")
        return grabbers
    for d in app.DETECTOR_CONFIG["detectors"]:
        already_created = False
        for g in grabbers:
            if g.config == d["config"]["vid_config"]:
                already_created = True
                break

        if already_created:
            break

        try:
            config = d["config"]["vid_config"]
            grabbers.append(framegrab.FrameGrabber.create_grabber(config))
        except:
            print(f"Failed to create framegrabber for {d['name']}")
    
    return grabbers

print("Loading config...")
try:
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
    detectors = config["detectors"] if "detectors" in config else []
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None
except:
    print("Failed to load config")
    app.DETECTOR_PROCESSES = []
    with open("./api/gl_config.json", "w") as f:
        json.dump({}, f, indent=4)

try:
    start_processes(api_key, endpoint, detectors)
except:
    print("Failed to start processes")

app.ALL_GRABBERS = make_grabbers()

###################### the api #######################

@app.get("/api/config")
def get_config():
    with open("./api/gl_config.json", "r") as f:
        return json.load(f)
    
@app.get("/api/config-json-pretty")
def get_config_json_pretty():
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
        if "detectors" in config:
            for d in config["detectors"]:
                del d["config"]["image"]
        return json.dumps(config, indent=4)

@app.get("/api/config-yaml-pretty")
def get_config_json_pretty():
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
        if "detectors" in config:
            for d in config["detectors"]:
                del d["config"]["image"]
        return yaml.dump(config, indent=4)
    
@app.get("/api/detectors")
def get_detectors():
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
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
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
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
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
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

    # save config
    with open("./api/gl_config.json", "w") as f:
        json.dump(config, f, indent=4)
    return config

class ApiKey(pydantic.BaseModel):
    api_key: str

@app.post("/api/config/api_key")
def post_api_key(key: ApiKey):
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
    config["api_key"] = key.api_key
    with open("./api/gl_config.json", "w") as f:
        json.dump(config, f, indent=4)
    return config

@app.post("/api/refresh-camera")
def refresh_camera(config: dict):
    for g in app.ALL_GRABBERS:
        if g.config == config:
            return {"config": config, "image": base64.b64encode(cv2.imencode(".jpg", g.grab())[1])}
        
    return None

@app.get("/api/cameras")
def get_cameras():
    return [{"config": g.config, "image": base64.b64encode(cv2.imencode(".jpg", g.grab())[1])} for g in app.ALL_GRABBERS]

async def test():
    while True:
        for i in range(len(app.DETECTOR_GRAB_NOTIFY_QUEUES)):
            if not app.DETECTOR_GRAB_NOTIFY_QUEUES[i].empty():
                print("Taking photo")
                app.DETECTOR_GRAB_NOTIFY_QUEUES[i].get_nowait()
                d = app.DETECTOR_CONFIG["detectors"][i]
                vid_config = d["config"]["vid_config"]
                for g in app.ALL_GRABBERS:
                    if g.config == vid_config:
                        app.DETECTOR_PHOTO_QUEUES[i].put(g.grab())
                        break
        await asyncio.sleep(1)

@app.on_event("startup")
async def app_startup():
    loop = asyncio.get_event_loop()
    loop.create_task(test())
