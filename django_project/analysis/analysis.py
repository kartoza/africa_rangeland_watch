import typing
import datetime
import time
import base64
from dateutil.parser import parse
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import User

import ee
import os
from functools import reduce, partial

from analysis.models import (
    AnalysisTask,
    AnalysisResultsCache,
    GEEAsset,
    Indicator,
    UserIndicator,
    IndicatorSource,
    UserGEEAsset,
    GEEAssetType
)
from analysis.utils import split_dates_by_year, convert_temporal_to_dates
from analysis.external.gpw import (
    gpw_annual_temporal_analysis,
    gpw_spatial_analysis_dict
)
from analysis.external.user_raster import (
    user_temporal_analysis,
    user_spatial_analysis_dict
)

SERVICE_ACCOUNT_KEY = os.environ.get('SERVICE_ACCOUNT_KEY', '')
SERVICE_ACCOUNT = os.environ.get('SERVICE_ACCOUNT', '')

# Sentinel-2 bands and names
S2_BANDS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12']
S2_NAMES = [
    'cb', 'blue', 'green', 'red', 'R1', 'R2', 'R3', 'nir', 'swir1', 'swir2']

DEFAULT_SCENE_CLOUD_THRESHOLD = 20
DEFAULT_CLOUD_MASK_PROBABILITY = 30

# Bands to select after processing
select_bands = [
    'blue', 'green', 'red', 'R2', 'nir', 'swir1', 'ndvi', 'nbr', 'evi']

# Dictionary converting quarter strings to start months
quarter_dict = {
    1: 1,
    2: 4,
    3: 7,
    4: 10
}


class InputLayer:
    """
    Class to prepare all input layer necessary for analysis.
    """

    DEFAULT_COUNTRY_NAMES = [
        'SOUTH AFRICA', 'LESOTHO', 'SWAZILAND',
        'NAMIBIA', 'ZIMBABWE', 'BOTSWANA',
        'MOZAMBIQUE', 'ZAMBIA'
    ]

    def __init__(self):
        self.countries = self.get_countries()

    # Get pre-exported baseline statistics for project areas
    def get_baseline_table(self):
        """
        Get baseline feature collection for GEE analysis
        """
        baseline_table = ee.FeatureCollection(
            GEEAsset.fetch_asset_source('baseline_table')
        )
        return baseline_table

    def get_temporal_table(self):
        """
        Get temporal table for GEE analysis
        """
        # Get the pre-exported time series statistics for project areas
        temporal_table = ee.FeatureCollection(
            GEEAsset.fetch_asset_source('temporal_table')
        )

        # Format the table correctly
        temporal_table = temporal_table.select(
            ['Name', 'ndvi', 'evi', 'bare', 'year', 'month'],
            ['Name', 'NDVI', 'EVI', 'Bare ground', 'year', 'month']
        )

        # Map function to create a 'date' property
        def add_date(ft):
            date = ee.Date.parse('yyyy-MM-dd', ee.String(ft.get('year'))
                                 .cat(ee.String('-01-01'))).advance(
                ee.Number(ft.get('month')), 'months')
            return ft.set('date', date.millis())

        temporal_table = temporal_table.map(add_date)

        # Get annual aggregates
        temporal_table_yr = temporal_table.reduceColumns(
            selectors=['NDVI', 'EVI', 'Bare ground', 'Name', 'year'],
            reducer=ee.Reducer.mean().repeat(3).group(
                groupField=3,
                groupName='Name',
            ).group(
                groupField=4,
                groupName='year',
            )
        )

        def map_group(g):
            def map_sub_group(i):
                means = ee.List(ee.Dictionary(i).get('mean'))
                name = ee.Dictionary(i).get('Name')

                return ee.Feature(
                    None,
                    {
                        "Name": name,
                        "year": year,
                        "NDVI": means.get(0),
                        "EVI": means.get(1),
                        "Bare ground": means.get(2)
                    }
                )

            sub_group = ee.List(ee.Dictionary(g).get('groups'))
            year = ee.List(ee.Dictionary(g).get('year'))
            sub_group = sub_group.map(map_sub_group)
            return sub_group

        temporal_table_yr = ee.List(
            temporal_table_yr.get('groups')
        ).map(map_group).flatten()
        # Convert the list to a FeatureCollection
        # Map over the list to create an ee.FeatureCollection
        temporal_table_yr = ee.FeatureCollection(temporal_table_yr)

        # Add date property and sort
        def add_date_property(ft):
            date = ee.Date.parse(
                'yyyy-MM-dd',
                ee.String(ft.get('year')).cat(ee.String('-01-01'))
            )
            return ft.set('date', date.millis())

        temporal_table_yr = temporal_table_yr.map(add_date_property)
        temporal_table_yr = temporal_table_yr.sort('Name').sort('date')
        return temporal_table, temporal_table_yr

    def get_selected_geos(self):
        """
        Get default selcted geometry.
        """
        selected_geos = ee.FeatureCollection([])
        return selected_geos

    def get_communities(self):
        """
        Get community feature collection for GEE analysis.
        """
        communities = ee.FeatureCollection(
            GEEAsset.fetch_asset_source('communities')
        )
        communities = communities.map(
            lambda ft: ft.set(
                'area', ft.geometry().area().divide(ee.Number(10000))
            )
        )
        communities = communities.select(['Name', 'Project', 'area'])
        return communities

    def get_countries(self, country_names = None):
        """
        Get countries for clipping images
        """
        names = country_names or self.DEFAULT_COUNTRY_NAMES
        countries = (ee.FeatureCollection(
            GEEAsset.fetch_asset_source('countries')).
            filter(ee.Filter.inList('name', names)))
        return countries

    def get_cropland_urban_mask(self):
        """
        Get Cropland and urban mask
        """
        glc_coll = ee.ImageCollection(
            GEEAsset.fetch_asset_source('globe_land30')
        )
        glc_img = glc_coll.mosaic()

        masked = (glc_img.neq(10)
                  .And(glc_img.neq(60))
                  .And(glc_img.neq(80))
                  .And(glc_img.neq(100))
                  .And(glc_img.neq(255)))
        return masked

    def _process_cgls(self, col):
        """
        Process Copernicus Glocal Land Service.
        """
        bg = (col.select('bare-coverfraction').
              add(col.select('urban-coverfraction')))
        t = (col.select('tree-coverfraction').
             add(col.select('shrub-coverfraction')))
        g = col.select('grass-coverfraction')
        return (bg.rename(['bg'])
                .addBands(t.rename(['t']))
                .addBands(g.rename(['g']))
                .copyProperties(col)
                .set('year', ee.Number.parse(col.get('system:index'))))

    def get_soil_carbon(
        self, start_date: datetime.date = None, end_date: datetime.date = None,
        clip_to_countries = True, aoi = None
    ):
        """
        Get image for soil carbon mean.

        Parameters
        ----------
        start_date : datetime.date
            Start date to filter soil carbon asset.
        end_date: datetime.date
            End date to filter soil carbon asset.
        """
        # Coast fragment fraction 0-1
        cfvo = (ee.Image(GEEAsset.fetch_asset_source('soc_grids_cfvo'))
                .selfMask()
                .rename('soil_cfvo')
                .divide(1000))

        cfvo2 = (ee.Image(GEEAsset.fetch_asset_source('soc_stone_content'))
                 .select('mean_0_20')
                 .rename('soil_cfvo')
                 .divide(100))

        cfvo = ee.ImageCollection([cfvo2.float(), cfvo.float()]).mosaic()

        # Additional SOC data from iSDA dataset for the rest of Africa
        # Convert to SOC stocks using bulk density, fraction coarse fragments
        # Fill in gaps with SoilGrids

        isda = ee.Image(
            GEEAsset.fetch_asset_source('soc_isda')
        )
        isda = ee.Image(isda.divide(10)).exp().subtract(1)
        # Soil bulk density (fine earth) g/m³
        bd = (ee.Image(GEEAsset.fetch_asset_source('soc_grids_bd'))
              .rename('soil_bd')
              .selfMask()
              .divide(100))

        bd2 = (ee.Image(GEEAsset.fetch_asset_source('soc_bulk_density'))
               .select('mean_0_20')
               .rename('soil_bd')
               .divide(100))
        bd = ee.ImageCollection([bd2.float(), bd.float()]).mosaic()
        isda = (isda.multiply(bd)
                .multiply(ee.Image(1).subtract(cfvo))
                .multiply(0.6)
                .rename('SOC'))

        soc_col = self.get_soc_col(start_date, end_date)
        lt_mean = (soc_col
                   # Uncomment the following line to filter years if necessary
                   # .filterMetadata('year', 'greater_than', 2000)
                   .select(1).median().rename('SOC'))

        # Get mean SOC from Venter et al and iSDA
        soc_lt_mean = ee.ImageCollection(
            [isda.float(), lt_mean.float()]
        ).mean()
        if clip_to_countries:
            soc_lt_mean = soc_lt_mean.clipToCollection(self.countries)
        elif aoi:
            soc_lt_mean = soc_lt_mean.clipToCollection(aoi)
        return soc_lt_mean

    def get_grazing_capacity(self):
        """
        Get grazing capacity image, clipped by country.
        """
        masked = self.get_cropland_urban_mask()

        # Import pre-exported grazing capacity map
        grazing_capacity = ee.Image(
            GEEAsset.fetch_asset_source('grazing_capacity')
        )
        grazing_capacity = grazing_capacity.rename('grazingCap')
        grazing_capacity = (grazing_capacity
                            .updateMask(masked)
                            .unmask(0)
                            .clipToCollection(self.countries))
        return grazing_capacity

    def get_soc_col(
        self, start_date: datetime.date = None, end_date: datetime.date = None
    ):
        """
        Get soil organic carbon data.

        Parameters
        ----------
        start_date : datetime.date
            Start date to filter soil carbon asset.
        end_date: datetime.date
            End date to filter soil carbon asset.
        """
        # Import soil organic carbon data from Venter et al. 2021
        # https://www.sciencedirect.com/science/article/pii/S0048969721004526
        soc_col = ee.ImageCollection(
            GEEAsset.fetch_asset_source('soil_carbon')
        )

        def process_image(i):
            i = i.divide(ee.Image(1000)).copyProperties(i)
            year = ee.Number(i.get('year'))
            return ee.Image(year).int().addBands(i).set('year', year)

        soc_col = soc_col.map(process_image)

        # filter by year range
        if start_date and end_date:
            soc_col = soc_col.filter(
                ee.Filter.rangeContains(
                    'year', start_date.year, end_date.year
                )
            )

        return soc_col

    def get_soil_carbon_change(
        self, start_date: datetime.date = None, end_date: datetime.date = None,
        clip_to_countries = True, aoi = None
    ):
        """
        Get soil carbon change, clipped by countries.

        Parameters
        ----------
        start_date : datetime.date
            Start date to filter soil carbon asset.
        end_date: datetime.date
            End date to filter soil carbon asset.
        """
        # SOC mean
        soc_col = self.get_soc_col(start_date, end_date)

        # SOC trend
        trend_sens_img = soc_col.reduce(ee.Reducer.sensSlope())
        trend_sens_img = trend_sens_img.rename(['scale', 'offset'])

        soc_lt_trend = (trend_sens_img.select('scale').
                        multiply(35))
        if clip_to_countries:
            soc_lt_trend = soc_lt_trend.clipToCollection(self.countries)
        elif aoi:
            soc_lt_trend = soc_lt_trend.clipToCollection(
                aoi
            )
        return soc_lt_trend

    def get_spatial_layer_dict(
        self, start_date: datetime.date = None, end_date: datetime.date = None,
        user: User = None
    ):
        """
        Get spatial layer dictionary.

        Parameters
        ----------
        start_date : datetime.date
            Start date to filter assets: modis_vegetation,
            cgls_ground_cover, and soil_carbon.
        end_date: datetime.date
            End date to filter assets: modis_vegetation,
            cgls_ground_cover, and soil_carbon.
        """
        # Get MODIS vegetation data
        modis_veg = ee.ImageCollection(
            GEEAsset.fetch_asset_source('modis_vegetation')
        )
        if start_date and end_date:
            modis_veg = modis_veg.filterDate(
                start_date.isoformat(),
                end_date.isoformat()
            )
        else:
            modis_veg = modis_veg.filterDate('2016-01-01', '2020-01-01')
        modis_veg = (
            modis_veg.select(['NDVI', 'EVI'])
            .map(lambda i: i.divide(10000))
        )

        evi_baseline = (modis_veg.select('EVI').
                        median().clipToCollection(self.countries))
        ndvi_baseline = (modis_veg.select('NDVI').
                         median().clipToCollection(self.countries))

        # Get fractional ground cover from CGLS
        cgls_col = ee.ImageCollection(
            GEEAsset.fetch_asset_source('cgls_ground_cover')
        )
        if start_date and end_date:
            cgls_col = cgls_col.filterDate(
                start_date.isoformat(),
                end_date.isoformat()
            )
        cgls_col = (
            cgls_col.select(
                [
                    'bare-coverfraction', 'crops-coverfraction',
                    'urban-coverfraction', 'shrub-coverfraction',
                    'grass-coverfraction', 'tree-coverfraction'
                ]
            ).filterBounds(self.countries))

        cgls_col = cgls_col.map(self._process_cgls)
        cgls = cgls_col.median()
        bg = cgls.select('bg').clipToCollection(self.countries)
        t = cgls.select('t').clipToCollection(self.countries)
        g = cgls.select('g').clipToCollection(self.countries)

        grazing_capacity = self.get_grazing_capacity()
        soc_lt_mean = self.get_soil_carbon(start_date, end_date)
        soc_lt_trend = self.get_soil_carbon_change(start_date, end_date)

        # Dictionary with names for map layers and their ee.Image() objects
        spatial_layer_dict = {
            'EVI': evi_baseline,
            'NDVI': ndvi_baseline,
            'Bare ground': bg,
            'Grass cover': g,
            'Woody cover': t,
            'Grazing capacity': grazing_capacity,
            'Soil carbon': soc_lt_mean,
            'Soil carbon change': soc_lt_trend
        }
        gpw_dict = gpw_spatial_analysis_dict(
            self.countries, start_date, end_date
        )
        spatial_layer_dict.update(gpw_dict)

        user_layer_dict = user_spatial_analysis_dict(
            self.countries, user,
            start_date, end_date
        )
        spatial_layer_dict.update(user_layer_dict)
        return spatial_layer_dict

    def get_landscape_dict(self):
        """
        Get grazing capacity image, clipped by country.
        """
        # Define the geometries
        geometry = ee.Geometry.Polygon(
            [[[31.23125396489256, -22.2108383566201],
              [31.23125396489256, -24.229971486534726],
              [33.42302642583006, -24.229971486534726],
              [33.42302642583006, -22.2108383566201]]])

        geometry2 = ee.Geometry.MultiPolygon(
            [[[[28.33378423367544, -30.249456381789305],
               [28.33378423367544, -30.897391153446016],
               [29.23466313992544, -30.897391153446016],
               [29.23466313992544, -30.249456381789305]]],
             [[[28.7890869564936, -32.05624939716554],
               [28.7890869564936, -32.208593381736804],
               [28.883844036571723, -32.208593381736804],
               [28.883844036571723, -32.05624939716554]]]])

        geometry3 = ee.Geometry.Polygon(
            [[[20.95024748677959, -17.842248671588656],
              [20.95024748677959, -21.094178276654002],
              [25.190970143029585, -21.094178276654002],
              [25.190970143029585, -17.842248671588656]]])

        geometry4 = ee.Geometry.Polygon(
            [[[29.187987374711472, -22.788392235251568],
              [29.187987374711472, -23.137384763111807],
              [29.970763253617722, -23.137384763111807],
              [29.970763253617722, -22.788392235251568]]])

        geometry5 = ee.Geometry.Polygon(
            [[[31.2569524356448, -24.525712407318565],
              [31.2569524356448, -24.745411382234263],
              [31.52337089267605, -24.745411382234263],
              [31.52337089267605, -24.525712407318565]]])

        geometry6 = ee.Geometry.Polygon(
            [[[28.690026287829856, -21.346586704704198],
              [28.690026287829856, -22.47286905403228],
              [29.947960858142356, -22.47286905403228],
              [29.947960858142356, -21.346586704704198]]])

        geometry7 = ee.Geometry.Polygon(
            [[[17.449015007575344, -28.89105074204393],
              [17.449015007575344, -30.513248612037206],
              [18.294962273200344, -30.513248612037206],
              [18.294962273200344, -28.89105074204393]]])

        geometry8 = ee.Geometry.Polygon(
            [[[28.266480385610254, -28.243949117596102],
              [28.266480385610254, -31.550492042788992],
              [31.309693276235254, -31.550492042788992],
              [31.309693276235254, -28.243949117596102]]])

        geometry9 = ee.Geometry.Polygon(
            [[[32.08297498295084, -22.215135255355992],
              [32.08297498295084, -23.43024891314733],
              [33.47823865482584, -23.43024891314733],
              [33.47823865482584, -22.215135255355992]]])

        geometry10 = ee.Geometry.Polygon(
            [[[24.555562849533654, -17.69827351054879],
              [25.549825544846154, -17.69827351054879],
              [25.549825544846154, -16.83538161448828],
              [24.555562849533654, -16.83538161448828]]])

        landscapesDict = {
            'Limpopo NP': geometry,
            'UCPP': geometry2,
            'Ngamiland': geometry3,
            'Soutpansberg': geometry4,
            'K2C': geometry5,
            'Mapungubwe TFCA': geometry6,
            'Namakwa': geometry7,
            'Drakensberg Sub-Escarpment': geometry8,
            'Bahine NP': geometry9,
            'Zambia': geometry10
        }
        return landscapesDict

    def get_selected_area(self, aoi, is_custom_geom=False):
        """
        Get a FeatureCollection from area of interest.

        Parameters
        ----------
        aoi : ee.Polygon or ee.FeatureCollection
            Polygon area of interest.
        is_custom_geom : boolean
            If False, then find Communities polygon that intersects with aoi.

        Returns
        -------
        ee.FeatureCollection
        """
        communities = self.get_communities()
        selected_area = None
        if is_custom_geom:
            selected_area = ee.FeatureCollection([
                ee.Feature(aoi, {'Name': 'Custom Area'})
            ])
            selected_area = selected_area.map(lambda feature: feature.set(
                'area', feature.geometry().area().divide(10000)
            ))
        else:
            selected_area = communities.filterBounds(aoi)
        return selected_area


