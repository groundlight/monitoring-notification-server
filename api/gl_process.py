import asyncio
import base64
import time
from uuid import uuid4
import cv2
import groundlight
import multiprocessing

def frame_to_base64(frame) -> str:
    # return str(base64.b64encode(cv2.imencode(".jpg", frame)[1]))
    #  encode image as jpeg
    _, buffer = cv2.imencode('.jpg', frame)
    #  encode the image as base64
    jpg = base64.b64encode(buffer)
    #  convert the image to a string
    jpg_as_text = jpg.decode('utf-8')
    return jpg_as_text

def push_label_result(api_key: str, endpoint: str, query_id: str, label: str):
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    # gl.add_label(query_id, label)
    label = label.upper()
    if label == "YES" or label == "NO":
        gl.add_label(query_id, label)
    elif label == "PASS":
        gl.add_label(query_id, "YES")
    elif label == "FAIL":
        gl.add_label(query_id, "NO")
    else:
        print(f"Invalid response: {label}")

def run_process(idx: int, detector: dict, api_key: str, endpoint: str,
                notify_queue: multiprocessing.Queue,
                photo_queue: multiprocessing.Queue,
                # websocket_img_queue: multiprocessing.Queue,
                websocket_metadata_queue: multiprocessing.Queue,
                websocket_cancel_queue: multiprocessing.Queue,
                websocket_response_queue: multiprocessing.Queue):
    print("Starting process...")

    trigger_type = detector["config"]["trigger_type"]

    # delay = lambda: time.sleep(30)
    poll_delay = 0.5
    delay = lambda: time.sleep(poll_delay)
    cycle_time = 30
    retry_time = time.time() + cycle_time
    should_continue = lambda: time.time() < retry_time

    if trigger_type == "motion":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    elif trigger_type == "time":
        if detector["config"]["cycle_time"] < poll_delay:
            poll_delay = detector["config"]["cycle_time"]
        cycle_time = detector["config"]["cycle_time"]
        # delay = lambda: time.sleep(detector["config"]["cycle_time"])
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
    conf = det.confidence_threshold if det.confidence_threshold is not None else 0.9

    print(f"Starting detector {detector['id']}...")

    while(True):
        notify_queue.put("fetch")
        try:
            frame = photo_queue.get(timeout=30)
        except:
            print("No frame received from queue.")
            continue
        uuid = uuid4().hex

        # websocket_metadata_queue.put(detector)

        # send to groundlight
        query = gl.submit_image_query(det, frame, 0) # default wait is 30s

        has_cancelled = False

        # send to local review
        websocket_metadata_queue.put({
            "uuid": uuid,
            "det_id": detector["id"],
            "det_name": detector["name"],
            "det_query": detector["query"],
            "query_id": query.id,
            "det_idx": idx,
            "imgsrc_idx": detector["config"]["imgsrc_idx"],
            "image": frame_to_base64(frame),
        })
        
        # poll for result until timeout
        while should_continue():
            query = gl.get_image_query(query.id)
            if (query.result.confidence is not None and query.result.confidence > conf and not has_cancelled) or (query.result.confidence is None and query.result.label is not None and query.result.label != "QUERY_FAIL" and not has_cancelled):
                websocket_cancel_queue.put({
                    "cancel": True,
                    "confidence": query.result.confidence,
                    "uuid": uuid,
                    "det_id": detector["id"],
                    "det_name": detector["name"],
                    "det_query": detector["query"],
                    "det_idx": idx,
                    "imgsrc_idx": detector["config"]["imgsrc_idx"],
                    "label": query.result.label,
                })
                has_cancelled = True
            delay()
        
        retry_time = time.time() + cycle_time

        # wait for next cycle
        # delay()
        # if not websocket_response_queue.empty():
        #     res = websocket_response_queue.get()
        #     label: str = res["label"].upper()
        #     res_uuid: str = res["uuid"]
        #     if res_uuid == uuid:
        #         if label == "YES" or label == "NO":
        #             gl.add_label(query, label)
        #         elif label == "PASS":
        #             gl.add_label(query, "YES")
        #         elif label == "FAIL":
        #             gl.add_label(query, "NO")
        #         else:
        #             print(f"Invalid response: {label}")
        #     else:
        #         print(f"UUID mismatch: {res_uuid} != {uuid}")

        # query = gl.get_image_query(query.id)d
        if not has_cancelled:
            websocket_cancel_queue.put({
                "cancel": True,
                "confidence": query.result.confidence,
                "uuid": uuid,
                "det_id": detector["id"],
                "det_name": detector["name"],
                "det_query": detector["query"],
                "det_idx": idx,
                "imgsrc_idx": detector["config"]["imgsrc_idx"],
                # "label": query.result.label,
            })
