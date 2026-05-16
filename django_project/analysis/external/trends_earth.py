# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis Methods for Trends.Earth dataset.
"""

import ee

from analysis.models import GEEAsset


def te_spatial_analysis_dict(countries, start_date=None, end_date=None):
    """
    Create a dictionary for Trends.Earth spatial analysis.

    :param countries: ee.FeatureCollection of countries to clip to.
    :param start_date: Unused; kept for API consistency with other spatial dicts.
    :param end_date: Unused; kept for API consistency with other spatial dicts.
    :return: Dictionary mapping layer name to ee.Image.
    """
    ldn_image = ee.Image(
        GEEAsset.fetch_asset_source('trendsearth_ldn')
    ).select('sdg_indicator_15_3_1_status_in_2023_compared_to_2000_2015_baseline')
    ldn_image = ldn_image.updateMask(
        ldn_image.neq(-32768)
    ).clipToCollection(countries)

    return {
        'SDG Indicator 15.3.1 status in 2023 (compared to 2000-2015 baseline)': ldn_image
    }
