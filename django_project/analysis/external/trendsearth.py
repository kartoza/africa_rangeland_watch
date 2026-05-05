# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis Methods for Trends.Earth datasets.
"""

import datetime
import ee

from analysis.models import Indicator, GEEAsset, IndicatorSource


def _build_trendsearth_collection(variable):
    """
    Resolve indicator -> GEEAsset -> ee.ImageCollection.

    Returns (image_col, gee_asset, indicator) or raises ValueError.
    """
    indicator = Indicator.objects.filter(variable_name=variable).first()
    if not indicator:
        raise ValueError(
            f'Indicator with variable name {variable} not found.'
        )

    asset_keys = indicator.config.get('asset_keys', [])
    if not asset_keys:
        raise ValueError(
            f'No asset keys configured for indicator {indicator.name}.'
        )

    gee_asset = GEEAsset.objects.filter(key=asset_keys[0]).first()
    if not gee_asset:
        raise ValueError(
            f'GEEAsset with key {asset_keys[0]} not found.'
        )

    image_col = ee.ImageCollection(gee_asset.source)
    return image_col, gee_asset, indicator


def trendsearth_annual_temporal_analysis(
    variable, start_date, test_years, select_geo, analysis_cache
):
    """
    Perform annual temporal analysis for a Trends.Earth ImageCollection.

    Images in the collection are expected to carry a ``year`` property
    (set during GEE ingestion) and startTime/endTime spanning that year.

    GEE Image band names must be simple identifiers (no spaces, parentheses,
    or dots).  We therefore rename the first band to the short ``band_name``
    from GEEAsset.metadata['band_names'] for all GEE operations, then rename
    the resulting FeatureCollection property to the full ``variable_name``
    (FeatureCollection properties allow arbitrary strings).

    Returns the same two-tuple format used by GPW analysis:
        (to_plot.getInfo(), to_plot_ts.getInfo())
    """
    image_col, gee_asset, indicator = _build_trendsearth_collection(variable)

    # Safe band name for GEE Image.rename() — must be a plain identifier.
    band_names = gee_asset.metadata.get('band_names', [])
    band_name = band_names[0] if band_names else 'value'

    # Full variable name used as the output FeatureCollection property name.
    # FeatureCollection.select() allows arbitrary property names (incl. spaces).
    var_rename = indicator.variable_name

    reducer = indicator.get_reducer()
    reducer_name = indicator.get_reducer_name()  # e.g. 'mean'

    all_years = sorted(set([start_date.year] + list(test_years)))

    # Build one mosaicked Image per year.
    #
    # The ImageCollection may contain multiple Images for the same year
    # when different users/communities have each uploaded their own COG
    # (each at a unique asset path like y{year}_{loc_hash}).  Mosaicking
    # them first means reduceRegions runs once per year on the combined
    # coverage, so every selected community gets values regardless of
    # which upload originally covered it.
    def mosaic_for_year(year_num):
        year_num = ee.Number(year_num).int()
        date_millis = ee.Date.fromYMD(year_num, 1, 1).millis()
        mosaicked = (
            image_col
            .filter(ee.Filter.eq('year', year_num))
            .select([0])
            .mosaic()
            .rename([band_name])
        )
        return mosaicked.set(
            'year', year_num,
            'date', date_millis,
        )

    year_images = ee.ImageCollection.fromImages(
        ee.List([int(y) for y in all_years]).map(mosaic_for_year)
    )

    def process_image(img):
        year = ee.Number(img.get('year')).int()
        date_millis = ee.Number(img.get('date'))

        # img is already renamed to band_name via mosaic_for_year.
        # Reduce over AOI — produces a property named by the reducer
        # (e.g. 'mean').  Some features may have no pixel overlap and
        # therefore lack the reducer property entirely (not even null),
        # which causes Feature.select() with rename to fail.
        # Use map()+set() instead: copy reducer_name → band_name safely.
        reduced = img.reduceRegions(
            collection=select_geo,
            reducer=reducer,
            scale=250,
            tileScale=4
        )

        # Copy reducer property to band_name and attach temporal fields.
        # ft.get(reducer_name) returns null when the property is absent,
        # so set() never raises even for features with no pixel overlap.
        reduced = reduced.map(lambda ft: ft.set(
            band_name, ft.get(reducer_name),
            'year', year,
            'month', 1,
            'date', date_millis,
        ))

        # Drop features where the value is null (no pixel overlap).
        reduced = reduced.filter(ee.Filter.notNull([band_name]))
        return reduced

    # Flatten per-image reductions into one FeatureCollection
    merged_fc = year_images.map(process_image).flatten()
    merged_fc = merged_fc.sort('Name').sort('date')

    # Fetch all results in a single GEE call, then split in Python.
    # to_plot is just a date-filtered view of merged_fc — there is no reason
    # to call getInfo() twice and run the full mosaic+reduceRegions pipeline
    # twice (which would double EECU consumption).
    def _rename_prop(fc_info):
        """Rename band_name → var_rename in each feature's properties."""
        for feature in fc_info.get('features', []):
            props = feature.get('properties', {})
            if band_name in props:
                props[var_rename] = props.pop(band_name)
        return fc_info

    merged_info = _rename_prop(merged_fc.getInfo())

    # Filter to_plot from the Python result — no second GEE round-trip.
    # Milliseconds for Jan-1 of each year in UTC (matches ee.Date.fromYMD).
    epoch = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)
    all_date_millis = {
        int(
            (datetime.datetime(y, 1, 1, tzinfo=datetime.timezone.utc) - epoch)
            .total_seconds() * 1000
        )
        for y in all_years
    }
    to_plot_info = {
        'type': 'FeatureCollection',
        'features': [
            f for f in merged_info.get('features', [])
            if f.get('properties', {}).get('date') in all_date_millis
        ],
    }

    return analysis_cache.create_analysis_cache(
        (to_plot_info, merged_info)
    )


def trendsearth_spatial_analysis_dict(
    countries,
    start_date: datetime.date = None,
    end_date: datetime.date = None,
):
    """
    Build a {variable_name: ee.Image} dict for all active Trends.Earth
    indicators, suitable for use in ``get_spatial_layer_dict``.

    Each image is the mean over the requested date range, clipped to the
    country boundary collection.
    """
    if not start_date:
        start_date = datetime.date(2000, 1, 1)
    if not end_date:
        end_date = datetime.date.today()

    result = {}
    te_indicators = Indicator.objects.filter(
        source=IndicatorSource.TRENDS_EARTH,
        is_active=True
    )

    for indicator in te_indicators:
        asset_keys = indicator.config.get('asset_keys', [])
        if not asset_keys:
            continue
        gee_asset = GEEAsset.objects.filter(key=asset_keys[0]).first()
        if not gee_asset:
            continue

        try:
            col = (
                ee.ImageCollection(gee_asset.source)
                .filterDate(
                    start_date.isoformat(),
                    end_date.isoformat()
                )
                .filterBounds(countries)
            )
            # Select first band by index, compute mean, clip to countries
            img = col.select([0]).mean().clipToCollection(countries)
            result[indicator.variable_name] = img
        except Exception:
            # Non-fatal: skip this indicator if collection unavailable
            pass

    return result
