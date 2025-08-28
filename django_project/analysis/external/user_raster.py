# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis Methods for user raster.
"""

import datetime
import ee
from dateutil.relativedelta import relativedelta

from analysis.models import UserIndicator, UserGEEAsset, GEEAssetType
from analysis.utils import split_dates


def user_temporal_analysis(
    variable, user, start_date, test_dates, resolution,
    select_geo, analysis_cache
):
    """
    Perform annual temporal analysis for GPW dataset.

    :param variable: Variable to analyze.
    :param start_date: Start date for the analysis.
    :param test_dates: List of years to test.
    :param select_geo: Geographic selection criteria.
    :param analysis_cache: Cache for analysis results.
    :return: Analysis results.
    """
    from analysis.analysis import quarterly_medians

    indicator: UserIndicator = UserIndicator.objects.filter(
        variable_name=variable, created_by=user,
    ).first()
    if not indicator:
        raise ValueError(
            f'Indicator with variable name {variable} not found.'
        )

    asset_keys = indicator.config.get(
        'asset_keys', []
    )
    if not asset_keys:
        raise ValueError(
            f'No asset keys found for indicator {indicator.name}.'
        )
    # Use the first asset key
    asset_key = asset_keys[0]


    gee_asset: UserGEEAsset = UserGEEAsset.objects.filter(
        key=asset_key, created_by=user
    ).first()
    if not gee_asset:
        raise ValueError(
            f'GEEAsset with key {asset_key} not found.'
        )
    var_names = gee_asset.metadata.get(
        'band_names', [variable]
    )
    if not var_names:
        raise ValueError(
            f'No band names found for GEEAsset {gee_asset.key}.'
        )

    var_rename = indicator.name

    if gee_asset.type not in [
        GEEAssetType.IMAGE_COLLECTION,
        GEEAssetType.TABLE
    ]:
        raise ValueError(
            'Only ImageCollection and Table '
            'are supported in temporal analysis'
        )

    image_col = ee.ImageCollection(
        gee_asset.source
    )

    if resolution not in indicator.temporal_resolutions:
        raise ValueError(
            f"Indicator does not support {resolution} analysis."
        )

    if 'Temporal' not in indicator.ALLOWED_ANALYSIS_TYPES:
        raise ValueError(
            "Indicator does not support temporal analysis."
        )

    split_date_mode = 'year'
    if resolution.lower() == 'monthly':
        split_date_mode = 'month'
    elif resolution.lower() == 'quarterly':
        split_date_mode = 'quarter'

    end_date = max(test_dates)

    date_ranges = split_dates(
        start_date,
        end_date,
        split_date_mode,
        last_date_of_month=True
    )

    # only select applicable date ranges
    dates = []
    for date_start, date_end in date_ranges:
        for td in sorted(test_dates):
            if td >= date_start and td <= date_end:
                dates.append(date_start)

    var_name = var_names[0]
    var_rename = indicator.variable_name
    image_col = ee.ImageCollection(
        gee_asset.source
    )

    # Get the first image in the collection
    first_img = image_col.first()

    # Get the band names as a Python list
    band_names = first_img.bandNames().getInfo()

    # Band you want to check
    target_band = var_name

    if target_band not in band_names:
        raise ValueError(f"Band {target_band} does NOT exist.")

    # Map function to create a 'date' property
    def add_date(ft):
        year = ee.String(ft.get('year'))
        month = ee.Number(ft.get('month')).format('%02d')  # ensures 2 digits
        date = ee.Date.parse('yyyy-MM-dd', year.cat('-').cat(month).cat('-01'))
        return ft.set('date', date.millis())

    # 1. Aggregate images first (monthly/quarterly)
    split_date_unit = 'year'
    if resolution.lower() == 'monthly':
        split_date_unit = 'month'
    elif resolution.lower() == 'quarterly':
        split_date_unit = 'month'

    split_step = 1
    if resolution.lower() == 'quarterly':
        split_step = 3

    agg_images = quarterly_medians(
        collection=image_col,
        date_start=start_date.strftime("%Y-%m-%d"),
        unit=split_date_unit,
        step=split_step,
        reducer=indicator.get_reducer(),
        date_end=(end_date + relativedelta(months=1)).strftime("%Y-%m-%d")
    )
    var_name = f"{var_name}_{indicator.get_reducer_name()}"

    # 2. Reduce each aggregated image over the selected geometry
    def process_agg_image(img):
        year = img.get('year')
        month = img.get('month')

        reduced = img.select(var_name).reduceRegions(
            collection=select_geo,
            reducer=indicator.get_reducer(),
            scale=120,
            tileScale=4
        )

        # Rename reducer output to match band name
        reduced = reduced.select(
            ['Name', indicator.get_reducer_name()],
            ['Name', var_name]
        )

        # Filter out features with null values and add time attributes
        reduced = reduced.filter(ee.Filter.notNull([var_name])).map(
            lambda ft: ft.set('year', year, 'month', month)
        )

        return reduced

    # 3. Combine results from all aggregated images
    collections = agg_images.map(process_agg_image).flatten()

    # 4. Drop geometry (if not needed)
    collections = collections.map(lambda feature: feature.setGeometry(None))

    # 5. Final property rename and add date property
    collections = collections.select(
        ['Name', var_name, 'year', 'month'],
        ['Name', var_rename, 'year', 'month']
    )
    collections = collections.map(add_date)

    # 6. Sort and filter for plotting
    to_plot_ts = collections.sort('Name').sort('date')

    date_list_ee = ee.List(
        [start_date.isoformat()] + [dt.isoformat() for dt in dates]
    ).map(lambda d: ee.Date(d).millis())

    to_plot = to_plot_ts.filter(ee.Filter.inList('date', date_list_ee))

    return analysis_cache.create_analysis_cache(
        (
            to_plot.getInfo(),
            to_plot_ts.getInfo()
        )
    )


def user_spatial_analysis_dict(
    countries, user,
    start_date: datetime.date = None, end_date: datetime.date = None
):
    """
    Create a dictionary for User spatial analysis.

    :param start_date: Start date for the analysis.
    :param end_date: End date for the analysis.
    :return: Dictionary with analysis parameters.
    """
    if not start_date:
        start_date = datetime.date(2000, 1, 1)
    if not end_date:
        end_date = datetime.date.today()

    # TODO: should it be image collection only, or image as well?
    indicator_asset_dicts = UserIndicator.map_user_indicator_to_gee_object(
        user=user,
        asset_types=[GEEAssetType.IMAGE_COLLECTION]
    )
    variable_asset_dict = {}
    for indicator, user_gee_asset in indicator_asset_dicts.items():
        gee_asset_obj = user_gee_asset.filterDate(
            start_date.isoformat(), end_date.isoformat()
        ).filterBounds(countries)

        gee_asset_obj = gee_asset_obj.reduce(indicator.get_reducer())
        variable_asset_dict[indicator.variable_name] = gee_asset_obj

    return variable_asset_dict
