from unittest.mock import patch, MagicMock
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.test import TestCase
from analysis.models import UserIndicator, UserGEEAsset, GEEAssetType
from analysis.factories import UserIndicatorF, UserGEEAssetF
from core.factories import UserF


class UserIndicatorTest(TestCase):

    def test_map_user_indicator_to_user_gee_asset_filters(self):
        user1 = UserF()
        user2 = UserF()

        # Create indicator for user1
        ind1 = UserIndicatorF(created_by=user1, analysis_types=["Spatial"])
        asset1 = UserGEEAsset.objects.get(key=ind1.config.get('asset_keys', [None])[0])
        asset1.type = GEEAssetType.IMAGE_COLLECTION
        asset1.save()

        # Create indicator for user2 (should not appear in user1's results)
        ind2 = UserIndicatorF(created_by=user2)
        breakpoint()
        asset2 = UserGEEAsset.objects.get(key=ind2.config.get('asset_keys', [None])[0])
        asset2.type = GEEAssetType.IMAGE_COLLECTION
        asset2.save()

        # Create indicator for user1 with different asset type
        ind3 = UserIndicatorF(created_by=user1)
        asset3 = UserGEEAsset.objects.get(key=ind3.config.get('asset_keys', [None])[0])
        asset3.type = GEEAssetType.TABLE
        asset3.save()

        # Create indicator for user1 with limited analysis_types
        ind4 = UserIndicatorF(
            created_by=user1,
            analysis_types=["Baseline"]  # missing "Temporal" & "Spatial"
        )
        asset4 = UserGEEAsset.objects.get(key=ind4.config.get('asset_keys', [None])[0])
        asset4.type = GEEAssetType.IMAGE_COLLECTION
        asset4.save()

        # ---- Test 1: Default (no filters) → should return all user1 indicators except those without assets or invalid analysis types
        result_default = UserIndicator.map_user_indicator_to_user_gee_asset(user1)
        self.assertIn(ind1, result_default)
        self.assertIn(ind3, result_default)  # even with different asset type, no filter yet
        self.assertNotIn(ind2, result_default)  # belongs to user2

        # ---- Test 2: Filter by asset_types → only ImageCollection assets remain
        result_asset_filter = UserIndicator.map_user_indicator_to_user_gee_asset(
            user1, asset_types=[GEEAssetType.IMAGE_COLLECTION]
        )
        self.assertIn(ind1, result_asset_filter)
        self.assertNotIn(ind3, result_asset_filter)  # type mismatch (Table)

        # ---- Test 3: Filter by analysis_types → only those with exactly these types remain
        result_analysis_filter = UserIndicator.map_user_indicator_to_user_gee_asset(
            user1, analysis_types=["Baseline"]
        )
        self.assertIn(ind4, result_analysis_filter)  # has Baseline
        self.assertNotIn(ind1, result_analysis_filter)  # only has Spatial types

    @patch.object(GEEAssetType, "get_ee_asset_class")
    def test_map_user_indicator_to_gee_object(self, mock_get_class):
        # Prepare mocks
        mock_gee_class = MagicMock()
        mock_gee_instance = MagicMock()
        mock_selected = MagicMock()
        mock_gee_instance.select.return_value = mock_selected
        mock_gee_class.return_value = mock_gee_instance
        mock_get_class.return_value = mock_gee_class

        user = UserF()
        indicator = UserIndicatorF(created_by=user)
        asset = indicator.created_by.gee_assets.get(
            key=indicator.config["asset_keys"][0]
        )

        # --- No asset_types filter ---
        result = UserIndicator.map_user_indicator_to_gee_object(user)
        self.assertIn(indicator, result)
        self.assertIs(result[indicator], mock_selected)
        mock_get_class.assert_called_with(asset)
        mock_gee_instance.select.assert_called_with(asset.metadata["band_names"][0])

        # --- Filter matches asset type ---
        mock_get_class.reset_mock()
        mock_gee_instance.select.reset_mock()

        result_filtered = UserIndicator.map_user_indicator_to_gee_object(
            user, asset_types=[asset.type]
        )
        self.assertIn(indicator, result_filtered)
        mock_get_class.assert_called_with(asset)

        # --- Filter does not match asset type ---
        result_empty = UserIndicator.map_user_indicator_to_gee_object(
            user, asset_types=["table"]  # not matching the asset type
        )
        self.assertEqual(result_empty, {})

    def test_create_allows_unique_name_per_user(self):
        user1 = UserF()
        user2 = UserF()

        # Same name, different user → should work
        UserIndicatorF(name="test-indicator", created_by=user1)
        try:
            UserIndicatorF(name="test-indicator", created_by=user2)
        except ValidationError:
            self.fail("ValidationError raised unexpectedly for different users")

    def test_create_fails_on_duplicate_name_same_user(self):
        user = UserF()
        UserIndicatorF.create(name="dup-name", created_by=user)

        with self.assertRaises(IntegrityError):
            # Second indicator with same name and user should fail
            ind = UserIndicatorF.create(name="dup-name", created_by=user)
