import ee
import logging
import os
import math
import pandas as pd
from django.core.management.base import BaseCommand
import json
from analysis.analysis import (
    initialize_engine_analysis,
    InputLayer,
    calculate_temporal,
    train_bgt,
    export_classifier_to_asset,
    calculate_grazing_capacity,
    export_table_to_asset,
    export_image_to_asset,
    get_grazing_capacity_training_bands,
    export_table_to_drive
)
from analysis.models import GEEAsset
from analysis.utils import (
    gdrive_file_list,
    gdrive_delete_folder
)


class Command(BaseCommand):
    """Command to pre-export monthly temporal data for Communities Area."""
    help = 'Pre-Export monthly temporal data for Communities Area.'

    def generate_grazing_capacity(self, feature_collection, chunk_id):
        training_data = calculate_grazing_capacity(
            feature_collection
        )

        status = export_table_to_drive(
            training_data, f'Grazing_Capacity_Training_Data_{chunk_id}', 'Grazing_Capacity'
        )

        if status['state'] != 'COMPLETED':
            print(f"Export failed for {chunk_id}: {status}")
            raise Exception(f"Export failed for {chunk_id}: {status}")
        else:
            print(f"Export completed for {chunk_id}: {status}")
        
        # classifier = calculate_grazing_capacity(
        #     aoi, start_date, end_date
        # )
        # asset_id = 'projects/ee-dng/assets/arw/grazing_capacity_2015_2017'
        # description = 'Grazing_Capacity_Export'
        # status = export_classifier_to_asset(
        #     classifier, description, asset_id
        # )
        # if status['state'] != 'COMPLETED':
        #     print(f"Export failed for {asset_id}: {status}")
    
    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        initialize_engine_analysis()
        # self.generate_grazing_capacity()

        aoi = None
        start_date = '2015-01-01'
        end_date = '2017-01-01'

        # training_bands = get_grazing_capacity_training_bands(start_date, end_date)

        table = ee.FeatureCollection(
            GEEAsset.fetch_asset_source('grazing_capacity_ref')
        )

        # get feature count
        feature_count = table.size().getInfo()
        print("Feature Count:", feature_count)
        # Parameters
        chunk_size = 50  # Number of features per chunk
        num_chunks = math.ceil(feature_count / chunk_size)
        print("Number of chunks:", num_chunks)

        # Loop over each chunk
        for i in range(num_chunks):
            start = i * chunk_size
            end = min(start + chunk_size, feature_count)

            # Slice the FeatureCollection
            chunk = table.toList(chunk_size, start)
            chunk_fc = ee.FeatureCollection(chunk)

            print(f"Processing chunk {i + 1}/{num_chunks} with {chunk.size().getInfo()} features.")
            self.generate_grazing_capacity(chunk_fc, i)
