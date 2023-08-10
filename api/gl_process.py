import asyncio
import base64
import time
from uuid import uuid4
import cv2
import groundlight
import multiprocessing
from api.notifications import send_notifications
import logging

def frame_to_base64(frame) -> str:
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

def run_process(idx: int, logger, detector: dict, api_key: str, endpoint: str,
                notify_queue: multiprocessing.Queue,
                photo_queue: multiprocessing.Queue,
                websocket_metadata_queue: multiprocessing.Queue,
                websocket_cancel_queue: multiprocessing.Queue,
                websocket_response_queue: multiprocessing.Queue):

    trigger_type = detector["config"]["trigger_type"]

    poll_delay = 0.5
    delay = lambda: time.sleep(poll_delay)
    cycle_time = 30

    if trigger_type == "motion":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    elif trigger_type == "time":
        if detector["config"]["cycle_time"] < poll_delay:
            poll_delay = detector["config"]["cycle_time"]
        cycle_time = detector["config"]["cycle_time"]
    elif trigger_type == "pin":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    elif trigger_type == "http":
        # TODO: implement
        raise ValueError(f"Trigger type [{trigger_type}] not yet supported.")
    else:
        raise ValueError(f"Invalid trigger type: {trigger_type}")
    
    gl = groundlight.Groundlight(api_token=api_key, endpoint=endpoint)
    det = gl.get_detector(detector["id"])
    conf = det.confidence_threshold if det.confidence_threshold is not None else 0.9

    retry_time = time.time() + cycle_time
    should_continue = lambda: time.time() < retry_time

    logger.error(f"Starting detector {detector['id']}...")

    while(True):
        if not notify_queue.full() and not photo_queue.full():
            notify_queue.put_nowait("fetch")
        try:
            frame = photo_queue.get(timeout=30)
        except:
            print("No frame received from queue.")
            continue
        uuid = uuid4().hex

        # send to groundlight
        query = gl.submit_image_query(det, frame, 0) # default wait is 30s

        has_cancelled = False

        # send to local review
        if not websocket_metadata_queue.full():
            websocket_metadata_queue.put_nowait({
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
            if not has_cancelled and (
                (query.result.confidence is not None and query.result.confidence > conf)
                or (query.result.confidence is None and query.result.label is not None and query.result.label != "QUERY_FAIL" )):
                if not websocket_cancel_queue.full():
                    websocket_cancel_queue.put_nowait({
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
                if "notifications" in detector["config"]:
                    try:
                        logger.error(f"Sending notifications for detector {detector['id']}...")
                        # logger.error(detector["config"]["notifications"])
                        send_notifications(detector["name"], detector["query"], query.result.label, detector["config"]["notifications"], frame, logger)
                    except Exception as e:
                        print(f"Error sending notifications: {e}")
            delay()
        
        retry_time = time.time() + cycle_time
        
        if not has_cancelled and not websocket_cancel_queue.full():
            # Cancel previous query if it hasn't been cancelled yet
            websocket_cancel_queue.put_nowait({
                "cancel": True,
                "confidence": query.result.confidence,
                "uuid": uuid,
                "det_id": detector["id"],
                "det_name": detector["name"],
                "det_query": detector["query"],
                "det_idx": idx,
                "imgsrc_idx": detector["config"]["imgsrc_idx"],
            })