class AnalysisResultsCacheUtils:
    """Analysis results cache utilities."""

    def __init__(self, inputs):
        from analysis.utils import sort_nested_structure
        self.inputs = sort_nested_structure(inputs)

    def get_analysis_cache(self):
        """Get analysis cache."""
        cache = AnalysisResultsCache.objects.filter(
            analysis_inputs=self.inputs
        )
        if cache.exists():
            cache = cache.first()
            return cache.analysis_results
        return None

    def create_analysis_cache(self, results, ttl: int = None):
        """Create analysis cache."""
        from analysis.utils import sort_nested_structure

        results = sort_nested_structure(results)
        AnalysisResultsCache.save_cache_with_ttl(
            ttl=ttl,
            analysis_inputs=self.inputs,
            analysis_results=results
        )
        return results


def get_rel_diff(
        spatial_layer_dict: dict,
        analysis_dict: dict,
        reference_layer: dict,
        reducer: typing.Optional[ee.Reducer]
):
    """
    Get relative difference between reference layer.
    """
    # Select the image layer from the spatial layer dictionary
    # based on the variable in analysisDict
    img_select = spatial_layer_dict[analysis_dict['variable']]
    img_select = img_select.rename('val')

    geo_manual = None
    if reference_layer['type'] == 'Polygon':
        geo_manual = ee.Geometry.Polygon(reference_layer['coordinates'])
    else:
        geo_manual = ee.Geometry.MultiPolygon(reference_layer['coordinates'])
    if not reducer:
        reducer = ee.Reducer.mean()

    # Calculate mean using reduceRegion
    red = img_select.reduceRegion(
        reducer=reducer,
        geometry=geo_manual,
        scale=60,
        bestEffort=True
    )

    # Extract the mean value
    mean = ee.Number(red.get('val'))

    # Calculate relative difference
    rel_diff = (img_select.subtract(ee.Image(mean))
                .divide(ee.Image(mean))
                .multiply(ee.Image(100)))
    return rel_diff


