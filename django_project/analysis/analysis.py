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
selectBands = [
    'blue', 'green', 'red', 'R2', 'nir', 'swir1', 'ndvi', 'nbr', 'evi']


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

    return s2.select(selectBands)


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
    sent_quarterly = sent_quarterly.map(lambda i: i.rename(selectBands))
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
        inputProperties=selectBands
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
