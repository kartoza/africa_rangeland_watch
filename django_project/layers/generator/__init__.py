from layers.generator.cgls import CGLSGenerator
from layers.generator.fire_frequency import FireFrequencyGenerator
from layers.generator.grazing_capacity import GrazingCapacityGenerator
from layers.generator.modis_vegetation import ModisVegetationGenerator
from layers.generator.soil_organic_carbon import SoilOrganicCarbonGenerator
from layers.generator.nrt import NearRealTimeGenerator
from layers.generator.livestock import LiveStockGenerator


GENERATOR_CLASSES = [
    CGLSGenerator,
    FireFrequencyGenerator,
    GrazingCapacityGenerator,
    ModisVegetationGenerator,
    SoilOrganicCarbonGenerator,
    LiveStockGenerator,
    NearRealTimeGenerator
]


def run_generate_gee_layers():
    """Generate GEE Layers."""
    from analysis.analysis import initialize_engine_analysis

    # initialize engine
    initialize_engine_analysis()

    for cls in GENERATOR_CLASSES:
        instance = cls()
        instance.generate()
