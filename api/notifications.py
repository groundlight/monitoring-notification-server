import smtplib, ssl
import cv2

from email import encoders
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

from twilio.rest import Client
from slack_sdk import WebClient

import requests
import os

def send_notifications(det_name: str, query: str, label: str, options: dict, image, logger):
    if "condition" not in options:
        # print("No condition provided")
        logger.error("No condition provided")
        return
    condition = options["condition"].upper() # "PASS", "FAIL"
    if label == "YES":
        label = "PASS"
    elif label == "NO":
        label = "FAIL"

    if "stacklight" in options:
        # print("Sending stacklight")
        logger.error("Sending stacklight")
        stacklight_options = options["stacklight"]
        post_to_stacklight(det_name, query, label, stacklight_options)

    if not ((condition == "PASS" and label == "PASS") or (condition == "FAIL" and label == "FAIL")):
        # print("Condition not met")
        logger.error("Condition not met")
        return
    
    if "email" in options:
        # print("Sending email")
        logger.error("Sending email")
        email_options = options["email"]
        send_email(det_name, query, image, label, email_options)
    if "twilio" in options:
        # print("Sending sms")
        logger.error("Sending sms")
        twilio_options = options["twilio"]
        send_sms(det_name, query, label, twilio_options)
    if "slack" in options:
        # print("Sending slack")
        logger.error("Sending slack")
        slack_options = options["slack"]
        send_slack(det_name, query, label, slack_options)

def send_email(det_name: str, query: str, image, label: str, options: dict):
    subject = f"Your detector [{det_name}] detected an anomaly"
    body = f"Your detector [{det_name}] returned a \"{label}\" result to the query [{query}].\n\nThe image of the anomaly is attached below."
    sender_email = options["from_email"]
    receiver_email = options["to_email"]
    app_password = options["email_password"]

    # Create a multipart message and set headers
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject

    # Add body to email
    message.attach(MIMEText(body, "plain"))

    filename = "image.jpg"  # In same directory as script

    _, im_buf_arr = cv2.imencode(".jpg", image)
    byte_im = im_buf_arr.tobytes()
    part = MIMEImage(byte_im)

    # Encode file in ASCII characters to send by email    
    encoders.encode_base64(part)

    # Add header as key/value pair to attachment part
    part.add_header(
        "Content-Disposition",
        f"attachment; filename= {filename}",
    )

    # Add attachment to message and convert message to string
    message.attach(part)
    text = message.as_string()

    # Log in to server using secure context and send email
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(sender_email, app_password)
        server.sendmail(sender_email, receiver_email, text)

def send_sms(det_name: str, query: str, label: str, options: dict):
    account_sid = options["account_sid"]
    auth_token = options["auth_token"]
    client = Client(account_sid, auth_token)

    message = client.messages \
                    .create(
                        body=f"Your detector [{det_name}] returned a \"{label}\" result to the query [{query}].",
                        from_=options["from_number"],
                        to=options["to_number"]
                    )
    
def send_slack(det_name: str, query: str, label: str, options: dict):
    client = WebClient(token=options["token"])
    response = client.chat_postMessage(
        channel=options["channel_id"],
        text=f"Your detector [{det_name}] returned a \"{label}\" result to the query [{query}]."
    )
    # assert response["message"]["text"] == f"Your detector [{det_name}] returned a \"{label}\" result."

def post_to_stacklight(det_name: str, query: str, label: str, options: dict):
    if "ip" not in options:
        return # TODO: Fix this (probably add usb stuff)

    if "ip" not in options:
        id = options["id"]
        ap_name = "GL_STACKLIGHT_" + id
        ap_password = "gl_stacklight_password_" + id
        if "ssid" not in options or "password" not in options:
            print("No ssid or password provided")
            return
        ssid = options["ssid"]
        password = options["password"]
        try:
            wifi_networks = os.popen("nmcli -t -f ssid dev wifi list").read()
            if ap_name not in wifi_networks:
                return
            os.popen(f"nmcli dev wifi connect {ap_name} password {ap_password}")

            # push ssid and password to stacklight
            res = requests.post(f"http://192.168.4.1:8080", json={"ssid": ssid, "password": password})
            if res.status_code != 200:
                print("Could not connect to stacklight")
                return
            res = requests.get(f"http://192.168.4.1:8080/ip")
            if res.status_code != 200:
                print("Could not connect to stacklight")
                return
            ip = res.text
        except:
            try:
                os.popen(f"nmcli dev wifi connect {options['ssid']} password {options['password']}")
            except:
                print("Could not connect to wifi network")
            return
        
    else:
        ip: str = options["ip"]

    port = "8080"

    # http post to stacklight
    requests.post(f"http://{ip}:{port}/display", data=label)