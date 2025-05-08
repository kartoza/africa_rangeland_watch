import ee
import logging
import os
import pandas as pd
from django.core.management.base import BaseCommand
import json
from analysis.analysis import (
    initialize_engine_analysis,
    InputLayer,
    calculate_temporal,
    train_bgt,
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

    projects = {
        0: ["Greater Mapungubwe TFCA"],
        1: ["Ngamiland", "IKI"],
        2: ["Limpopo NP Project", "Bahine National Park"],
        3: ["Drakensberg Sub-Escarpment"],
        4: ["Soutpansberg"],
        5: ["K2C"],
        6: ["Umzimvubu Catchment Partnership Programme", "UCPP"],
        7: ["NGED", "Namakwa"],
        8: ['ReGen Agric']
    }

    def geometry_drakensberg(self):
        """Get the geometry for the Drakensberg Sub-Escarpment."""
        return ee.Geometry.Polygon(
            [
                [
                    [30.776846960049554, -27.785834593420404],
                    [30.776846960049554, -28.48337879171887],
                    [31.606314733487054, -28.48337879171887],
                    [31.606314733487054, -27.785834593420404]
                ]
            ]
        )

    def geometry_regen(self):
        """Get the geometry for the ReGen Agric."""
        return ee.Geometry.MultiPolygon(
            [
                [
                    [
                        [28.68534673367544, -30.458023749705003],
                        [28.68534673367544, -30.953937876315717],
                        [29.23466313992544, -30.953937876315717],
                        [29.23466313992544, -30.458023749705003]
                    ]
                ],
                [
                    [
                        [28.7890869564936, -32.05624939716554],
                        [28.7890869564936, -32.208593381736804],
                        [28.883844036571723, -32.208593381736804],
                        [28.883844036571723, -32.05624939716554]
                    ]
                ]
            ]
        )

    def generate_temporal_assets(self, year):
        """Generate temporal assets for the given year."""
        print(f"Generating temporal assets for year: {year}")
        input_layer = InputLayer()
        communities = input_layer.get_communities()
        # Define the start and end dates for the analysis
        start_date = f"{year}-01-01"
        end_date = f"{year + 1}-01-01"
        if year == 2015:
            # set start date of S2 Harmonized asset
            start_date = "2015-07-01"
        elif year == 2025:
            # set to current month
            end_date = "2025-05-01"
        failed_exports = []
        for idx, project in self.projects.items():
            print(f"Processing project: {idx} - {project}")
            community = communities.filter(
                ee.Filter.inList('Project', project)
            )
            geo = community.geometry().bounds()
            is_custom_geom = False
            classifier = None
            if "Drakensberg Sub-Escarpment" in project:
                classifier = train_bgt(
                    self.geometry_drakensberg(),
                    GEEAsset.fetch_asset_source('random_forest_training')
                )
            elif 'ReGen Agric' in project:
                classifier = train_bgt(
                    self.geometry_regen(),
                    GEEAsset.fetch_asset_source('random_forest_training')
                )
            else:
                classifier = train_bgt(
                    geo,
                    GEEAsset.fetch_asset_source('random_forest_training')
                )

            monthly_table = calculate_temporal(
                community, start_date, end_date,
                resolution='month',
                resolution_step=1,
                is_custom_geom=is_custom_geom,
                classifier=classifier,
            )

            # remove geometry
            monthly_table = monthly_table.map(
                lambda feature: feature.setGeometry(None)
            )

            # export to csv in drive
            filename = f"{idx}_temporal_monthly_{year}"
            status = export_table_to_drive(
                monthly_table, filename,
                'temporal_monthly'
            )
            if status['state'] != 'COMPLETED':
                print(f"Export failed for {filename}: {status}")
                failed_exports.append({
                    'project': project,
                    'filename': filename,
                    'status': status,
                    'year': year
                })

        if failed_exports:
            # dump to json
            filename = (
                f"failed_exports_{year}_"
                "{datetime.datetime.now().timestamp()}.json"
            )
            with open(filename, 'w') as f:
                json.dump(failed_exports, f, indent=4)
            print(f"Failed exports saved to {filename}")

    def download_csv_files(self, year):
        """Download CSV files for the given year."""
        folder_name = 'temporal_monthly'
        if not os.path.exists(folder_name):
            os.makedirs(folder_name)
        file_list = gdrive_file_list(folder_name)
        if file_list:
            for file in file_list:
                filename = file['title']
                if f'temporal_monthly_{year}' not in filename:
                    continue
                print(f"Downloading {filename}...")
                file.GetContentFile(os.path.join(folder_name, filename))
        else:
            print(f"No files found in folder: {folder_name}")

    def clear_csv_files(self):
        """Clear CSV files in the temporal_monthly folder."""
        folder_name = 'temporal_monthly'
        success = gdrive_delete_folder(folder_name)
        if success:
            print(f"Successfully deleted folder: {folder_name}")
        else:
            print(f"Failed to delete folder: {folder_name}")

    def merge_csv_files(self, year):
        """Merge CSV files for the given year."""
        folder_name = 'temporal_monthly'
        dataframes = []
        total_files = 0
        total_data = 0
        for filename in os.listdir(folder_name):
            if (
                f'temporal_monthly_{year}' in filename and
                filename.endswith('.csv')
            ):
                file_path = os.path.join(folder_name, filename)
                df = pd.read_csv(file_path)
                # remove system:index and .geo columns
                df = df.drop(
                    columns=['system:index', '.geo'],
                    errors='ignore'
                )
                dataframes.append(df)
                total_files += 1
                total_data += len(df)

        merged_file_path = os.path.join(folder_name, f'merged_{year}.csv')
        print(f"Merged CSV files into {merged_file_path}")
        merged_df = pd.concat(dataframes, ignore_index=True)
        merged_df.to_csv(merged_file_path, index=False)
        print(f"Successfully merged CSV files for year: {year}")
        print(f"Total files merged: {total_files}")
        print(f"Total data points merged: {total_data}")

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        initialize_engine_analysis()

        self.generate_temporal_assets(2024)

        # Download and merge CSV files for the year 2019
        # self.download_csv_files(2019)
        # self.merge_csv_files(2019)

        # next steps:
        # 1. upload to GEE from https://code.earthengine.google.com/
        # 2. Set public access to the asset
        # 3. update fixture 3.gee_asset.json
