from dataclasses import dataclass
from typing import List, Optional, Self
from enum import Enum
import time
import groundlight
import framegrab
import pydantic
import multiprocessing
# from api.index import Detector as PYDetector

class TriggerType(Enum):
    MOTION = 1
    TIME = 2
    PIN = 3

class Trigger():
    _type: TriggerType

class MotionTrigger(Trigger):
    _type = TriggerType.MOTION

@dataclass
class TimeTrigger(Trigger):
    cycle_time: int
    _type = TriggerType.TIME

@dataclass
class PinTrigger(Trigger):
    pin: int
    _type = TriggerType.PIN


# class Detector(Trigger):
#     id: str
#     vid_src: int
#     trigger: Trigger
#     def __init__(self, id: str, vid_src: int, trigger_type: str, cycle_time: Optional[int] = 30, pin: Optional[int] = 0, pin_active_state: Optional[int] = 0) -> Self:
#         self.id = id
#         self.vid_src = vid_src
#         if trigger_type == "motion":
#             self.trigger = MotionTrigger()
#         elif trigger_type == "time":
#             self.trigger = TimeTrigger(cycle_time)
#         elif trigger_type == "pin":
#             self.trigger = PinTrigger(pin)

class Config(pydantic.BaseModel):
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

# def run_process(detector: Detector, api_key: str, endpoint: str):
# def run_process(detector: dict, api_key: str, endpoint: str):
def run_process(detector: dict, api_key: str, endpoint: str, notify_queue: multiprocessing.Queue, photo_queue: multiprocessing.Queue):
    print("Starting process...")

    # trigger = detector.trigger
    # trigger = detector.config.trigger_type
    # vid_src = detector.vid_src
    # grabbers = framegrab.FrameGrabber.autodiscover()
    # keys  = list(grabbers.keys())
    # vid = grabbers[keys[vid_src]]
    # for k, v in grabbers.items():
    #     config = v.config
    #     if "input_type" in config and config["input_type"] == "webcam":
    #         v.config["idx"] = v.idx

    # print(detector)
    # print(detector.keys())
    # print(detector["config"].keys())
    
    # vid = framegrab.FrameGrabber.create_grabber(detector["config"]["vid_config"])

    # for v in grabbers.values():
    #     v.release()
    # vid = grabbers[vid_src]["grabber"]
    # vid = framegrab.grabber.FrameGrabber.create_grabber(config)

    # trigger_type = trigger._type
    trigger_type = detector["config"]["trigger_type"]

    delay = lambda: time.sleep(30)

    if trigger_type == TriggerType.MOTION:
        return # TODO: implement
    elif trigger_type == TriggerType.TIME or trigger_type == "time":
        # delay = lambda: time.sleep(trigger.cycle_time)
        delay = lambda: time.sleep(detector["config"]["cycle_time"])
    elif trigger_type == TriggerType.PIN:
        return # TODO: implement
    else:
        raise ValueError(f"Invalid trigger type: {trigger_type}")
    
    # if "endpoint" in detector and detector.endpoint is not None:
    #     endpoint = detector.endpoint
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    det = gl.get_detector(detector["id"])

    print(f"Starting detector {detector['id']}...")

    # exit()

    while(True):
        # frame = vid.grab()
        notify_queue.put("fetch")
        frame = photo_queue.get(timeout=30)
        # if not frame:
        #     continue
        query = gl.submit_image_query(det, frame)
        delay()