def run_monthly_analysis(
        start_date, test_years, test_months, select_geo, is_custom_geom,
        select_names, analysis_cache
):
    """Run monthly analysis."""
    current_date = datetime.datetime.now().date()
    dates = [
        datetime.date(
            ty, test_months[idx], 1
        ) for idx, ty in enumerate(test_years)
    ]
    # use max in case dates are not ordered
    end_date = max(dates)

    # use start date of 2015-01-01
    date_ranges = split_dates_by_year(
        datetime.date(2015, 1, 1),
        end_date
    )

    # Map function to create a 'date' property
    def add_date(ft):
        date = ee.Date.parse(
            'yyyy-MM-dd',
            ee.String(ft.get('year')).cat(ee.String('-01-01'))
        ).advance(
            ee.Number(ft.get('month')), 'months'
        ).advance(-1, 'months')
        return ft.set('date', date.millis())

    collections = []
    for year_start, year_end in date_ranges:
        if year_start.year == current_date.year:
            # add 1 month
            test_dt = (
                year_end + relativedelta(months=1)
            ).isoformat()
            monthly_table = calculate_temporal(
                select_geo,
                year_start.isoformat(),
                test_dt,
                resolution='month',
                resolution_step=1,
                is_custom_geom=is_custom_geom
            )
            monthly_table = monthly_table.map(
                lambda feature: feature.setGeometry(None)
            )
        else:
            asset_key = f'monthly_temporal_{year_start.year}'
            asset = GEEAsset.fetch_asset_source(asset_key)
            monthly_table = ee.FeatureCollection(asset)
            monthly_table = monthly_table.filter(
                ee.Filter.inList('Name', select_names)
            )

        monthly_table = monthly_table.select(
            ['Name', 'ndvi', 'evi', 'bare', 'year', 'month'],
            ['Name', 'NDVI', 'EVI', 'Bare ground', 'year', 'month']
        )

        monthly_table = monthly_table.map(add_date)
        collections.append(monthly_table)

    # Merge them all into one
    merged_fc = reduce(lambda x, y: x.merge(y), collections)
    to_plot_ts = merged_fc.sort('Name').sort('date')
    # For plotting, just use the reference periods
    date_list_ee = ee.List(
        [
            start_date.isoformat()
        ] + [dt.isoformat() for dt in dates]
    ).map(lambda d: ee.Date(d).millis())
    to_plot = to_plot_ts.filter(
        ee.Filter.inList('date', date_list_ee)
    )
    return analysis_cache.create_analysis_cache(
        (
            to_plot.getInfo(),
            to_plot_ts.getInfo()
        )
    )


def run_analysis(locations: list, analysis_dict: dict, *args, **kwargs):
    """
    Run baseline, spatial, and temporal analysis

    :param locations: List of dictionary with lat and lon
    :param analysis_dict: Analysis Dictionary
    """
    analysis_cache = AnalysisResultsCacheUtils({
        'locations': locations,
        'analysis_dict': analysis_dict,
        'args': args,
        'kwargs': kwargs
    })
    output = analysis_cache.get_analysis_cache()
    if output:
        return output
    input_layers = InputLayer()
    selected_geos = input_layers.get_selected_geos()
    communities = input_layers.get_communities()
    baseline_table = input_layers.get_baseline_table()

    indicator = None
    if analysis_dict['analysisType'] != "Baseline":
        variable = analysis_dict['variable']
        indicator = Indicator.objects.filter(
            variable_name=variable
        ).first()
        if not indicator:
            analysis_task = AnalysisTask.objects.filter(
                id=kwargs.get('analysis_task_id')
            ).first()
            if analysis_task:
                indicator = analysis_task.get_indicator()
            else:
                raise ValueError(
                    f"Indicator for variable {variable} not found"
                )

    analysis_task = None
    if kwargs.get('analysis_task_id', None):
        analysis_task = AnalysisTask.objects.filter(
            id=kwargs.get('analysis_task_id')
        ).first()

    features_geo = []
    for location in locations:
        geo = ee.Geometry.Point(
            [location.get('lon'), location.get('lat')]
        )
        features_geo.append(ee.Feature(geo))
    selected_geos = selected_geos.merge(
        ee.FeatureCollection(features_geo)
    )
    select_names = None

    custom_geom = kwargs.get('custom_geom', None)
    if custom_geom:
        custom_geom = ee.FeatureCollection([
            ee.Feature(
                ee.Geometry.Polygon(custom_geom['coordinates']) if
                custom_geom['type'] == 'Polygon' else
                ee.Geometry.MultiPolygon(custom_geom['coordinates'])
            )
        ])
        select_names = communities.filterBounds(custom_geom).distinct(
            ['Name']
        ).reduceColumns(ee.Reducer.toList(), ['Name']).getInfo()['list']
    else:
        select_names = communities.filterBounds(selected_geos).distinct(
            ['Name']
        ).reduceColumns(ee.Reducer.toList(), ['Name']).getInfo()['list']

    if analysis_dict['analysisType'] == "Spatial":
        reference_layer = kwargs.get('reference_layer', None)
        if not reference_layer:
            raise ValueError("Reference layer not provided")
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        user = indicator.created_by if isinstance(
            indicator, UserIndicator
        ) else None
        reducer = indicator.get_reducer() if isinstance(
            indicator, UserIndicator
        ) else ee.Reducer.mean()
        rel_diff = get_rel_diff(
            input_layers.get_spatial_layer_dict(
                filter_start_date, filter_end_date, user
            ),
            analysis_dict,
            reference_layer,
            reducer
        )
        reduced = rel_diff.reduceRegions(
            collection=(
                custom_geom if custom_geom else
                communities.filterBounds(selected_geos)
            ),
            reducer=reducer,
            scale=60,
            tileScale=4
        )
        return analysis_cache.create_analysis_cache(reduced.getInfo())

    if analysis_dict['analysisType'] == "Baseline":
        has_dates = (
            analysis_dict['Baseline']['startDate'] and
            analysis_dict['Baseline']['endDate']
        )
        if has_dates:
            if custom_geom:
                select = calculate_baseline(
                    ee.Geometry.Polygon(custom_geom['coordinates']) if
                    custom_geom['type'] == 'Polygon' else
                    ee.Geometry.MultiPolygon(custom_geom['coordinates']),
                    analysis_dict['Baseline']['startDate'],
                    analysis_dict['Baseline']['endDate'],
                    is_custom_geom=True,
                    user=analysis_task.submitted_by
                )
            else:
                select = calculate_baseline(
                    selected_geos,
                    analysis_dict['Baseline']['startDate'],
                    analysis_dict['Baseline']['endDate'],
                    is_custom_geom=False,
                    user=analysis_task.submitted_by
                )
        else:
            if custom_geom:
                select = baseline_table.filterBounds(custom_geom)
            else:
                select = baseline_table.filterBounds(selected_geos)

            # add livestock baseline
            livestock_baseline = calculate_livestock_baseline(
                custom_geom if custom_geom else
                communities.filterBounds(selected_geos)
            )
            join_filter = ee.Filter.equals(
                leftField='Name',
                rightField='Name'
            )
            inner_join = ee.Join.inner()
            joined_fc = inner_join.apply(
                select,
                livestock_baseline,
                join_filter
            )
            # flatten the joined features
            select = joined_fc.map(
                lambda f: ee.Feature(f.get('primary'))
                            .copyProperties(ee.Feature(f.get('secondary')))
            )
        return analysis_cache.create_analysis_cache(select.getInfo())

    if analysis_dict['analysisType'] == "Temporal":
        res = analysis_dict['t_resolution']
        baseline_yr = int(analysis_dict['Temporal']['Annual']['ref'])
        test_years = [
            int(year) for year in analysis_dict['Temporal']['Annual']['test']
        ]

        if indicator.source == IndicatorSource.GPW:
            baseline_dt = datetime.date(
                baseline_yr, 1, 1
            )
            select_geo = input_layers.get_selected_area(
                custom_geom if custom_geom else selected_geos,
                True if custom_geom else False
            )

            # Run analysis for GPW datasets
            return gpw_annual_temporal_analysis(
                variable,
                baseline_dt,
                test_years,
                select_geo,
                analysis_cache
            )

        elif isinstance(indicator, UserIndicator):
            select_geo = input_layers.get_selected_area(
                custom_geom if custom_geom else selected_geos,
                True if custom_geom else False
            )

            start_date, test_dates = convert_temporal_to_dates(
                analysis_dict
            ).values()

            # Run analysis for GPW datasets
            result = user_temporal_analysis(
                variable=variable,
                user=indicator.created_by,
                start_date=start_date,
                test_dates=test_dates,
                resolution=res,
                select_geo=select_geo,
                analysis_cache=analysis_cache
            )
            return result

        temporal_table, temporal_table_yr = input_layers.get_temporal_table()

        if res == "Quarterly":
            landscapes_dict = input_layers.get_landscape_dict()
            if (
                    analysis_dict['Temporal']['Annual']['ref'] == 2023 or
                    analysis_dict['Temporal']['Annual']['test'] == 2023
            ):
                new_stats = get_latest_stats(
                    custom_geom if custom_geom else
                    landscapes_dict[analysis_dict['landscape']],
                    custom_geom if custom_geom else
                    communities.filterBounds(selected_geos)
                )
                new_stats = new_stats.select(
                    ['Name', 'ndvi', 'evi', 'bare', 'year', 'month'],
                    ['Name', 'NDVI', 'EVI', 'Bare ground', 'year', 'month']
                )
                new_stats = new_stats.map(lambda ft: ft.set(
                    'date', ee.Date.parse(
                        'yyyy-mm-dd',
                        ee.String(
                            ft.get('year')
                        ).cat(
                            ee.String('-01-01')
                        )
                    ).advance(
                        ee.Number(ft.get('month')), 'months'
                    ).millis()
                ))
                temporal_table = temporal_table.merge(new_stats)

            baseline_quart = quarter_dict[
                analysis_dict['Temporal']['Quarterly']['ref']
            ]
            test_quarts = [
                quarter_dict[quart] for quart in
                analysis_dict['Temporal']['Quarterly']['test']
            ]

            # Get annual years
            ref_year = int(analysis_dict['Temporal']['Annual']['ref'])
            test_years = [
                int(year) for year in
                analysis_dict['Temporal']['Annual']['test']
            ]

            # Create filters for reference year and all test years
            year_filters = []

            # Add reference year filter
            year_filters.append(
                ee.Filter.And(
                    ee.Filter.eq('year', ref_year),
                    ee.Filter.eq('month', baseline_quart)
                )
            )

            # Add filters for each combination of test year and test quarter
            for idx, test_year in enumerate(test_years):
                year_filters.append(
                    ee.Filter.And(
                        ee.Filter.eq('year', test_year),
                        ee.Filter.eq('month', test_quarts[idx])
                    )
                )

            to_plot = temporal_table.filter(
                ee.Filter.inList('Name', select_names)
            ).filter(
                ee.Filter.Or(*year_filters)
            )
        elif res == 'Monthly':
            select_geo = communities.filter(
                ee.Filter.inList('Name', select_names)
            )
            if custom_geom:
                select_geo = (
                    ee.Geometry.Polygon(custom_geom['coordinates']) if
                    custom_geom['type'] == 'Polygon' else
                    ee.Geometry.MultiPolygon(custom_geom['coordinates'])
                )
            baseline_month = int(analysis_dict['Temporal']['Monthly']['ref'])
            test_months = [
                int(month) for month in
                analysis_dict['Temporal']['Monthly']['test']
            ]
            baseline_dt = datetime.date(
                baseline_yr, baseline_month, 1
            )
            return run_monthly_analysis(
                baseline_dt, test_years, test_months,
                select_geo, custom_geom is not None,
                select_names, analysis_cache
            )
        else:
            to_plot = temporal_table_yr.filter(
                ee.Filter.inList('Name', select_names)
            ).filter(
                ee.Filter.inList('year', [baseline_yr] + test_years)
            )

        to_plot = to_plot.sort('Name').sort('date')

        to_plot_ts = temporal_table.filter(
            ee.Filter.inList('Name', select_names)
        )
        to_plot_ts = to_plot_ts.sort('Name').sort('date')
        return analysis_cache.create_analysis_cache(
            (
                to_plot.getInfo(),
                to_plot_ts.getInfo()
            )
        )

    if analysis_dict['analysisType'] == "BACI":
        reference_layer = kwargs.get('reference_layer', None)
        if not reference_layer:
            raise ValueError("Reference layer not provided")

        res = analysis_dict['t_resolution']
        before_dict = {
            'year': int(analysis_dict['Temporal']['Annual']['ref']),
            'quarter': (
                int(analysis_dict['Temporal']['Quarterly']['ref']) if
                res == 'Quarterly' else None
            ),
            'month': (
                int(analysis_dict['Temporal']['Monthly']['ref']) if
                res == 'Monthly' else None
            )
        }
        test_year = analysis_dict['Temporal']['Annual']['test']
        if isinstance(test_year, list):
            test_year = int(test_year[0])
        else:
            test_year = int(test_year)
        test_quarter = analysis_dict['Temporal']['Quarterly']['test']
        if isinstance(test_quarter, list):
            test_quarter = int(test_quarter[0])
        elif res == 'Quarterly':
            test_quarter = int(test_quarter)
        else:
            test_quarter = None
        test_month = analysis_dict['Temporal']['Monthly']['test']
        if isinstance(test_month, list):
            test_month = int(test_month[0])
        elif res == 'Monthly':
            test_month = int(test_month)
        else:
            test_month = None
        after_dict = {
            'year': test_year,
            'quarter': test_quarter,
            'month': test_month
        }
        result = calculate_baci(
            locations, reference_layer,
            analysis_dict['variable'], res,
            before_dict, after_dict
        )
        return analysis_cache.create_analysis_cache(result.getInfo())


