# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import requests
import ee
import datetime
from analysis.models import Landscape, GEEAsset
from analysis.analysis import (
    get_nrt_sentinel, train_bgt, classify_bgt,
    calculate_firefreq, get_soil_carbon,
    get_soil_carbon_change, get_grazing_capacity_layer
)


def upload_file(url, file_path, field_name="file", auth_header=None):
    """
    Upload a file to the given URL.

    :param url: The URL to send the POST request to.
    :param file_path: The path to the file to be uploaded.
    :param field_name: The form field name for the file (default: 'file').
    :return: The response from the server.
    """
    headers = None
    if auth_header:
        headers = {
            'Authorization': auth_header
        }
    # Open the file in binary mode
    with open(file_path, 'rb') as f:
        # Pass the file as a file-like object to the `files` parameter
        files = {field_name: (file_path, f)}

        # Send the POST request with the file
        response = requests.post(url, files=files, headers=headers)

    return response.status_code == 200


def get_nrt_image(input_layer):
    """
    Reconstruct the NRT image for export using a 30-day median composite.
    """
    # Get AOI from Landscape model
    landscape = Landscape.objects.get(id=input_layer.metadata["landscape_id"])
    aoi = ee.Geometry.Polygon(list(landscape.bbox.coords[0]))
    print(f"Landscape: {landscape}")
    print(f"AOI bounds: {aoi.bounds().getInfo()}")

    DEFAULT_MONTHS = 2
    NRT_START_DATE = '2022-06-01'
    today = datetime.date.today()
    end_date = today.isoformat()

    # Get the raw image
    img = get_nrt_sentinel(
        aoi, months=DEFAULT_MONTHS,
        start_date=NRT_START_DATE,
        end_date=end_date
    )

    # Select the appropriate band based on the input layer name
    name = input_layer.name.lower()
    if name == "evi":
        ee_image = img.select("evi")
    elif name == "ndvi":
        ee_image = img.select("ndvi")
    elif name in ["bare ground", "grass cover", "tree plant cover"]:
        classifier = train_bgt(
            aoi, GEEAsset.fetch_asset_source("random_forest_training")
        )
        prob_img = classify_bgt(img, classifier)
        if name == "bare ground":
            ee_image = prob_img.select("bare")
        elif name == "grass cover":
            ee_image = prob_img.select("grass")
        else:
            ee_image = prob_img.select("tree")
    elif name == "fire frequency":
        ee_image = calculate_firefreq(aoi, NRT_START_DATE, end_date)
    elif name == "soil carbon":
        ee_image = get_soil_carbon(
            start_date=datetime.date.fromisoformat(NRT_START_DATE),
            end_date=today,
            clip_to_countries=False,
            aoi=aoi
        )
    elif name == "soil carbon change":
        ee_image = get_soil_carbon_change(
            start_date=datetime.date.fromisoformat(NRT_START_DATE),
            end_date=today,
            clip_to_countries=False,
            aoi=aoi
        )
    elif name == "grazing capacity":
        ee_image = get_grazing_capacity_layer.clip(aoi)
    else:
        raise ValueError(f"Unsupported layer type: {input_layer.name}")

    return ee_image.clip(aoi), aoi.bounds()
