import datetime
import time
import base64

import ee
import os

SERVICE_ACCOUNT_KEY = os.environ.get('SERVICE_ACCOUNT_KEY', '')
SERVICE_ACCOUNT = os.environ.get('SERVICE_ACCOUNT', '')

TRAINING_DATA_ASSET_PATH = os.environ.get(
    'TRAINING_DATA_ASSET_PATH',
    ''
)

# Sentinel-2 bands and names
S2_BANDS = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B11', 'B12']
S2_NAMES = [
    'cb', 'blue', 'green', 'red', 'R1', 'R2', 'R3', 'nir', 'swir1', 'swir2']

# Bands to select after processing
select_bands = [
    'blue', 'green', 'red', 'R2', 'nir', 'swir1', 'ndvi', 'nbr', 'evi']


# Dictionary converting quarter strings to start months
quarter_dict = {
  '01': 1,
  '02':4,
  '03':7,
  '04':10
}


class InputLayer:
    
    def __init__(self):
        self.countries = self.get_countries()

    # Get pre-exported baseline statistics for project areas
    def get_baseline_table(self):
        """
        Get baseline feature collection for GEE analysis
        """
        baselineTable = ee.FeatureCollection('projects/ee-yekelaso1818/assets/CSA/Baseline_pre_export_20241007')
        return baselineTable

    def get_temporal_table(self):
        """
        Get temporal table for GEE analysis
        """
        # Get the pre-exported time series statistics for project areas
        temporal_table = ee.FeatureCollection('projects/ee-yekelaso1818/assets/CSA/Temporal_pre_export_20241007')

        # Format the table correctly
        temporal_table = temporal_table.select(
            ['Name', 'ndvi', 'evi', 'bare', 'year', 'month'],
            ['Name', 'NDVI', 'EVI', 'Bare ground', 'year', 'month']
        )

        # Map function to create a 'date' property
        def add_date(ft):
            date = ee.Date.parse('yyyy-MM-dd', ee.String(ft.get('year')).cat(ee.String('-01-01'))).advance(
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

        # Process the results
        groups = ee.List(temporal_table_yr.get('groups'))
        temporal_table_yr = groups.map(lambda g: (
            ee.List(ee.Dictionary(g).get('groups'))
            .map(lambda i: (
                ee.Feature(None, {
                    "Name": ee.Dictionary(i).get('Name'),
                    "year": ee.Dictionary(g).get('year'),
                    "NDVI": ee.List(ee.Dictionary(i).get('mean')).get(0),
                    "EVI": ee.List(ee.Dictionary(i).get('mean')).get(1),
                    "Bare ground": ee.List(ee.Dictionary(i).get('mean')).get(2)
                })
            ))
        ).flatten())

        # Convert the list to a FeatureCollection
        temporal_table_yr = ee.FeatureCollection(temporal_table_yr)

        # Add date property and sort
        def add_date_property(ft):
            date = ee.Date.parse('yyyy-MM-dd', ee.String(ft.get('year')).cat(ee.String('-01-01')))
            return ft.set('date', date.millis())

        temporal_table_yr = temporal_table_yr.map(add_date_property)
        temporal_table_yr = temporal_table_yr.sort(['Name', 'date'])
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
        communities = ee.FeatureCollection('projects/ee-yekelaso1818/assets/CSA/CSA_master_20241007')
        communities = communities.map(lambda ft: ft.set('area', ft.geometry().area().divide(ee.Number(10000))))
        communities = communities.select(['Name', 'Project', 'area'])
        return communities

    def get_countries(self):
        """
        Get countries for clipping images
        """
        names = ['SOUTH AFRICA', 'LESOTHO', 'SWAZILAND', 'NAMIBIA', 'ZIMBABWE', 'BOTSWANA', 'MOZAMBIQUE', 'ZAMBIA']
        countries = ee.FeatureCollection('USDOS/LSIB/2013').filter(ee.Filter.inList('name', names))
        return countries

    def get_cropland_urban_mask(self):
        """
        Get Cropland and urban mask
        """
        glc_coll = ee.ImageCollection('users/cgmorton/GlobeLand30')
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
        bg = col.select('bare-coverfraction').add(col.select('urban-coverfraction'))
        t = col.select('tree-coverfraction').add(col.select('shrub-coverfraction'))
        g = col.select('grass-coverfraction')
        return (bg.rename(['bg'])
                .addBands(t.rename(['t']))
                .addBands(g.rename(['g']))
                .copyProperties(col)
                .set('year', ee.Number.parse(col.get('system:index'))))

    def get_soil_carbon(self):
        """
        Get image for soil carbon mean.
        """
        # Coast fragment fraction 0-1
        cfvo = (ee.Image('users/zandersamuel/SA_misc/Soilgrids_CFVO')
                .selfMask()
                .rename('soil_cfvo')
                .divide(1000))

        cfvo2 = (ee.Image("ISDASOIL/Africa/v1/stone_content")
                 .select('mean_0_20')
                 .rename('soil_cfvo')
                 .divide(100))

        cfvo = ee.ImageCollection([cfvo2.float(), cfvo.float()]).mosaic()

        # Additional SOC data from iSDA dataset for the rest of Africa
        # Convert to SOC stocks using bulk density, fraction coarse fragments
        # Fill in gaps with SoilGrids

        isda = ee.Image("users/zandersamuel/Africa_misc/iSDA_SOC_m_30m_0_20cm_2001_2017_v0_13_wgs84")
        isda = ee.Image(isda.divide(10)).exp().subtract(1)
        # Soil bulk density (fine earth) g/m³
        bd = (ee.Image("users/zandersamuel/SA_misc/SoilGrids_BD")
              .rename('soil_bd')
              .selfMask()
              .divide(100))

        bd2 = (ee.Image("ISDASOIL/Africa/v1/bulk_density")
               .select('mean_0_20')
               .rename('soil_bd')
               .divide(100))
        bd = ee.ImageCollection([bd2.float(), bd.float()]).mosaic()
        isda = (isda.multiply(bd)
                .multiply(ee.Image(1).subtract(cfvo))
                .multiply(0.6)
                .rename('SOC'))

        soc_col = self.get_soc_col()
        lt_mean = (soc_col
                   # Uncomment the following line to filter years if necessary
                   # .filterMetadata('year', 'greater_than', 2000)
                   .select(1).median().rename('SOC'))

        # Get mean SOC from Venter et al and iSDA
        soc_lt_mean = ee.ImageCollection([isda.float(), lt_mean.float()]).mean()
        soc_lt_mean = soc_lt_mean.clipToCollection(self.countries)
        return soc_lt_mean

    def get_grazing_capacity(self):
        """
        Get grazing capacity image, clipped by country.
        """
        masked = self.get_cropland_urban_mask()

        # Import pre-exported grazing capacity map
        grazing_capacity = ee.Image('users/zandersamuel/Consult_CSA/grazingCapacity_srnAfrica_LSU_ha')
        grazing_capacity = grazing_capacity.rename('grazingCap')
        grazing_capacity = (grazing_capacity
                            .updateMask(masked)
                            .unmask(0)
                            .clipToCollection(self.countries))
        return grazing_capacity

    def get_soc_col(self):
        """
        Get soil organic carbon data.
        """
        # Import soil organic carbon data from Venter et al. 2021
        # https://www.sciencedirect.com/science/article/pii/S0048969721004526
        soc_col = ee.ImageCollection("users/grazingresearch/Collaboration/Soil_C/predictions2")

        def process_image(i):
            i = i.divide(ee.Image(1000)).copyProperties(i)
            year = ee.Number(i.get('year'))
            return ee.Image(year).int().addBands(i).set('year', year)

        soc_col = soc_col.map(process_image)
        return soc_col

    def get_soil_carbon_change(self):
        """
        Get soil carbon change, clipped by countries.
        """
        # SOC mean
        soc_col = self.get_soc_col()

        # SOC trend
        trend_sens_img = soc_col.reduce(ee.Reducer.sensSlope())
        trend_sens_img = trend_sens_img.rename(['scale', 'offset'])

        soc_lt_trend = trend_sens_img.select('scale').multiply(35).clipToCollection(self.countries)
        return soc_lt_trend

    def get_spatial_layer_dict(self):
        """
        Get spatial layer dictionary.
        """
        # Get MODIS vegetation data
        modis_veg = (ee.ImageCollection("MODIS/061/MOD13Q1")
                     .filterDate('2016-01-01', '2020-01-01')
                     .select(['NDVI', 'EVI'])
                     .map(lambda i: i.divide(10000)))

        evi_baseline = modis_veg.select('EVI').median().clipToCollection(self.countries)
        ndvi_baseline = modis_veg.select('NDVI').median().clipToCollection(self.countries)

        # Get fractional ground cover from CGLS
        cgls_col = (ee.ImageCollection("COPERNICUS/Landcover/100m/Proba-V-C3/Global")
                    .select(['bare-coverfraction', 'crops-coverfraction', 'urban-coverfraction',
                             'shrub-coverfraction', 'grass-coverfraction', 'tree-coverfraction'])
                    .filterBounds(self.countries))

        cgls_col = cgls_col.map(self._process_cgls)
        cgls = cgls_col.median()
        bg = cgls.select('bg').clipToCollection(self.countries)
        t = cgls.select('t').clipToCollection(self.countries)
        g = cgls.select('g').clipToCollection(self.countries)

        grazing_capacity = self.get_grazing_capacity()
        soc_lt_mean = self.get_soil_carbon()
        soc_lt_trend = self.get_soil_carbon_change()

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


def get_rel_diff(spatial_layer_dict: dict, analysis_dict: dict, reference_layer: dict):
    """
    Get relative difference between reference layer and
    """
    # Select the image layer from the spatial layer dictionary based on the variable in analysisDict
    img_select = spatial_layer_dict[analysis_dict['variable']]
    img_select = img_select.rename('val')

    geo_manual = ee.Geometry.Polygon(reference_layer['coordinates'])

    # Calculate mean using reduceRegion
    red = img_select.reduceRegion(
        reducer=ee.Reducer.mean(),
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


def run_analysis(lat: float, lon: float, analysis_dict: dict, *args, **kwargs):
    """
    Run baseline, spatial, and temporal analysis

    :param lat: Latitude
    :param lon: Longitude
    :param analysis_dict: Analysis Dictionary
    """

    input_layers = InputLayer()
    selected_geos = input_layers.get_selected_geos()
    communities = input_layers.get_communities()
    baseline_table = input_layers.get_baseline_table()

    geo = ee.Geometry.Point([lon, lat])
    selected_geos = selected_geos.merge(ee.FeatureCollection([ee.Feature(geo)]))
    select_names = communities.filterBounds(selected_geos).distinct(['Name']).reduceColumns(ee.Reducer.toList(), ['Name'])

    if analysis_dict['analysisType'] == "Spatial":
        reference_layer = kwargs.get('reference_layer', None)
        if not reference_layer:
            raise ValueError("Reference layer not provided")
        rel_diff = get_rel_diff(input_layers.get_spatial_layer_dict(), analysis_dict, reference_layer)
        reduced = rel_diff.reduceRegions(
            collection=communities.filterBounds(selected_geos),
            reducer=ee.Reducer.mean(),
            scale=60,
            tileScale=4
        )
        return reduced.getInfo()

    if analysis_dict['analysisType'] == "Baseline":
        select = baseline_table.filterBounds(selected_geos)
        return select.getInfo()

    if analysis_dict['analysisType'] == "Temporal":
        res = analysis_dict['t_resolution']
        baseline_yr = int(analysis_dict['Temporal']['Annual']['ref'])
        test_yr = int(analysis_dict['Temporal']['Annual']['test'])

        if res == "Quarterly":
            landscapes_dict = input_layers.get_landscape_dict()
            temporal_table, temporal_table_yr = input_layers.get_temporal_table()
            if analysis_dict['Temporal']['Annual']['ref'] == "2023" or analysis_dict['Temporal']['Annual']['test'] == "2023":
                new_stats = get_latest_stats(landscapes_dict[analysis_dict['landscape']],
                                             communities.filterBounds(selected_geos))
                new_stats = new_stats.select(['Name', 'ndvi', 'evi', 'bare', 'year', 'month'],
                                             ['Name', 'NDVI', 'EVI', 'Bare ground', 'year', 'month'])
                new_stats = new_stats.map(lambda ft: ft.set('date', ee.Date.parse('yyyy-mm-dd',
                                                                                  ee.String(ft.get('year')).cat(
                                                                                      ee.String('-01-01'))).advance(
                    ee.Number(ft.get('month')), 'months').millis()))
                temporal_table = temporal_table.merge(new_stats)
                print('updated Temporal table', temporal_table)

            baseline_quart = quarter_dict[analysis_dict['Temporal']['Quarterly']['ref']]
            test_quart = quarter_dict[analysis_dict['Temporal']['Quarterly']['test']]

            to_plot = temporal_table.filter(ee.Filter.inList('Name', select_names)).filter(ee.Filter.Or(
                ee.Filter.And(ee.Filter.eq('year', baseline_yr), ee.Filter.eq('month', baseline_quart)),
                ee.Filter.And(ee.Filter.eq('year', test_yr), ee.Filter.eq('month', test_quart))
            ))
        else:
            to_plot = temporal_table_yr.filter(ee.Filter.inList('Name', select_names)).filter(
                ee.Filter.inList('year', [baseline_yr, test_yr]))

        to_plot = to_plot.sort('Name').sort('date')


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


def get_s2_cloud_masked(aoi, start_date, end_date):
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
    s2_sr = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(aoi) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20))

    s2_clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY') \
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
        is_not_cloud = cloud_prob.select('probability').lt(30)
        return img.updateMask(
            is_not_cloud
        ).copyProperties(img, img.propertyNames())

    s2_sr_with_cloud_mask = ee.ImageCollection(joined.map(merge_bands))

    s2 = s2_sr_with_cloud_mask \
        .select(S2_BANDS, S2_NAMES) \
        .map(add_indices)

    return s2.select(select_bands)


