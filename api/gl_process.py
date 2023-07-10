from dataclasses import dataclass
from typing import List, Optional, Self
import cv2
from enum import Enum
import time
import groundlight
import framegrab

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


class Detector(Trigger):
    id: str
    vid_src: int
    trigger: Trigger
    def __init__(self, id: str, vid_src: int, trigger_type: str, cycle_time: Optional[int] = 30, pin: Optional[int] = 0, pin_active_state: Optional[int] = 0) -> Self:
        self.id = id
        self.vid_src = vid_src
        if trigger_type == "motion":
            self.trigger = MotionTrigger()
        elif trigger_type == "time":
            self.trigger = TimeTrigger(cycle_time)
        elif trigger_type == "pin":
            self.trigger = PinTrigger(pin)

def get_image_sources() -> List[int]:
    index = 0
    arr = []
    while True:
        cap = cv2.VideoCapture(index)
        if not cap.read()[0]:
            break
        else:
            arr.append(index)
        cap.release()
        index += 1
    return arr

def run_process(detector: Detector, api_key: str, endpoint: str):
    # TODO: figure out if opencv uses a buffer, and how to mess with it
    print("Starting process...")

    trigger = detector.trigger
    vid_src = detector.vid_src
    # vid = cv2.VideoCapture(vid_src)
    vid = framegrab.FrameGrabber.create_grabber(stream=vid_src)

    trigger_type = trigger._type

    delay = lambda: time.sleep(30)

    if trigger_type == TriggerType.MOTION:
        return # TODO: implement
    elif trigger_type == TriggerType.TIME:
        delay = lambda: time.sleep(trigger.cycle_time)
    elif trigger_type == TriggerType.PIN:
        return # TODO: implement
    else:
        raise ValueError(f"Invalid trigger type: {trigger_type}")
    
    # if "endpoint" in detector and detector.endpoint is not None:
    #     endpoint = detector.endpoint
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    det = gl.get_detector(detector.id)

    print(f"Starting detector {detector.id}...")

    while(True):
        # ret, frame = vid.read()
        frame = vid.grab()
        # cv2.imshow('frame', frame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break
        query = gl.submit_image_query(det, frame)
        delay()

    vid.release()
    cv2.destroyAllWindows()