def initialize_engine_analysis():
    """
    Initializes the Earth Engine API for analysis.
    """
    if os.path.exists(SERVICE_ACCOUNT_KEY):
        credentials = ee.ServiceAccountCredentials(
            SERVICE_ACCOUNT,
            SERVICE_ACCOUNT_KEY)
    else:
        credentials = ee.ServiceAccountCredentials(
            SERVICE_ACCOUNT,
            key_data=base64.b64decode(SERVICE_ACCOUNT_KEY).decode('utf-8')
        )
    try:
        # Initialize the Earth Engine API with the service account
        ee.Initialize(credentials)
        print("Earth Engine initialized successfully.")
    except ee.EEException as e:
        print("Earth Engine initialization failed:", e)


def add_indices(image):
    """
    Adds vegetation indices (NDVI, NBR, EVI) to a Sentinel-2 image.
    The input image is expected to have bands named 'nir', 'red', and 'swir2'.

    Parameters
    ----------
    image : ee.Image
        The input Sentinel-2 image with bands 'nir', 'red', and 'swir2'.

    Returns
    -------
    ee.Image
    """
    evi = image.expression(
        '2.5 * ((NIR - RED) / (NIR + (2.4 * RED) + 1000))', {
            'NIR': image.select('nir'),
            'RED': image.select('red')
        }).rename('evi')
    ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi')
    nbr = image.normalizedDifference(['nir', 'swir2']).rename('nbr')
    return image.addBands([ndvi, nbr, evi])