def get_nrt_sentinel(aoi, months):
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

    Returns
    -------
    ee.Image
        A near real-time median Sentinel-2 image over the specified area.

    Example
    -------
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.1, -0.9])
    >>> # Get a near real-time image over the past 2 months
    >>> nrt_image = get_nrt_sentinel(aoi, months=2)
    """
    col = get_s2_cloud_masked(
        aoi, '2022-06-01', '2025-01-01')
    now_dt = ee.Date(datetime.datetime.now(datetime.UTC))
    nrt_img = col.filterDate(
        now_dt.advance(-months, 'month'), now_dt).median()
    return nrt_img


def quarterly_medians(collection, date_start, unit, step, reducer):
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

    end_date = ee.Date(collection.sort(
        'system:time_start', False).first().get('system:time_start'))
    end_date = end_date.advance(
        ee.Number(0).subtract(end_date.getRelative('month', unit)), 'month') \
        .advance(1, unit).advance(-1, 'month') \
        .update(None, None, None, 23, 59, 59)

    date_ranges = ee.List.sequence(
        0, end_date.difference(
            start_date, unit).round().subtract(1))

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


def train_bgt(aoi, training_path = TRAINING_DATA_ASSET_PATH):
    """
    Trains a Random Forest classifier to estimate
     bare ground, tree, and grass cover fractions.

    Parameters
    ----------
    aoi : ee.Geometry
        The area of interest over which to filter the training data.
    training_path : str
        The training data asset path. Default to TRAINING_DATA_ASSET_PATH.

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
    >>> # Define an area of interest
    >>> aoi = ee.Geometry.Rectangle([30.0, -1.0, 30.1, -0.9])
    >>> # Train the classifier
    >>> classifier = train_bgt(aoi)
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
    classifier = train_bgt(geo)

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
    task = ee.batch.Export.image.toDrive(
        image=image.visualize(**vis_params) if vis_params else image,
        description=description,
        folder=folder,
        fileNamePrefix=file_name_prefix,
        scale=scale,
        region=region,
        maxPixels=max_pixels
    )

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
