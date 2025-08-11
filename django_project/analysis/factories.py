import factory
from analysis.models import UserIndicator, UserGEEAsset, IndicatorSource, GEEAssetType
from core.factories import UserF


class UserGEEAssetF(factory.django.DjangoModelFactory):
    class Meta:
        model = UserGEEAsset

    key = factory.Sequence(lambda n: f"asset_key_{n}")
    created_by = factory.SubFactory(UserF)
    type = GEEAssetType.IMAGE_COLLECTION
    source = factory.Sequence(lambda n: f"projects/sample/source_{n}")
    metadata = factory.LazyFunction(lambda: {"band_names": ["band1"]})


class UserIndicatorF(factory.django.DjangoModelFactory):
    class Meta:
        model = UserIndicator

    name = factory.Sequence(lambda n: f"user_indicator_{n}")
    variable_name = factory.Sequence(lambda n: f"user_indicator_{n}")
    created_by = factory.SubFactory(UserF)
    analysis_types = ["Baseline", "Temporal", "Spatial"]
    temporal_resolutions = ["Annual", "Quarterly", "Monthly"]
    metadata = factory.LazyFunction(dict)
    config = factory.LazyAttribute(lambda o: {"asset_keys": []})
    source = IndicatorSource.OTHER

    @factory.post_generation
    def set_asset_keys(obj, create, extracted, **kwargs):
        if not create:
            return

        # Create matching UserGEEAsset for same user
        gee_asset = UserGEEAssetF(created_by=obj.created_by)
        obj.config["asset_keys"].append(gee_asset.key)
        obj.save()