def get_s2_cloud_masked(
    aoi, start_date, end_date,
    scene_cloud_threshold=None, cloud_mask_probability=None,
    sentinel2_asset_key='sentinel2_sr_harmonized'
):
    """
    Retrieves a cloud-masked Sentinel-2 image collection over
        a specified area and date range.

    Parameters
    ----------
    aoi : ee.Geometry
        The area of interest over which to retrieve the images.
    start_date : str
        The start date (inclusive) in 'YYYY-MM-DD' format.
    end_date : str
        The end date (exclusive) in 'YYYY-MM-DD' format.
    scene_cloud_threshold : float, optional
        The maximum allowable cloud percentage for the images.
        Default is 20.
    cloud_mask_probability : float, optional
        The probability threshold for cloud masking.
        Default is 30.
    sentinel2_asset_key : str, optional
        The asset key for the Sentinel-2 image collection.
        Default is 'sentinel2_sr_harmonized'.
    Returns
    -------
    ee.ImageCollection
        A collection of cloud-masked Sentinel-2 images with added indices.

    Examples
    --------
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.01, -0.99])
    >>> # Specify date range
    >>> start_date = '2023-01-01'
    >>> end_date = '2023-01-31'
    >>> # Get the cloud-masked image collection
    >>> s2_collection = get_s2_cloud_masked(aoi, start_date, end_date)
    >>> # Print the number of images retrieved
    >>> print('Number of images:', s2_collection.size().getInfo())
    """
    scene_cloud_threshold = (
        scene_cloud_threshold or DEFAULT_SCENE_CLOUD_THRESHOLD
    )
    cloud_mask_probability = (
        cloud_mask_probability or DEFAULT_CLOUD_MASK_PROBABILITY
    )
    s2_sr = ee.ImageCollection(
        GEEAsset.fetch_asset_source(sentinel2_asset_key)
    ) \
        .filterBounds(aoi) \
        .filterDate(start_date, end_date) \
        .filter(
            ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', scene_cloud_threshold))

    s2_clouds = ee.ImageCollection(
        GEEAsset.fetch_asset_source('sentinel2_clouds')
    ) \
        .filterBounds(aoi) \
        .filterDate(start_date, end_date)

    inner_join = ee.Join.inner()
    ee_filter = ee.Filter.equals(
        leftField='system:index',
        rightField='system:index'
    )

    joined = inner_join.apply(s2_sr, s2_clouds, ee_filter)

    def merge_bands(feature):
        """
        Merges the Sentinel-2 SR image with the cloud probability image and
            applies the cloud mask.

        Parameters
        ----------
        feature : ee.Feature
            A feature containing 'primary' (SR image) and 'secondary'
            (cloud probability image).

        Returns
        -------
        ee.Image
            The cloud-masked Sentinel-2 SR image.
        """
        img = ee.Image(feature.get('primary'))
        cloud_prob = ee.Image(feature.get('secondary'))
        is_not_cloud = cloud_prob.select(
            'probability'
        ).lt(cloud_mask_probability)
        return img.updateMask(
            is_not_cloud
        ).copyProperties(img, img.propertyNames())

    s2_sr_with_cloud_mask = ee.ImageCollection(joined.map(merge_bands))

    s2 = s2_sr_with_cloud_mask \
        .select(S2_BANDS, S2_NAMES) \
        .map(add_indices)

    return s2.select(select_bands)


def get_nrt_sentinel(aoi, months, start_date, end_date):
    """
    Retrieves a near real-time Sentinel-2 image by
     computing the median over the past specified number of months.

    Parameters
    ----------
    aoi : ee.Geometry
        The area of interest over which to retrieve the images.
    months : int
        The number of months in the past over which
        to compute the median image.
    start_date : str
        The start date (inclusive) in 'YYYY-MM-DD' format.
    end_date : str
        The end date (exclusive) in 'YYYY-MM-DD' format.

    Returns
    -------
    ee.Image
        A near real-time median Sentinel-2 image over the specified area.

    Example
    -------
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.1, -0.9])
    >>> # Get a near real-time image over the past 2 months
    >>> nrt_image = get_nrt_sentinel(
        aoi, months=2, '2022-06-01', '2025-01-01')
    """
    col = get_s2_cloud_masked(
        aoi, start_date, end_date)
    now_dt = ee.Date(datetime.datetime.now(datetime.UTC))
    nrt_img = col.filterDate(
        now_dt.advance(-months, 'month'), now_dt).median()
    return nrt_img


def get_fire_frequency(self, aoi):
    """
    Get fire frequency layer clipped to area of interest.
    """
    fire_freq = calculate_firefreq(
        aoi,
        start_date='2000-01-01',
        end_date='2022-01-01'
    )
    return fire_freq


def get_woody_cover(self, start_date=None, end_date=None, aoi=None):
    """
    Get woody cover (tree + shrub) clipped to AOI or countries.
    """
    cgls = ee.ImageCollection(
        GEEAsset.fetch_asset_source('cgls_ground_cover')
    )
    if start_date and end_date:
        cgls = cgls.filterDate(start_date.isoformat(), end_date.isoformat())
    cgls = cgls.select(['tree-coverfraction', 'shrub-coverfraction'])
    woody_cover = cgls.median().reduce(ee.Reducer.sum()).rename('Woody cover')
    if aoi:
        return woody_cover.clip(aoi)
    return woody_cover.clipToCollection(self.countries)


def get_grazing_capacity_layer(self, aoi=None):
    """
    Get pre-calculated grazing capacity, optionally clipped to AOI.
    """
    img = ee.Image(GEEAsset.fetch_asset_source('grazing_capacity'))
    if aoi:
        return img.rename('grazing_capacity').clip(aoi)
    return img.rename('grazing_capacity').clipToCollection(self.countries)


def get_soc_col(self, start_date=None, end_date=None):
    """
    Returns the soil organic carbon (SOC) image collection,
    optionally filtered by year range.
    """
    soc_col = ee.ImageCollection(GEEAsset.fetch_asset_source('soil_carbon'))

    def process_image(img):
        img = img.divide(ee.Image(1000)).copyProperties(img)
        year = ee.Number(img.get('year'))
        return ee.Image(year).int().addBands(img).set('year', year)

    soc_col = soc_col.map(process_image)

    # Filter by year if provided
    if start_date and end_date:
        soc_col = soc_col.filter(
            ee.Filter.rangeContains('year', start_date.year, end_date.year)
        )

    return soc_col


def get_soil_carbon(
        self, start_date=None, end_date=None, clip_to_countries=True, aoi=None
):
    """
    Returns mean Soil Organic Carbon (SOC) image clipped by countries or AOI.
    """
    soc_col = self.get_soc_col(start_date, end_date)

    # Take median of selected SOC band (assumed to be band 1)
    soc_mean = soc_col.select(1).median().rename("SOCltMean")

    if clip_to_countries:
        return soc_mean.clipToCollection(self.countries)
    elif aoi:
        return soc_mean.clip(aoi)
    return soc_mean


def get_soil_carbon_layer(self, aoi=None):
    """
    Get SOC long-term mean image, optionally clipped.
    """
    return self.get_soil_carbon(
        start_date=datetime.date(2000, 1, 1),
        end_date=datetime.date(2022, 1, 1),
        aoi=aoi,
        clip_to_countries=not aoi
    ).rename('soil_carbon')


def get_soil_carbon_change(
        self, start_date=None, end_date=None, clip_to_countries=True, aoi=None
):
    """
    Returns SOC change (trend) image using
    Sen's slope clipped by countries or AOI.
    """
    soc_col = self.get_soc_col(start_date, end_date)

    # Calculate trend using Sen's slope
    trend_img = soc_col.reduce(ee.Reducer.sensSlope())
    soc_trend = trend_img.select('scale').multiply(35).rename("SOCltTrend")

    if clip_to_countries:
        return soc_trend.clipToCollection(self.countries)
    elif aoi:
        return soc_trend.clip(aoi)
    return soc_trend


def get_soil_carbon_change_layer(self, aoi=None):
    """
    Get SOC trend (change) image, optionally clipped.
    """
    return self.get_soil_carbon_change(
        start_date=datetime.date(2000, 1, 1),
        end_date=datetime.date(2022, 1, 1),
        aoi=aoi,
        clip_to_countries=not aoi
    ).rename('soil_carbon_change')


def quarterly_medians(
    collection, date_start, unit, step, reducer, date_end = None
):
    """
    Calculates periodic aggregate images (e.g., quarterly medians)
     from an image collection.

    Parameters
    ----------
    collection : ee.ImageCollection
        The input image collection to aggregate.
    date_start : str
        The start date (inclusive) in 'YYYY-MM-DD' format for aggregation.
    unit : str
        The unit of time for the intervals (e.g., 'month', 'year').
    step : int
        The length of each interval in units specified by 'unit'
        (e.g., 3 for quarterly if unit is 'month').
    reducer : ee.Reducer
        The reducer to apply over each interval (e.g., ee.Reducer.median()).
    date_end : str
        The end date (exclusive) in 'YYYY-MM-DD' format for aggregation.
        Default to use the latest date in dataset.

    Returns
    -------
    ee.ImageCollection
        An image collection where each image represents the
        aggregated result over an interval.

    Example
    -------
    >>> # Assume 'sc' is an ee.ImageCollection of Sentinel-2 images.
    >>> # Calculate quarterly median images starting from '2021-01-01'.
    >>> quarterly_images = quarterly_medians(
    ...     collection=sc,
    ...     date_start='2021-01-01',
    ...     unit='month',
    ...     step=3,
    ...     reducer=ee.Reducer.median()
    ... )
    >>> print('Number of quarterly images:', quarterly_images.size().getInfo())
    """
    start_date = ee.Date.parse('YYYY-MM-dd', date_start)
    start_date = start_date.advance(
        ee.Number(0).subtract(
            start_date.getRelative('month', unit)), 'month')
    start_date = start_date.update(
        None, None, None, 0, 0, 0)

    if date_end is None:
        end_date = ee.Date(collection.sort(
            'system:time_start', False).first().get('system:time_start'))
        end_date = end_date.advance(
            ee.Number(0).subtract(end_date.getRelative('month', unit)),
            'month') \
            .advance(1, unit).advance(-1, 'month') \
            .update(None, None, None, 23, 59, 59)
    else:
        end_date = ee.Date.parse('YYYY-MM-dd', date_end)

    if unit == "year" and end_date.difference(
        start_date, "year"
    ).lt(1).getInfo():
        # force one year interval
        date_ranges = ee.List([0])
    else:
        date_ranges = ee.List.sequence(
            0, end_date.difference(
                start_date, unit
            ).round().subtract(1)
        )

    def make_time_slice(num):
        """
        Creates an aggregated image for a specific interval.

        Parameters
        ----------
        num : ee.Number
            The interval number.

        Returns
        -------
        ee.Image
            The aggregated image for the interval.
        """
        start = start_date.advance(num, unit)
        start_date_num = start.millis()
        end = start.advance(step, unit).advance(-1, 'second')
        # Filter to the date range
        filtered = collection.filterDate(start, end)
        # Get the median
        unit_means = filtered.reduce(reducer) \
            .set('system:time_start', start_date_num,
                 'date', start,
                 'month', start.get('month'),
                 'year', start.get('year'))
        return unit_means

    new_collection = ee.ImageCollection(
        date_ranges.map(make_time_slice))

    if unit == 'month' and step == 3:
        new_collection = new_collection.filter(
            ee.Filter.inList('month', [1, 4, 7, 10]))

    return new_collection


def get_sent_quarterly(aoi):
    """
    Generates quarterly median Sentinel-2 images for
     the specified area of interest.

    Parameters
    ----------
    aoi : ee.Geometry
        The area of interest over which to retrieve and process the images.

    Returns
    -------
    ee.ImageCollection
        An image collection of quarterly median Sentinel-2 images,
        with bands renamed.

    Example
    -------
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.1, -0.9])
    >>> # Get quarterly median Sentinel-2 images
    >>> quarterly_images = get_sent_quarterly(aoi)
    >>> print('Number of quarterly images:', quarterly_images.size().getInfo())
    """
    sentinel_2 = get_s2_cloud_masked(
        aoi, '2021-01-01', '2025-01-01')
    sent_quarterly = (
        quarterly_medians(
            sentinel_2, '2021-01-01', 'month', 3,
            ee.Reducer.median())
    )
    sent_quarterly = sent_quarterly.map(lambda i: i.rename(select_bands))
    return sent_quarterly


def train_bgt(aoi, training_path):
    """
    Trains a Random Forest classifier to estimate
     bare ground, tree, and grass cover fractions.

    Parameters
    ----------
    aoi : ee.Geometry
        The area of interest over which to filter the training data.
    training_path : str
        The training data asset path.

    Returns
    -------
    ee.Classifier
        A trained Random Forest classifier with multi-probability output mode.

    Notes
    -----
    - The variable `TRAINING_DATA_ASSET_PATH` should be defined and point to
        the correct Earth Engine asset.
    - The variable `selectBands` should be a list of band names used as
        input features for the classifier.

    Example
    -------
    >>> training_path = ''
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.1, -0.9])
    >>> # Train the classifier
    >>> classifier = train_bgt(aoi, training_path)
    """
    training_testing_master = ee.FeatureCollection(training_path)
    training_testing = training_testing_master.filterBounds(aoi)
    classifier = ee.Classifier.smileRandomForest(100).train(
        features=training_testing,
        classProperty='landcover',
        inputProperties=select_bands
    ).setOutputMode('MULTIPROBABILITY')
    return classifier


def classify_bgt(image, classifier):
    """
    Classifies an image into bare ground, tree, and grass cover fractions
     using a trained classifier.

    Parameters
    ----------
    image : ee.Image
        The input image to classify. Should contain the bands used
        during classifier training.
    classifier : ee.Classifier
        The trained classifier to apply to the image.

    Returns
    -------
    ee.Image
        An image with bands 'bare', 'tree', and 'grass',
        representing the percentage cover fractions (0-100%).

    Example
    -------
    >>> # Assume 'image' is a Sentinel-2 image prepared
    >>> # with the necessary bands.
    >>> # 'classifier' is a trained Random Forest classifier.
    >>> classified_image = classify_bgt(image, classifier)
    >>> # Display the bare ground percentage cover
    >>> Map.addLayer(
    >>>     classified_image.select(
    >>>        'bare'), {'min': 0, 'max': 100}, 'Bare Ground Cover')
    """
    classified_image = image.classify(classifier)
    perc_gc = (
        classified_image.arrayFlatten(
            [['bare', 'tree', 'grass']]).multiply(100)
    )
    return perc_gc


def get_latest_stats(geo, communities_select):
    """
    Calculates mean values of EVI, NDVI, and bare ground cover
     for specified regions.

    Parameters
    ----------
    geo : ee.Geometry
        The geometry defining the area over which to train the classifier.
    communities_select : ee.FeatureCollection
        The collection of regions (e.g., communities) over which
        to compute the statistics.

    Returns
    -------
    ee.FeatureCollection
        A collection of features containing the mean EVI, NDVI, and
        bare ground cover for each region and time period.


    Example
    -------
    >>> # Define the area for training
    >>> geo = ee.Geometry.Polygon([...])
    >>> # Define the communities over which to compute statistics
    >>> communities_select = ee.FeatureCollection('path/to/communities')
    >>> # Get the latest statistics
    >>> stats = get_latest_stats(geo, communities_select)
    >>> # Print the first feature
    >>> print(stats.first().getInfo())
    """
    col = get_sent_quarterly(communities_select)
    classifier = train_bgt(
        geo, GEEAsset.fetch_asset_source('random_forest_training')
    )

    def process_image(i):
        bg = classify_bgt(i, classifier).select('bare')
        img = i.select(['evi', 'ndvi']).addBands(bg)
        reduced = img.reduceRegions(
            collection=communities_select,
            reducer=ee.Reducer.mean(),
            scale=120,
            tileScale=4
        )
        reduced = reduced.map(
            lambda ft: ft.set('year', i.get('year'), 'month', i.get('month')))
        return reduced

    feats = col.map(process_image).flatten()
    return feats


def _start_export_task(task: ee.batch.Task, description):
    task.start()
    print(f"Export task '{description}' started.")

    while task.active():
        status = task.status()
        print(f"Task status: {status['state']}")
        time.sleep(10)

    final_status = task.status()
    print(f"Final task status: {final_status['state']}")
    if final_status['state'] == 'COMPLETED':
        print('Export completed successfully.')
    else:
        print('Export failed. Details:')
        print(final_status)
    return final_status


# TODO : Export image to google cloud storage
def export_image_to_drive(
        image,
        description,
        folder,
        file_name_prefix,
        scale,
        region,
        max_pixels=1e13,
        vis_params=None):
    """
    Exports an Earth Engine image to Google Drive and monitors the export task.

    Parameters
    ----------
    image : (ee.Image)
        The Earth Engine image to export.
    description : (str)
        Description of the task.
    folder : (str)
        Google Drive folder where the image will be saved.
    file_name_prefix : (str)
        Prefix for the output file name.
    scale : (float)
        Pixel resolution in meters.
    region : (Geometry)
        The region to export as a GeoJSON geometry or coordinates list.
    max_pixels : (int, optional)
        Maximum number of pixels allowed in the exported image.
        Defaults to 1e13.
    vis_params : (dict, optional)
        Visualization parameters for the image.
            Defaults to None.

    Returns
    ----------
    None
    """
    # Configure the export task
    # Reproject the image to EPSG:3857
    reprojected = image.reproject(crs='EPSG:3857', scale=scale)
    # Clip and mask the image using the geometry of selected features
    masked = reprojected.clip(region)
    # Unmask the image with a no-data value
    no_data_val = -9999
    final_image = masked.unmask(
        value=no_data_val, sameFootprint=True
    )
    task = ee.batch.Export.image.toDrive(
        image=(
            final_image.visualize(**vis_params) if vis_params else
            final_image
        ),
        description=description,
        folder=folder,
        fileNamePrefix=file_name_prefix,
        scale=scale,
        crs='EPSG:3857',
        region=region,
        maxPixels=max_pixels,
        formatOptions={
            'cloudOptimized': True,
            'noData': no_data_val
        }
    )

    return _start_export_task(task, description)


def export_table_to_drive(feature_collection, description, folder):
    """
    Exports a FeatureCollection to Google Drive.

    Parameters
    ----------
    feature_collection : ee.FeatureCollection
        The FeatureCollection to export.
    description : str
        Description of the export task.
    folder : str
        Google Drive folder where the file will be saved.

    Returns
    -------
    None
    """
    task = ee.batch.Export.table.toDrive(
        collection=feature_collection,
        description=description,
        folder=folder,
        fileFormat='CSV'
    )
    return _start_export_task(task, description)


def spatial_get_date_filter(analysis_dict):
    """Get spatial date filter from analysis_dict.

    Parameters
    ----------
    analysis_dict : dict
        Dictionary containing analysis parameters including temporal resolution
        and date specifications.

    Returns
    -------
    tuple
        A tuple containing (filter_start_date, filter_end_date)
        as datetime.date objects.
    """
    filter_start_date = None
    filter_end_date = None

    # Get temporal resolution
    t_resolution = analysis_dict.get('t_resolution', 'Annual')

    # Get reference values based on temporal resolution
    start_year = analysis_dict['Spatial'].get('Annual', {}).get('ref')
    end_year = analysis_dict['Spatial'].get('Annual', {}).get('test')
    try:
        end_year = end_year[0] if isinstance(end_year, list) else end_year
    except IndexError:
        end_year = ''

    if t_resolution == 'Annual':

        if start_year:
            filter_start_date = datetime.date(int(start_year), 1, 1)

        if end_year:
            # For annual year 2023, end date is December 31 on the same year
            if end_year == 2023:
                filter_end_date = datetime.date(int(end_year), 12, 31)
            else:
                # Otherwise, end date is January 1 next year
                filter_end_date = datetime.date(int(end_year) + 1, 1, 1)

    elif t_resolution == 'Quarterly':
        start_quarter = analysis_dict['Spatial'].get(
            'Quarterly', {}
        ).get('ref')
        end_quarter = analysis_dict['Spatial'].get('Quarterly', {}).get('test')
        try:
            end_quarter = end_quarter[0] if isinstance(
                end_quarter, list
            ) else end_quarter
        except IndexError:
            end_quarter = ''

        if start_quarter and start_year:
            # Convert quarter to month (Q1=1, Q2=4, Q3=7, Q4=10)
            start_month = (int(start_quarter) - 1) * 3 + 1
            filter_start_date = datetime.date(int(start_year), start_month, 1)

        if end_quarter and end_year:
            # Calculate end date as the last day of
            # the last month in the quarter
            end_month = int(end_quarter) * 3  # Last month of the quarter

            # Handle December specially
            if end_month == 12:
                if end_year == 2023:
                    filter_end_date = datetime.date(int(end_year), 12, 31)
                else:
                    filter_end_date = datetime.date(int(end_year) + 1, 1, 1)
            else:
                # Last day of the month = first day of next month - 1 day
                # But since it's exclusive, we don't decrease by 1 day
                next_month_year = int(end_year)
                next_month = end_month + 1
                if next_month > 12:
                    next_month = 1
                    next_month_year += 1

                filter_end_date = datetime.date(
                    next_month_year,
                    next_month,
                    1
                )

    elif t_resolution == 'Monthly':
        start_month = analysis_dict['Spatial'].get('Monthly', {}).get('ref')
        end_month = analysis_dict['Spatial'].get('Monthly', {}).get('test')
        try:
            end_month = end_month[0] if isinstance(
                end_month, list
            ) else end_month
        except IndexError:
            end_month = ''

        if start_month and start_year:
            filter_start_date = datetime.date(
                int(start_year),
                int(start_month),
                1
            )

        if end_month and end_year:
            # Calculate the last day of the end month
            end_month_int = int(end_month)
            end_year_int = int(end_year)

            # Last day of the month = first day of next month - 1 day
            # But since it's exclusive, we don't decrease by 1 day
            if end_month_int == 12:
                if end_month_int == 2023:
                    filter_end_date = datetime.date(end_year_int, 12, 31)
                else:
                    filter_end_date = datetime.date(end_year_int + 1, 1, 1)
            else:
                filter_end_date = datetime.date(
                    end_year_int,
                    end_month_int + 1,
                    1
                )

    # Fallback to the original implementation if
    # specific resolution handling failed
    if filter_start_date is None and\
        analysis_dict['Spatial'].get('start_year', None):
        filter_start_date = datetime.date(
            int(start_year), 1, 1
        )

    if filter_end_date is None and\
        analysis_dict['Spatial'].get('end_year', None) and end_year:
        filter_end_date = datetime.date(
            int(end_year), 12, 31
        )

    return filter_start_date, filter_end_date


def validate_spatial_date_range_filter(
    variable: str, start_date: datetime.date, end_date: datetime.date
):
    """Validate whether the date range filter is valid."""
    if start_date is None or end_date is None:
        return True, None, None

    spatial_dict = {
        'EVI': ['modis_vegetation'],
        'NDVI': ['modis_vegetation'],
        'Bare ground': ['cgls_ground_cover'],
        'Grass cover': ['cgls_ground_cover'],
        'Woody cover': ['cgls_ground_cover'],
        'Soil carbon change': ['soil_carbon']
    }

    if variable not in spatial_dict:
        return True, None, None

    assets = spatial_dict[variable]
    for asset_key in assets:
        valid_start_date = GEEAsset.is_date_within_asset_period(
            asset_key, start_date.isoformat()
        )
        valid_end_date = GEEAsset.is_date_within_asset_period(
            asset_key, end_date.isoformat()
        )
        if not valid_start_date or not valid_end_date:
            metadata = GEEAsset.fetch_asset_metadata(asset_key)
            return False, metadata.get('start_date'), metadata.get('end_date')
    return True, None, None


# Note: this function exceeds computational limit
# TODO: investigate whether we can reduce to aoi in the training data
# TODO: investigate and RnD to store the classifier model and load later
def calculate_grazing_capacity(aoi, start_date, end_date):
    """Calculate grazing by start_date, end_date, and area of interest."""
    input_layer = InputLayer()

    sampling_area = input_layer.get_countries(
        country_names=[
            'SOUTH AFRICA', 'LESOTHO', 'SWAZILAND',
            'NAMIBIA', 'ZIMBABWE', 'BOTSWANA',
            'MOZAMBIQUE'
        ]
    )

    gp = ee.FeatureCollection(
        GEEAsset.fetch_asset_source('grazing_capacity_ref')
    )

    # Create a mask of non-natural lands
    glc_coll = ee.ImageCollection(
        GEEAsset.fetch_asset_source('globe_land30')
    )
    glc_img = ee.Image(glc_coll.mosaic())
    masked = (glc_img.neq(10)
              .And(glc_img.neq(20))
              .And(glc_img.neq(50))
              .And(glc_img.neq(60))
              .And(glc_img.neq(80))
              .And(glc_img.neq(100))
              .And(glc_img.neq(255)))

    # MODIS
    ndwi = (ee.ImageCollection(
                GEEAsset.fetch_asset_source('modis_ndwi')
            )
            .filterBounds(sampling_area)
            .filterDate(start_date, end_date)
            .median())

    evi = (ee.ImageCollection(GEEAsset.fetch_asset_source('modis_vegetation'))
           .filterBounds(sampling_area)
           .filterDate(start_date, end_date)
           .select('EVI'))
    evi_med = evi.median()

    # Calculate variance in EVI over time
    evi_var = evi.reduce(ee.Reducer.variance())

    # Get surface reflectance data as well
    srf = (ee.ImageCollection(GEEAsset.fetch_asset_source(
        'modis_surface_reflect'))
           .filterBounds(sampling_area)
           .filterDate(start_date, end_date)
           .select(
               [
                   'sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03',
                   'sur_refl_b04', 'sur_refl_b05', 'sur_refl_b06',
                   'sur_refl_b07'
               ]
            ))
    srfMed = srf.median()

    # Combine
    combined = ndwi.addBands(
        evi_med.rename('evi')
    ).addBands(
        evi_var.rename('evi_var')
    ).addBands(srfMed)
    # Apply land cover mask to isolate rangeland
    combined = combined.updateMask(masked)

    bands = combined.bandNames()

    def map_training_data(ft):
        return ft.setGeometry(None).set(combined.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=ft.geometry(),
            scale=500,
        ))
    train_test = gp.map(map_training_data)

    def map_convert_lsu(ft):
        return ft.set(
            'LSU_ha',
            ee.Number(1).divide(ee.Number(ft.get('ha_LSU')))
        )

    # Convert to LSU per hectare
    train_test = train_test.map(map_convert_lsu)

    # Train RF classifier
    # parameters: numberOfTrees, variablesPerSplit,
    # minLeafPopulation, bagFraction
    classifierReg = (ee.Classifier.smileRandomForest(100)
                     .setOutputMode('REGRESSION')
                     .train(
                         features=train_test,
                         classProperty='LSU_ha',
                         inputProperties=bands
                     ))

    # Classify with RandomForest
    classified = combined.select(bands).classify(classifierReg)

    return classified.clipToCollection(aoi)


