import multiprocessing
import time
from fastapi import FastAPI
import json
import yaml
import groundlight
import pydantic
from api.gl_process import Detector as GLDetector
from api.gl_process import run_process
import framegrab
from framegrab import FrameGrabber
import cv2
import base64

class Config(pydantic.BaseModel):
    vid_src: int
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

def make_grabbers():
    grabbers = framegrab.FrameGrabber.autodiscover()
    cameras = []
    for k, v in grabbers.items():
        print(k, v)
        config = v.config
        if "input_type" in config and config["input_type"] == "webcam":
            v.config["idx"] = v.idx

        img = v.grab()
        v.release()
        _, jpg = cv2.imencode('.jpg', img)
        jpg_64 = base64.b64encode(jpg)
        
        cameras.append({"config": config, "image": jpg_64})
    
    return cameras
    # return [{"name": grabber_name, "grabber": grabber} for grabber_name, grabber in grabbers.items()]
    

app.ALL_GRABBERS = make_grabbers()

print("Loading config...")
try:
    with open("./api/gl_config.json", "r") as f:
        config = json.load(f)
    detectors = config["detectors"] if "detectors" in config else []
    api_key = config["api_key"] if "api_key" in config else None
    endpoint = config["endpoint"] if "endpoint" in config else None
    print(detectors)
    app.DETECTOR_PROCESSES = [multiprocessing.Process(target=run_process, args=(
        GLDetector(d["id"], d["config"]["vid_src"], d["config"]["trigger_type"], d["config"]["cycle_time"], d["config"]["pin"], d["config"]["pin_active_state"]),
        api_key,
        endpoint,
        app.ALL_GRABBERS,
    )) for d in detectors]
    for p in app.DETECTOR_PROCESSES:
        p.start()
except:
    print("Failed to load config")
    app.DETECTOR_PROCESSES = []
    with open("./api/gl_config.json", "w") as f:
        json.dump({}, f, indent=4)

###################### the api #######################

@app.get("/api/config")
def get_config():
    with open("./api/gl_config.json", "r") as f:
        return json.load(f)
    
@app.get("/api/config-json-pretty")
def get_config_json_pretty():
    with open("./api/gl_config.json", "r") as f:
        return json.dumps(json.load(f), indent=4)

@app.get("/api/config-yaml-pretty")
def get_config_json_pretty():
    with open("./api/gl_config.json", "r") as f:
        # return json.dumps(json.load(f), indent=4)
        return yaml.dump(json.load(f), indent=4)
    
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
    print(detectors)
    # app.DETECTOR_PROCESSES = [multiprocessing.Process(target=run_process, args=(
    #     GLDetector(d.id, d.config.vid_src, d.config.trigger_type, d.config.cycle_time, d.config.pin, d.config.pin_active_state),
    #     api_key,
    #     endpoint,
    #     app.ALL_GRABBERS,
    # )) for d in detectors.detectors]
    # for p in app.DETECTOR_PROCESSES:
    #     p.start()

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

# @app.get("/api/cameras")
@app.get("/api/refresh-cameras")
def refresh_cameras():
    for c in app.ALL_GRABBERS:
        c["vid"].release()
    app.ALL_GRABBERS = make_grabbers()
    return get_cameras()

@app.post("/api/refresh-camera")
def refresh_camera(config: dict):
    for c in app.ALL_GRABBERS:
        if c["config"] == config:
            try:
                v = framegrab.FrameGrabber.create_grabber(config)
            except:
                continue
            time.sleep(0.5)
            _, jpg = cv2.imencode('.jpg', v.grab())
            jpg_64 = base64.b64encode(jpg)
            c["image"] = jpg_64
            v.release()
            return c
    return None

@app.get("/api/cameras")
def get_cameras():
    return app.ALL_GRABBERS

@app.get("/api/cameras/name:{name}")
def get_camera(name: str):
    # for c in app.ALL_GRABBERS:
    #     if c["name"] == name:
    #         return {"name": c["name"], "image": c["image"]}
    return None

@app.get("/api/cameras/idx:{idx}")
def get_camera(idx: int):
    # for c in app.ALL_GRABBERS:
    #     if c["name"] == name:
    #         return {"name": c["name"], "image": c["image"]}
    return None