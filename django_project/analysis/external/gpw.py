# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis Methods for Global Pasteur Watch (GPW) dataset.
"""

import ee
import datetime
from dateutil.relativedelta import relativedelta
from functools import reduce

from analysis.models import Indicator, GEEAsset
from analysis.utils import split_dates_by_year


def _build_gpw_annual_images(variable, start_date, test_years):
    """
    Build annual aggregated ImageCollections for GPW dataset.

    Returns:
        (agg_images, var_name, indicator, dates)
    """
    indicator = Indicator.objects.filter(variable_name=variable).first()
    if not indicator:
        raise ValueError(f'Indicator with variable name {variable} not found.')

    asset_keys = indicator.config.get('asset_keys', [])
    if not asset_keys:
        raise ValueError(
            f'No asset keys found for indicator {indicator.name}.'
        )
    asset_key = asset_keys[0]

    dates = [datetime.date(ty, 1, 1) for ty in test_years]
    end_date = max(dates)

    date_ranges = split_dates_by_year(start_date, end_date)

    gee_asset = GEEAsset.objects.filter(key=asset_key).first()
    if not gee_asset:
        raise ValueError(f'GEEAsset with key {asset_key} not found.')

    var_names = gee_asset.metadata.get('band_names', [variable])
    if not var_names:
        raise ValueError(f'No band names found for GEEAsset {gee_asset.key}.')
    var_name = var_names[0]

    image_col = ee.ImageCollection(gee_asset.source)

    return image_col, var_name, indicator, date_ranges, dates


def gpw_annual_temporal_analysis(
    variable, start_date, test_years, select_geo, analysis_cache
):
    """
    Perform annual temporal analysis for GPW dataset.
    Returns time series results (FeatureCollection -> dicts).
    """
    (
        image_col,
        var_name,
        indicator,
        date_ranges,
        dates
    ) = _build_gpw_annual_images(
        variable, start_date, test_years
    )
    var_rename = indicator.name

    # Map function to create a 'date' property
    def add_date(ft):
        date = ee.Date.parse(
            'yyyy-MM-dd',
            ee.String(ft.get('year')).cat(ee.String('-01-01'))
        )
        return ft.set('date', date.millis())

    collections = []
    for year_start, year_end in date_ranges:
        test_dt = (year_end + relativedelta(months=1)).isoformat()

        annual_table = image_col.filterDate(year_start.isoformat(), test_dt)

        def process_image(i):
            img = i.select(var_name)
            reduced = img.reduceRegions(
                collection=select_geo,
                reducer=indicator.get_reducer(),
                scale=120,
                tileScale=4
            )
            reduced = reduced.select(
                ['Name', indicator.get_reducer_name()],
                ['Name', var_name]
            )
            reduced = reduced.filter(ee.Filter.notNull([var_name])).map(
                lambda ft: ft.set('year', year_start.year, 'month', 1)
            )
            return reduced

        annual_table = annual_table.map(process_image).flatten()
        annual_table = annual_table.map(
            lambda feature: feature.setGeometry(None)
        )
        annual_table = annual_table.select(
            ['Name', var_name, 'year', 'month'],
            ['Name', var_rename, 'year', 'month']
        )
        annual_table = annual_table.map(add_date)
        collections.append(annual_table)

    # Merge all years into one
    merged_fc = reduce(lambda x, y: x.merge(y), collections)
    to_plot_ts = merged_fc.sort('Name').sort('date')

    date_list_ee = ee.List(
        [start_date.isoformat()] + [dt.isoformat() for dt in dates]
    ).map(lambda d: ee.Date(d).millis())
    to_plot = to_plot_ts.filter(ee.Filter.inList('date', date_list_ee))

    return analysis_cache.create_analysis_cache(
        (to_plot.getInfo(), to_plot_ts.getInfo())
    )


def gpw_spatial_analysis_dict(
    countries,
    start_date: datetime.date = None, end_date: datetime.date = None
):
    """
    Create a dictionary for GPW spatial analysis.

    :param start_date: Start date for the analysis.
    :param end_date: End date for the analysis.
    :return: Dictionary with analysis parameters.
    """
    if not start_date:
        start_date = datetime.date(2000, 1, 1)
    if not end_date:
        end_date = datetime.date.today()

    # Probabilities of Cultivated Grassland
    prob_cultivated_grassland = ee.ImageCollection(
        GEEAsset.fetch_asset_source('prob_cultivated_grassland')
    ).filterDate(
        start_date.isoformat(), end_date.isoformat()
    ).select('probability').filterBounds(countries)
    prob_cultivated_grassland = prob_cultivated_grassland.mean()

    prob_natural_semi_grassland = ee.ImageCollection(
        GEEAsset.fetch_asset_source('prob_natural_semi_grassland')
    ).filterDate(
        start_date.isoformat(), end_date.isoformat()
    ).select('probability').filterBounds(countries)
    prob_natural_semi_grassland = prob_natural_semi_grassland.mean()

    return {
        'Probabilities of Cultivated Grasslands': prob_cultivated_grassland,
        'Probabilities of Natural/Semi-Natural Grasslands': (
            prob_natural_semi_grassland
        )
    }