def calculate_firefreq(aoi, start_date, end_date):
    """Calculate firefreq by start_date, end_date, and area of interest."""
    start_dt = datetime.date.fromisoformat(start_date)
    end_dt = datetime.date.fromisoformat(end_date)

    def confidence_mask(thresh):
        def mask_function(img):
            conf_mask = img.select('ConfidenceLevel').gt(thresh)
            return img.updateMask(conf_mask)
        return mask_function

    # Import and clean FireCCI data between 2000 and 2022
    # (original Rangeland explorer map between 2000 and 2018)
    ba = ee.ImageCollection(
        GEEAsset.fetch_asset_source('fire_cci')
    )
    if aoi:
        ba = ba.filterBounds(aoi)

    ba = (ba
          .filter(ee.Filter.calendarRange(start_dt.year, end_dt.year, 'year'))
          .map(confidence_mask(50))
          .select('BurnDate'))

    def temporal_average(collection, unit, reducer):
        # Get the start date from the earliest image
        start_date = ee.Date(
            ee.Image(
                collection.sort('system:time_start').first()
            ).get('system:time_start')
        )
        start_date = (start_date
                      .advance(
                          ee.Number(0)
                          .subtract(start_date.getRelative('month', unit)),
                          'month'
                      )
                      .update(None, None, None, 0, 0, 0))

        # Get the end date from the latest image
        end_date = ee.Date(
            ee.Image(
                collection.sort('system:time_start', False).first()
            ).get('system:time_start')
        )
        end_date = (end_date
                    .advance(
                        ee.Number(0)
                        .subtract(end_date.getRelative('month', unit)),
                        'month'
                    )
                    .advance(1, unit).advance(-1, 'month')
                    .update(None, None, None, 23, 59, 59))

        # Create a list of date ranges
        date_ranges = ee.List.sequence(
            0,
            end_date.difference(start_date, unit).round().subtract(1)
        )

        def make_timeslice(num):
            num = ee.Number(num)
            start = start_date.advance(num, unit)
            start_num = start.millis()
            start_date_num = ee.Number.parse(start.format("YYYYMMdd"))
            end = start.advance(1, unit).advance(-1, 'second')

            filtered = collection.filterDate(start, end)
            unit_means = (filtered.reduce(reducer)
                          .set({'system:time_start': start_num,
                                'system:time_end': end,
                                'date': start_date_num}))
            return unit_means

        return ee.ImageCollection(date_ranges.map(make_timeslice))

    # Get annual burns
    ba_annual = temporal_average(ba, 'year', ee.Reducer.max())

    # Count number of burns over time period
    ba_count = ba_annual.reduce(ee.Reducer.count())

    return ba_count.rename('fireFreq')


