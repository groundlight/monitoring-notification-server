import time
import groundlight
import multiprocessing

def run_process(detector: dict, api_key: str, endpoint: str, notify_queue: multiprocessing.Queue, photo_queue: multiprocessing.Queue):
    print("Starting process...")

    trigger_type = detector["config"]["trigger_type"]

    delay = lambda: time.sleep(30)

    if trigger_type == "motion":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    elif trigger_type == "time":
        delay = lambda: time.sleep(detector["config"]["cycle_time"])
    elif trigger_type == "pin":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    elif trigger_type == "http":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    else:
        raise ValueError(f"Invalid trigger type: {trigger_type}")
    
    # if "endpoint" in detector and detector.endpoint is not None:
    #     endpoint = detector.endpoint
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    det = gl.get_detector(detector["id"])

    print(f"Starting detector {detector['id']}...")

    while(True):
        notify_queue.put("fetch")
        frame = photo_queue.get(timeout=30)
        # if not frame:
        #     continue
        query = gl.submit_image_query(det, frame)
        delay()