def calculate_baseline(aoi: ee.Geometry, start_date: str, end_date: str,
                       is_custom_geom: bool = False, *args, **kwargs):
    """
    Calculate baseline statistics.

    Note:
    - each indicator is checked againts its asset's date availability
    - only calculate date range or its subset in asset's date availability

    Parameters
    ----------
    aoi : ee.Geometry
        Area of interest.
    start_date : str
        Start date to calculate baseline.
    end_date : str
        End date to calculate baseline.
    is_custom_geom : boolean
        If False, then use Communities polygon that intersects with aoi.

    Returns
    -------
    ee.Image
    """
    image_list = []
    input_layer = InputLayer()
    selected_area = input_layer.get_selected_area(aoi, is_custom_geom)

    # Get MODIS vegetation data
    valid, start_dt, end_dt = GEEAsset.get_dates_within_asset_period(
        'modis_vegetation_061', start_date, end_date
    )
    if valid:
        modis_veg = (ee.ImageCollection(
                        GEEAsset.fetch_asset_source('modis_vegetation_061')
                    )
                    .filterDate(start_dt, end_dt)
                    .filterBounds(selected_area)
                    .select(['NDVI', 'EVI'])
                    .map(lambda i: i.divide(10000)))
        evi_baseline = modis_veg.select('EVI').median()
        ndvi_baseline = modis_veg.select('NDVI').median()
        image_list.append({
            'asset': evi_baseline,
            'attribute': 'EVI',
            'label': 'EVI'
        })
        image_list.append({
            'asset': ndvi_baseline,
            'attribute': 'NDVI',
            'label': 'NDVI'
        })

    # Get CGLS Ground Cover data
    valid, start_dt, end_dt = GEEAsset.get_dates_within_asset_period(
        'cgls_ground_cover', start_date, end_date
    )
    if valid:
        cgls = (ee.ImageCollection(
                    GEEAsset.fetch_asset_source('cgls_ground_cover')
                )
                .filterDate(start_dt, end_dt)
                .filterBounds(selected_area)
                .select(
                    [
                        'bare-coverfraction', 'crops-coverfraction',
                        'urban-coverfraction', 'shrub-coverfraction',
                        'grass-coverfraction', 'tree-coverfraction'
                    ]
                ))
        cgls = cgls.median()

        # Additional calculations for land cover fractions and grazing capacity
        bg = cgls.select('bare-coverfraction').add(
            cgls.select('urban-coverfraction')
        )
        t = cgls.select('tree-coverfraction').add(
            cgls.select('shrub-coverfraction')
        )
        g = cgls.select('grass-coverfraction')
        image_list.append({
            'asset': bg,
            'attribute': 'bare-coverfraction',
            'label': 'Bare ground %'
        })
        image_list.append({
            'asset': t,
            'attribute': 'tree-coverfraction',
            'label': 'Woody cover %'
        })
        image_list.append({
            'asset': g,
            'attribute': 'grass-coverfraction',
            'label': 'Grass cover %'
        })

    # TODO: add grazing capacity

    # fire freq
    valid, start_dt, end_dt = GEEAsset.get_dates_within_asset_period(
        'fire_cci', start_date, end_date
    )
    if valid:
        fire_freq = calculate_firefreq(
            selected_area,
            start_dt,
            end_dt
        ).divide(18)
        fire_freq = fire_freq.unmask(0)
        image_list.append({
            'asset': fire_freq,
            'attribute': 'fireFreq',
            'label': 'Fires/yr'
        })

    # SOCltMean and SOCltTrend
    valid, start_dt, end_dt = GEEAsset.get_dates_within_asset_period(
        'soil_carbon', start_date, end_date
    )
    if valid:
        soc_lt_mean = input_layer.get_soil_carbon(
            datetime.date.fromisoformat(start_dt),
            datetime.date.fromisoformat(end_dt),
            False,
            selected_area
        )
        soc_lt_mean = soc_lt_mean.rename('SOCltMean')
        image_list.append({
            'asset': soc_lt_mean,
            'attribute': 'SOCltMean',
            'label': 'SOC kg/m2'
        })

        # SOCltTrend
        soil_start_dt = datetime.date.fromisoformat(start_dt)
        if soil_start_dt.year == datetime.date.fromisoformat(end_dt).year:
            # soild_carbon_change needs 2 years of data
            soil_start_dt = datetime.date(
                soil_start_dt.year - 1, soil_start_dt.month, soil_start_dt.day
            )
            start_dt = soil_start_dt.isoformat()
        soc_lt_trend = input_layer.get_soil_carbon_change(
            datetime.date.fromisoformat(start_dt),
            datetime.date.fromisoformat(end_dt),
            False,
            selected_area
        )
        soc_lt_trend = soc_lt_trend.rename('SOCltTrend')
        image_list.append({
            'asset': soc_lt_trend,
            'attribute': 'SOCltTrend',
            'label': 'SOC change kg/m2'
        })

    # Add livestock all species
    livestock_map = ee.Image(
        GEEAsset.fetch_asset_source('livestock_all_2020')
    ).clip(selected_area)
    livestock_map = livestock_map.select('b1').rename('LivestockDensity')
    image_list.append({
        'asset': livestock_map,
        'attribute': 'LivestockDensity',
        'label': 'Livestock Density 2020 head/km2'
    })

    # Add User GEE Asset
    user = kwargs.get('user')
    indicator_asset_dicts = UserIndicator.map_user_indicator_to_user_gee_asset(
        user=user,
        asset_types=[GEEAssetType.IMAGE_COLLECTION],
        analysis_types=['Baseline']
    )

    for indicator, user_gee_asset in indicator_asset_dicts.items():
        valid, start_dt, end_dt = UserGEEAsset.get_dates_within_asset_period(
            user_gee_asset.key, start_date, end_date, user
        )
        if valid:
            gee_asset_class = GEEAssetType.get_ee_asset_class(user_gee_asset)
            var_names = user_gee_asset.metadata.get('band_names', None)
            if not var_names:
                continue
            var_name = var_names[0]
            gee_asset_obj = gee_asset_class(
                user_gee_asset.source
            ).select(var_name).filterDate(
                parse(start_dt).isoformat(), parse(end_dt).isoformat()
            ).filterBounds(selected_area)
            gee_asset_obj = gee_asset_obj.reduce(indicator.get_reducer())
            gee_asset_obj = gee_asset_obj.rename(indicator.variable_name)
            image_list.append({
                'asset': gee_asset_obj,
                'attribute': indicator.variable_name,
                'label': indicator.variable_name
            })

    if len(image_list) == 0:
        raise ValueError('No baseline in the input date ranges.')

    # Combining all layers for analysis and renaming for clarity
    combined = ee.Image.cat(
        *[img['asset'] for img in image_list]
    )
    combined = combined.select(
        [img['attribute'] for img in image_list],
        [img['label'] for img in image_list]
    )

    # Reducing regions to extract mean values per polygon
    reduced = combined.reduceRegions(selected_area, ee.Reducer.mean(), 100)
    reduced = reduced.distinct(['Name', 'Area ha'])

    reduced = reduced.map(
        lambda feature: feature.setGeometry(None)
    )

    return reduced


def get_sentinel_by_resolution(
    aoi, start_date, end_date, resolution, resolution_step
):
    """
    Get sentinel by resolution.

    Parameters
    ----------
    aoi : ee.Polygon
        Polygon area of interest.
    start_date : str
        Start date to calculate baseline.
    end_date : str
        End date to calculate baseline.
    resolution : str
        Temporal resolution: month or year.
    resolution_step : str
        Resolution: 1 for each month or 3 for quarterly.

    Returns
    -------
    ee.ImageCollection
    """
    sentinel_2 = get_s2_cloud_masked(
        aoi, start_date, end_date, scene_cloud_threshold=50,
        sentinel2_asset_key='sentinel2_harmonized'
    )
    sent_quarterly = (
        quarterly_medians(
            sentinel_2, start_date, resolution, resolution_step,
            ee.Reducer.median(), date_end=end_date
        )
    )
    sent_quarterly = sent_quarterly.map(lambda i: i.rename(select_bands))
    return sent_quarterly


def calculate_temporal(
    aoi, start_date, end_date, resolution, resolution_step,
    is_custom_geom=False, classifier=None
):
    """
    Calculate temporal timeseries stats.

    Parameters
    ----------
    aoi : ee.Polygon or ee.FeatureCollection
        Polygon area of interest.
    start_date : str
        Start date to calculate temporal analysis.
    end_date : str
        End date to calculate temporal analysis.
    resolution : str
        Temporal resolution: month or year.
    resolution_step : str
        Resolution: 1 for each month or 3 for quarterly.
    is_custom_geom : boolean
        If False, then use Communities polygon that intersects with aoi.
    classifier : ee.Classifier
        A trained classifier to apply to the image.
        If None, a new classifier will be trained.

    Returns
    -------
    ee.ImageCollection
    """
    input_layer = InputLayer()
    selected_area = (
        input_layer.get_selected_area(aoi, is_custom_geom) if
        is_custom_geom else aoi
    )
    geo = selected_area.geometry().bounds()

    # Get the classifier
    if classifier is None:
        classifier = train_bgt(
            geo, GEEAsset.fetch_asset_source('random_forest_training')
        )
    col = get_sentinel_by_resolution(
        geo, start_date, end_date, resolution, resolution_step
    )

    def process_image(i):
        bg = classify_bgt(i, classifier).select('bare')
        img = i.select(['evi', 'ndvi']).addBands(bg)
        reduced = img.reduceRegions(
            collection=selected_area,
            reducer=ee.Reducer.mean(),
            scale=120,
            tileScale=4
        )
        reduced = reduced.filter(
            ee.Filter.notNull(['evi', 'ndvi', 'bare'])
        ).map(
            lambda ft: ft.set(
                'year', i.get('year'),
                'month', i.get('month')
            )
        )
        return reduced

    return col.map(process_image).flatten()


def calculate_temporal_modis_veg(
    selected_area, start_date, end_date,
    resolution, resolution_step,
    variable
):
    """
    Calculate temporal for modis vegetation dataset.

    Parameters
    ----------
    selected_area : ee.FeatureCollection
        Selected area of interest.
    start_date : str
        Start date to calculate baseline.
    end_date : str
        End date to calculate baseline.
    resolution : str
        Temporal resolution: month or year.
    resolution_step : str
        Resolution: 1 for each month or 3 for quarterly.
    variable : str
        Variable to analyze ('EVI', 'NDVI', or 'Bare Ground').

    Returns
    -------
    ee.ImageCollection
    """
    geo = selected_area.geometry().bounds()

    col = get_sentinel_by_resolution(
        geo, start_date, end_date, resolution, resolution_step
    )

    band = variable.lower()
    if band == 'bare ground':
        band = 'bare'
        classifier = train_bgt(
            geo, GEEAsset.fetch_asset_source('random_forest_training')
        )

        def process_image(i):
            bg = classify_bgt(i, classifier).select('bare')
            bg = bg.set(
                'year', i.get('year'),
                'month', i.get('month')
            )
            return bg
        col = col.map(process_image)

    col = col.select(band)
    return col


def calculate_baci(
    locations, reference_layer, variable, temporal_resolution,
    before, after
):
    """
    Calculate Before-After-Control-Impact (BACI) statistics.

    Parameters
    ----------
    locations : List
        Locations to calculate BACI statistics.
    reference_layer : ee.ImageCollection
        Reference layer for the BACI analysis.
    variable : str
        Variable to analyze (e.g., 'EVI', 'NDVI').
    temporal_resolution : str
        Temporal resolution ('Monthly', 'Quarterly', 'Annual').
    before : dict
        Before period dictionary with 'year' and 'month' or 'quarter'.
    after : dict
        After period dictionary with 'year' and 'month' or 'quarter'.

    Returns
    -------
    ee.FeatureCollection
        Features with BACI statistics.
    """
    from analysis.utils import (
        get_date_range_for_analysis
    )
    # Prepare the area of interest
    input_layers = InputLayer()
    selected_geos = input_layers.get_selected_geos()
    communities = input_layers.get_communities()

    features_geo = []
    for location in locations:
        geo = ee.Geometry.Point(
            [location.get('lon'), location.get('lat')]
        )
        features_geo.append(ee.Feature(geo))
    selected_geos = selected_geos.merge(
        ee.FeatureCollection(features_geo)
    )
    select_names = communities.filterBounds(selected_geos).distinct(
        ['Name']
    ).reduceColumns(ee.Reducer.toList(), ['Name']).getInfo()['list']
    select_geo = communities.filter(
        ee.Filter.inList('Name', select_names)
    )
    # add reference layer
    if reference_layer['type'] == 'Polygon':
        ref_layer_geo = ee.Geometry.Polygon(reference_layer['coordinates'])
    else:
        ref_layer_geo = ee.Geometry.MultiPolygon(
            reference_layer['coordinates']
        )
    select_geo = select_geo.merge(
        ee.FeatureCollection([
            ee.Feature(ref_layer_geo, {
                'Name': 'Reference Area',
                'Project': 'Reference Area',
                'area': ref_layer_geo.area().divide(1e6),  # Convert to ha
            })
        ])
    )

    # Calculate date ranges for before and after periods
    before_date_range = get_date_range_for_analysis(
        temporal_resolution,
        before.get('year'),
        before.get('quarter'),
        before.get('month')
    )
    after_date_range = get_date_range_for_analysis(
        temporal_resolution,
        after.get('year'),
        after.get('quarter'),
        after.get('month')
    )

    def process_image(out_variable, i):
        # Reduce the image to the selected geometries
        reduced = i.reduceRegions(
            collection=select_geo,
            reducer=ee.Reducer.mean(),
            scale=120,
            tileScale=4
        )
        # remove geometry from the feature
        reduced = reduced.map(
            lambda ft: ft.setGeometry(None).set({
                out_variable: ft.get('mean'),
                'mean': None
            })
        )
        return reduced

    # Calculate the variable for the before and after periods
    before_col = calculate_temporal_modis_veg(
        select_geo,
        before_date_range['start_date'].isoformat(),
        before_date_range['end_date'].isoformat(),
        before_date_range['resolution'],
        before_date_range['resolution_step'],
        variable
    )
    after_col = calculate_temporal_modis_veg(
        select_geo,
        after_date_range['start_date'].isoformat(),
        after_date_range['end_date'].isoformat(),
        after_date_range['resolution'],
        after_date_range['resolution_step'],
        variable
    )

    # Process the before and after collections into feature collection
    before_map_img = partial(process_image, f'{variable} Before')
    before_col = before_col.map(before_map_img).flatten()
    after_map_img = partial(process_image, f'{variable} After')
    after_col = after_col.map(after_map_img).flatten()

    # Join the before and after collections
    name_filter = ee.Filter.equals(
        leftField='Name',
        rightField='Name'
    )
    inner_join = ee.Join.inner()
    joined_fc = inner_join.apply(
        before_col,
        after_col,
        name_filter
    )
    # flatten the joined features
    select = joined_fc.map(
        lambda f: ee.Feature(f.get('primary'))
                    .copyProperties(ee.Feature(f.get('secondary')))
    )
    return select


def calculate_livestock_baseline(selected_area):
    """
    Calculate livestock baseline for the selected area.

    Parameters
    ----------
    selected_area : ee.Geometry or ee.FeatureCollection
        The area of interest for calculating livestock baseline.

    Returns
    -------
    ee.Image
        An image representing the livestock baseline.
    """
    # Get the livestock density map
    livestock_map = ee.Image(
        GEEAsset.fetch_asset_source('livestock_all_2020')
    ).clip(selected_area)

    # Rename the band to 'LivestockDensity'
    livestock_map = livestock_map.select('b1').rename('LivestockDensity')

    # Reduce the regions to get mean values
    reduced = livestock_map.reduceRegions(
        selected_area,
        ee.Reducer.mean(),
        100
    )
    reduced = reduced.distinct(['Name', 'Area ha'])

    reduced = reduced.map(
        lambda feature: ee.Feature(None, {
            'Name': feature.get('Name'),
            'Livestock Density 2020 head/km2': feature.get('mean')
        })
    )

    return reduced
