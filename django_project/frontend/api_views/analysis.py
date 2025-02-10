# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import uuid
from collections import OrderedDict
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis,
    get_rel_diff,
    InputLayer
)


class AnalysisAPI(APIView):
    """API to do analysis."""

    permission_classes = [IsAuthenticated]

    def run_baseline_analysis(self, data):
        """Run the baseline analysis."""
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Baseline',
            'variable': data['landscape'],
            't_resolution': '',

            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }
        initialize_engine_analysis()
        return run_analysis(
            lon=float(data['longitude']),
            lat=float(data['latitude']),
            analysis_dict=analysis_dict
        )

    def _combine_temporal_analysis_results(self, years, input_results):
        def merge_and_sort(arrays):
            unique_dict = {}

            for array in arrays:
                for item in array['features']:
                    key = (
                        f"{item['properties']['Name']}-"
                        f"{item['properties']['date']}"
                    )
                    # Overwrites duplicates, ensuring uniqueness
                    unique_dict[key] = item
            return list(unique_dict.values())

        def add_empty_records(existing_records):
            new_records = {}
            for year in years:
                has_record = len(
                    list(
                        filter(
                            lambda x: x['properties']['year'] == year,
                            existing_records
                        )
                    )
                ) > 0
                if not has_record:
                    for record in existing_records:
                        key = f'{record["properties"]["Name"]}-{year}'
                        if key not in new_records:
                            new_record = deepcopy(record)
                            new_record['properties']['year'] = year
                            new_record['properties']['Bare ground'] = None
                            new_record['properties']['EVI'] = None
                            new_record['properties']['NDVI'] = None
                            new_records[key] = new_record
            return new_records.values()

        def add_statistics(features):
            bare_grounds = {}
            evi = {}
            ndvi = {}
            
            new_features = [a['properties']  for a in filter(lambda x: x['properties']['year'] in years, features)]

            # Process data
            aggregated = {}

            for row in new_features:
                name, year = row["Name"], int(row["year"])

                # Convert numeric values
                bare_ground = row["Bare ground"]
                evi = row["EVI"]
                ndvi = row["NDVI"]

                key = (name, year)
                if key not in aggregated:
                    aggregated[key] = {"Bare ground": [], "EVI": [], "NDVI": []}

                aggregated[key]["Bare ground"].append(bare_ground)
                aggregated[key]["EVI"].append(evi)
                aggregated[key]["NDVI"].append(ndvi)

            # Compute min, max, and mean
            results = {}
            unprocessed_years = years
            names = set()

            for location_year, values in aggregated.items():
                location, year = location_year
                if year in unprocessed_years:
                    unprocessed_years.remove(year)
                names.add(location)
                if year not in results:
                    results[year] = {}
                if location not in results[year]:
                    results[year][location] = {}
                
                for category, numbers in values.items():
                    min_val = min(numbers)
                    max_val = max(numbers)
                    mean_val = sum(numbers) / len(numbers)
                    results[year][location][category] = {
                        'min': min_val,
                        'max': max_val,
                        'mean': mean_val
                    }

            for year in unprocessed_years:
                for name in names:
                    if results.get(year, None):
                        results[year].update({
                            name: {
                                'Bare ground': {'min': None, 'max': None, 'mean': None},
                                'EVI': {'min': None, 'max': None, 'mean': None},
                                'NDVI': {'min': None, 'max': None, 'mean': None},
                            }
                        })
                    else:
                        results[year] = {
                            name: {
                                'Bare ground': {'min': None, 'max': None, 'mean': None},
                                'EVI': {'min': None, 'max': None, 'mean': None},
                                'NDVI': {'min': None, 'max': None, 'mean': None},
                            }
                        }
            
            results = {year: {name: OrderedDict(sorted(value.items())) for name, value in sorted(group.items())}
               for year, group in sorted(results.items())}
            
            return results

        output_results = []
        output_results.append(input_results[0][0])
        output_results.append(input_results[0][1])
        output_results[0]['features'] = merge_and_sort(
            [ir[0] for ir in input_results]
        )

        output_results[0]['features'].extend(
            add_empty_records(output_results[1]['features'])
        )
        # add empty result if no data exist for certain year
        output_results[1]['features'] = merge_and_sort(
            [ir[1] for ir in input_results]
        )

        output_results[0]['features'] = sorted(
            output_results[0]['features'],
            key=lambda x: x['properties']['date']
        )
        output_results[1]['features'] = sorted(
            output_results[1]['features'],
            key=lambda x: x['properties']['date']
        )
        output_results[0]['statistics'] = add_statistics(output_results[1]['features'])

        return output_results

    def run_temporal_analysis(self, data):
        """Run the temporal analysis."""
        analysis_dict_list = []
        comp_years = data['comparisonPeriod']['year']
        comp_quarters = data['comparisonPeriod'].get('quarter', [])
        if len(comp_years) == 0:
            comp_quarters = [None] * len(comp_years)

        analysis_dict_list = []
        for idx, comp_year in enumerate(comp_years):
            analysis_dict = {
                'landscape': data['landscape'],
                'analysisType': 'Temporal',
                'variable': data['variable'],
                't_resolution': data['temporalResolution'],
                'Temporal': {
                    'Annual': {
                        'ref': data['period']['year'],
                        'test': comp_year
                    },
                    'Quarterly': {
                        'ref': data['period'].get('quarter', ''),
                        'test': (
                            comp_quarters[idx] if
                            len(comp_quarters) > 0 else ''
                        ),
                    }
                },
                'Spatial': {
                    'Annual': '',
                    'Quarterly': ''
                }
            }
            analysis_dict_list.append(analysis_dict)

        # initialize_engine_analysis()

        # results = []
        # # Run analyses in parallel using ThreadPoolExecutor
        # with ThreadPoolExecutor() as executor:
        #     # Submit tasks to the executor
        #     futures = [
        #         executor.submit(
        #             run_analysis,
        #             data['latitude'],
        #             data['longitude'],
        #             analysis_dict
        #         ) for analysis_dict in analysis_dict_list
        #     ]
        #     # Collect results as they complete
        #     results = [future.result() for future in futures]

        results = [[{"type":"FeatureCollection","columns":{"Bare ground":"Float","EVI":"Float","NDVI":"Float","Name":"String","date":"Long","system:index":"String","year":"Integer"},"features":[]},{"type":"FeatureCollection","columns":{"date":"Long"},"version":1733164362540944,"id":"projects/ee-yekelaso1818/assets/Temporal_pre_export_20241202","properties":{"system:asset_size":705844},"features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000987","properties":{"Bare ground":8.893449984668786,"EVI":0.85495483701733,"NDVI":0.5472915756967119,"Name":"BNP western polygon","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000965","properties":{"Bare ground":6.9157784025488205,"EVI":0.8978971424016382,"NDVI":0.5698814413997015,"Name":"LNP-BNP corridor","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009af","properties":{"Bare ground":3.582137172215512,"EVI":0.6505001129552291,"NDVI":0.4509795054381152,"Name":"BNP western polygon","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"0000000000000000098d","properties":{"Bare ground":4.335482146923094,"EVI":0.6584149326273582,"NDVI":0.4553191831424044,"Name":"LNP-BNP corridor","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009d7","properties":{"Bare ground":10.41642687996423,"EVI":0.42358333850631447,"NDVI":0.307281229635695,"Name":"BNP western polygon","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009b5","properties":{"Bare ground":10.339850543856336,"EVI":0.4130831735214416,"NDVI":0.3011000263468115,"Name":"LNP-BNP corridor","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009ff","properties":{"Bare ground":10.253488026850588,"EVI":0.3643776400460183,"NDVI":0.2672656418779298,"Name":"BNP western polygon","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009dd","properties":{"Bare ground":10.71375079376716,"EVI":0.38440919383301225,"NDVI":0.28134231334785037,"Name":"LNP-BNP corridor","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a27","properties":{"Bare ground":8.07232248044919,"EVI":0.6509225780859329,"NDVI":0.4425926467561585,"Name":"BNP western polygon","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a05","properties":{"Bare ground":8.149968272128243,"EVI":0.6522625611700374,"NDVI":0.44357560098316007,"Name":"LNP-BNP corridor","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a4f","properties":{"Bare ground":4.850705262826095,"EVI":0.6191915082424767,"NDVI":0.4325149258415639,"Name":"BNP western polygon","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a2d","properties":{"Bare ground":4.724748271496909,"EVI":0.6685569411743395,"NDVI":0.4610820809502188,"Name":"LNP-BNP corridor","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a77","properties":{"Bare ground":9.013722945173678,"EVI":0.31973713022641653,"NDVI":0.23851828034529635,"Name":"BNP western polygon","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a55","properties":{"Bare ground":9.696750734065605,"EVI":0.35405894316592207,"NDVI":0.26325106141786253,"Name":"LNP-BNP corridor","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a9f","properties":{"Bare ground":14.212245667014576,"EVI":0.28852891169927586,"NDVI":0.21244138292207776,"Name":"BNP western polygon","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a7d","properties":{"Bare ground":12.897315778002504,"EVI":0.3327049879568159,"NDVI":0.2438148673862133,"Name":"LNP-BNP corridor","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ac7","properties":{"Bare ground":11.717480507578788,"EVI":0.6700598919557141,"NDVI":0.447952767416284,"Name":"BNP western polygon","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aa5","properties":{"Bare ground":11.20285511774706,"EVI":0.6666525261810323,"NDVI":0.4465404797702888,"Name":"LNP-BNP corridor","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aef","properties":{"Bare ground":10.113485493766031,"EVI":0.48908124893112664,"NDVI":0.34783003393759643,"Name":"BNP western polygon","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000acd","properties":{"Bare ground":7.986628491059495,"EVI":0.5348649073356715,"NDVI":0.3790769842043263,"Name":"LNP-BNP corridor","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b17","properties":{"Bare ground":10.09992694946952,"EVI":0.3163713689143198,"NDVI":0.232912112661022,"Name":"BNP western polygon","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000af5","properties":{"Bare ground":10.4541158821234,"EVI":0.34769497698243307,"NDVI":0.25595327439033866,"Name":"LNP-BNP corridor","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b3f","properties":{"Bare ground":21.859149759713823,"EVI":0.3434291317339757,"NDVI":0.24763109735052877,"Name":"BNP western polygon","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b1d","properties":{"Bare ground":14.765066150291531,"EVI":0.33131014043676366,"NDVI":0.2419575161875235,"Name":"LNP-BNP corridor","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b67","properties":{"Bare ground":18.171063410972977,"EVI":0.5500698600829751,"NDVI":0.3786849487930583,"Name":"BNP western polygon","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b45","properties":{"Bare ground":13.254429365993046,"EVI":0.6069232404507992,"NDVI":0.4141219093481184,"Name":"LNP-BNP corridor","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b8f","properties":{"Bare ground":10.575828273142472,"EVI":0.5483092333855671,"NDVI":0.38225614760487775,"Name":"BNP western polygon","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b6d","properties":{"Bare ground":6.1019851450599445,"EVI":0.6415924822340123,"NDVI":0.4423364987999644,"Name":"LNP-BNP corridor","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bb7","properties":{"Bare ground":10.50195669789604,"EVI":0.33556730199309626,"NDVI":0.24533966577054345,"Name":"BNP western polygon","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b95","properties":{"Bare ground":9.885546119016215,"EVI":0.4009636544148326,"NDVI":0.2923558649032758,"Name":"LNP-BNP corridor","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bdf","properties":{"Bare ground":18.56952173895803,"EVI":0.409730124052845,"NDVI":0.2927925155914573,"Name":"BNP western polygon","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bbd","properties":{"Bare ground":14.847752440276244,"EVI":0.48371560435242394,"NDVI":0.34266557663310115,"Name":"LNP-BNP corridor","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c07","properties":{"Bare ground":4.437298239416296,"EVI":0.8726658352741172,"NDVI":0.5593752230406576,"Name":"BNP western polygon","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000be5","properties":{"Bare ground":4.13053036891886,"EVI":0.9064405493925978,"NDVI":0.5781667660710791,"Name":"LNP-BNP corridor","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c2f","properties":{"Bare ground":3.2444857283541513,"EVI":0.7133116024088906,"NDVI":0.48492134533596626,"Name":"BNP western polygon","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c0d","properties":{"Bare ground":3.799966937302881,"EVI":0.744467429704249,"NDVI":0.5052728261257683,"Name":"LNP-BNP corridor","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c57","properties":{"Bare ground":6.147844186365297,"EVI":0.5038093873100171,"NDVI":0.3618628340216633,"Name":"BNP western polygon","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c35","properties":{"Bare ground":5.805105762873004,"EVI":0.5277682596803768,"NDVI":0.37768481451688096,"Name":"LNP-BNP corridor","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c7f","properties":{"Bare ground":10.807019345967722,"EVI":0.4539338189166745,"NDVI":0.3232581861712215,"Name":"BNP western polygon","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c5d","properties":{"Bare ground":9.780923628192127,"EVI":0.47829539559978695,"NDVI":0.33965212467334865,"Name":"LNP-BNP corridor","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ca7","properties":{"Bare ground":55.22865956621969,"EVI":0.389655693889272,"NDVI":0.2655679349038552,"Name":"BNP western polygon","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c85","properties":{"Bare ground":51.584680539505655,"EVI":0.42985678176581343,"NDVI":0.2902686021664811,"Name":"LNP-BNP corridor","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ccf","properties":{"Bare ground":56.647643454528605,"EVI":0.3399350298480299,"NDVI":0.23750892284818048,"Name":"BNP western polygon","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cad","properties":{"Bare ground":53.35714117476383,"EVI":0.3592930681042307,"NDVI":0.2500771738504254,"Name":"LNP-BNP corridor","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cf7","properties":{"Bare ground":72.93383272802524,"EVI":0.183448332273246,"NDVI":0.13247247608605614,"Name":"BNP western polygon","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cd5","properties":{"Bare ground":70.50330035504847,"EVI":0.2032394114462235,"NDVI":0.1463864010468255,"Name":"LNP-BNP corridor","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d1f","properties":{"Bare ground":72.39515129830308,"EVI":0.2552577689082169,"NDVI":0.17875530223893557,"Name":"BNP western polygon","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cfd","properties":{"Bare ground":72.96367200606471,"EVI":0.22855014733325024,"NDVI":0.16169861988365686,"Name":"LNP-BNP corridor","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d47","properties":{"Bare ground":52.76706521868143,"EVI":0.4336104423010979,"NDVI":0.29085180538808547,"Name":"BNP western polygon","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d25","properties":{"Bare ground":51.06835322710476,"EVI":0.45876673561497056,"NDVI":0.30616766282703173,"Name":"LNP-BNP corridor","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d6f","properties":{"Bare ground":52.135433862823426,"EVI":0.4009300331093532,"NDVI":0.27402443067258586,"Name":"BNP western polygon","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d4d","properties":{"Bare ground":50.6491515903907,"EVI":0.4140568230811021,"NDVI":0.282101924953775,"Name":"LNP-BNP corridor","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d97","properties":{"Bare ground":68.49173938590198,"EVI":0.23985620226988472,"NDVI":0.17076024577827417,"Name":"BNP western polygon","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d75","properties":{"Bare ground":67.14160809790961,"EVI":0.23706833757979964,"NDVI":0.1688088953527196,"Name":"LNP-BNP corridor","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dbf","properties":{"Bare ground":68.33505061753569,"EVI":0.2991483985163314,"NDVI":0.20830436421731896,"Name":"BNP western polygon","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d9d","properties":{"Bare ground":63.95183503748443,"EVI":0.32310868032915535,"NDVI":0.22396811733415012,"Name":"LNP-BNP corridor","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000de7","properties":{"Bare ground":53.97223713166712,"EVI":0.4021480764808842,"NDVI":0.27332291810978976,"Name":"BNP western polygon","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dc5","properties":{"Bare ground":52.6240139214611,"EVI":0.4170302911299164,"NDVI":0.28286569975419323,"Name":"LNP-BNP corridor","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e0f","properties":{"Bare ground":62.697068465921205,"EVI":0.2988471024157962,"NDVI":0.210261995535399,"Name":"BNP western polygon","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ded","properties":{"Bare ground":63.256588588460765,"EVI":0.28213867827221134,"NDVI":0.19957875695576272,"Name":"LNP-BNP corridor","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e37","properties":{"Bare ground":72.99486542639475,"EVI":0.1795342195640924,"NDVI":0.12992252169056565,"Name":"BNP western polygon","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e15","properties":{"Bare ground":71.73268888831296,"EVI":0.18114834741147176,"NDVI":0.13116392448145545,"Name":"LNP-BNP corridor","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e5f","properties":{"Bare ground":78.27042110213783,"EVI":0.15672573845518878,"NDVI":0.11339400229322094,"Name":"BNP western polygon","date":1730419200000,"month":10,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e3d","properties":{"Bare ground":76.1038778776049,"EVI":0.16871120900712097,"NDVI":0.12202709732357143,"Name":"LNP-BNP corridor","date":1730419200000,"month":10,"year":2024}}]}],[{"type":"FeatureCollection","columns":{"Bare ground":"Float","EVI":"Float","NDVI":"Float","Name":"String","date":"Long","system:index":"String","year":"Integer"},"features":[{"type":"Feature","geometry":None,"id":"3355","properties":{"Bare ground":64.30132176176915,"EVI":0.2920742062296912,"NDVI":0.20357615901925685,"Name":"BNP western polygon","date":1640995200000,"year":2022}},{"type":"Feature","geometry":None,"id":"3540","properties":{"Bare ground":62.10219851884567,"EVI":0.30523485216237944,"NDVI":0.21210769923684722,"Name":"LNP-BNP corridor","date":1640995200000,"year":2022}}]},{"type":"FeatureCollection","columns":{"date":"Long"},"version":1733164362540944,"id":"projects/ee-yekelaso1818/assets/Temporal_pre_export_20241202","properties":{"system:asset_size":705844},"features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000987","properties":{"Bare ground":8.893449984668786,"EVI":0.85495483701733,"NDVI":0.5472915756967119,"Name":"BNP western polygon","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000965","properties":{"Bare ground":6.9157784025488205,"EVI":0.8978971424016382,"NDVI":0.5698814413997015,"Name":"LNP-BNP corridor","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009af","properties":{"Bare ground":3.582137172215512,"EVI":0.6505001129552291,"NDVI":0.4509795054381152,"Name":"BNP western polygon","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"0000000000000000098d","properties":{"Bare ground":4.335482146923094,"EVI":0.6584149326273582,"NDVI":0.4553191831424044,"Name":"LNP-BNP corridor","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009d7","properties":{"Bare ground":10.41642687996423,"EVI":0.42358333850631447,"NDVI":0.307281229635695,"Name":"BNP western polygon","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009b5","properties":{"Bare ground":10.339850543856336,"EVI":0.4130831735214416,"NDVI":0.3011000263468115,"Name":"LNP-BNP corridor","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009ff","properties":{"Bare ground":10.253488026850588,"EVI":0.3643776400460183,"NDVI":0.2672656418779298,"Name":"BNP western polygon","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009dd","properties":{"Bare ground":10.71375079376716,"EVI":0.38440919383301225,"NDVI":0.28134231334785037,"Name":"LNP-BNP corridor","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a27","properties":{"Bare ground":8.07232248044919,"EVI":0.6509225780859329,"NDVI":0.4425926467561585,"Name":"BNP western polygon","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a05","properties":{"Bare ground":8.149968272128243,"EVI":0.6522625611700374,"NDVI":0.44357560098316007,"Name":"LNP-BNP corridor","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a4f","properties":{"Bare ground":4.850705262826095,"EVI":0.6191915082424767,"NDVI":0.4325149258415639,"Name":"BNP western polygon","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a2d","properties":{"Bare ground":4.724748271496909,"EVI":0.6685569411743395,"NDVI":0.4610820809502188,"Name":"LNP-BNP corridor","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a77","properties":{"Bare ground":9.013722945173678,"EVI":0.31973713022641653,"NDVI":0.23851828034529635,"Name":"BNP western polygon","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a55","properties":{"Bare ground":9.696750734065605,"EVI":0.35405894316592207,"NDVI":0.26325106141786253,"Name":"LNP-BNP corridor","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a9f","properties":{"Bare ground":14.212245667014576,"EVI":0.28852891169927586,"NDVI":0.21244138292207776,"Name":"BNP western polygon","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a7d","properties":{"Bare ground":12.897315778002504,"EVI":0.3327049879568159,"NDVI":0.2438148673862133,"Name":"LNP-BNP corridor","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ac7","properties":{"Bare ground":11.717480507578788,"EVI":0.6700598919557141,"NDVI":0.447952767416284,"Name":"BNP western polygon","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aa5","properties":{"Bare ground":11.20285511774706,"EVI":0.6666525261810323,"NDVI":0.4465404797702888,"Name":"LNP-BNP corridor","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aef","properties":{"Bare ground":10.113485493766031,"EVI":0.48908124893112664,"NDVI":0.34783003393759643,"Name":"BNP western polygon","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000acd","properties":{"Bare ground":7.986628491059495,"EVI":0.5348649073356715,"NDVI":0.3790769842043263,"Name":"LNP-BNP corridor","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b17","properties":{"Bare ground":10.09992694946952,"EVI":0.3163713689143198,"NDVI":0.232912112661022,"Name":"BNP western polygon","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000af5","properties":{"Bare ground":10.4541158821234,"EVI":0.34769497698243307,"NDVI":0.25595327439033866,"Name":"LNP-BNP corridor","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b3f","properties":{"Bare ground":21.859149759713823,"EVI":0.3434291317339757,"NDVI":0.24763109735052877,"Name":"BNP western polygon","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b1d","properties":{"Bare ground":14.765066150291531,"EVI":0.33131014043676366,"NDVI":0.2419575161875235,"Name":"LNP-BNP corridor","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b67","properties":{"Bare ground":18.171063410972977,"EVI":0.5500698600829751,"NDVI":0.3786849487930583,"Name":"BNP western polygon","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b45","properties":{"Bare ground":13.254429365993046,"EVI":0.6069232404507992,"NDVI":0.4141219093481184,"Name":"LNP-BNP corridor","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b8f","properties":{"Bare ground":10.575828273142472,"EVI":0.5483092333855671,"NDVI":0.38225614760487775,"Name":"BNP western polygon","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b6d","properties":{"Bare ground":6.1019851450599445,"EVI":0.6415924822340123,"NDVI":0.4423364987999644,"Name":"LNP-BNP corridor","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bb7","properties":{"Bare ground":10.50195669789604,"EVI":0.33556730199309626,"NDVI":0.24533966577054345,"Name":"BNP western polygon","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b95","properties":{"Bare ground":9.885546119016215,"EVI":0.4009636544148326,"NDVI":0.2923558649032758,"Name":"LNP-BNP corridor","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bdf","properties":{"Bare ground":18.56952173895803,"EVI":0.409730124052845,"NDVI":0.2927925155914573,"Name":"BNP western polygon","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bbd","properties":{"Bare ground":14.847752440276244,"EVI":0.48371560435242394,"NDVI":0.34266557663310115,"Name":"LNP-BNP corridor","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c07","properties":{"Bare ground":4.437298239416296,"EVI":0.8726658352741172,"NDVI":0.5593752230406576,"Name":"BNP western polygon","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000be5","properties":{"Bare ground":4.13053036891886,"EVI":0.9064405493925978,"NDVI":0.5781667660710791,"Name":"LNP-BNP corridor","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c2f","properties":{"Bare ground":3.2444857283541513,"EVI":0.7133116024088906,"NDVI":0.48492134533596626,"Name":"BNP western polygon","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c0d","properties":{"Bare ground":3.799966937302881,"EVI":0.744467429704249,"NDVI":0.5052728261257683,"Name":"LNP-BNP corridor","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c57","properties":{"Bare ground":6.147844186365297,"EVI":0.5038093873100171,"NDVI":0.3618628340216633,"Name":"BNP western polygon","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c35","properties":{"Bare ground":5.805105762873004,"EVI":0.5277682596803768,"NDVI":0.37768481451688096,"Name":"LNP-BNP corridor","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c7f","properties":{"Bare ground":10.807019345967722,"EVI":0.4539338189166745,"NDVI":0.3232581861712215,"Name":"BNP western polygon","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c5d","properties":{"Bare ground":9.780923628192127,"EVI":0.47829539559978695,"NDVI":0.33965212467334865,"Name":"LNP-BNP corridor","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ca7","properties":{"Bare ground":55.22865956621969,"EVI":0.389655693889272,"NDVI":0.2655679349038552,"Name":"BNP western polygon","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c85","properties":{"Bare ground":51.584680539505655,"EVI":0.42985678176581343,"NDVI":0.2902686021664811,"Name":"LNP-BNP corridor","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ccf","properties":{"Bare ground":56.647643454528605,"EVI":0.3399350298480299,"NDVI":0.23750892284818048,"Name":"BNP western polygon","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cad","properties":{"Bare ground":53.35714117476383,"EVI":0.3592930681042307,"NDVI":0.2500771738504254,"Name":"LNP-BNP corridor","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cf7","properties":{"Bare ground":72.93383272802524,"EVI":0.183448332273246,"NDVI":0.13247247608605614,"Name":"BNP western polygon","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cd5","properties":{"Bare ground":70.50330035504847,"EVI":0.2032394114462235,"NDVI":0.1463864010468255,"Name":"LNP-BNP corridor","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d1f","properties":{"Bare ground":72.39515129830308,"EVI":0.2552577689082169,"NDVI":0.17875530223893557,"Name":"BNP western polygon","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cfd","properties":{"Bare ground":72.96367200606471,"EVI":0.22855014733325024,"NDVI":0.16169861988365686,"Name":"LNP-BNP corridor","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d47","properties":{"Bare ground":52.76706521868143,"EVI":0.4336104423010979,"NDVI":0.29085180538808547,"Name":"BNP western polygon","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d25","properties":{"Bare ground":51.06835322710476,"EVI":0.45876673561497056,"NDVI":0.30616766282703173,"Name":"LNP-BNP corridor","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d6f","properties":{"Bare ground":52.135433862823426,"EVI":0.4009300331093532,"NDVI":0.27402443067258586,"Name":"BNP western polygon","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d4d","properties":{"Bare ground":50.6491515903907,"EVI":0.4140568230811021,"NDVI":0.282101924953775,"Name":"LNP-BNP corridor","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d97","properties":{"Bare ground":68.49173938590198,"EVI":0.23985620226988472,"NDVI":0.17076024577827417,"Name":"BNP western polygon","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d75","properties":{"Bare ground":67.14160809790961,"EVI":0.23706833757979964,"NDVI":0.1688088953527196,"Name":"LNP-BNP corridor","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dbf","properties":{"Bare ground":68.33505061753569,"EVI":0.2991483985163314,"NDVI":0.20830436421731896,"Name":"BNP western polygon","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d9d","properties":{"Bare ground":63.95183503748443,"EVI":0.32310868032915535,"NDVI":0.22396811733415012,"Name":"LNP-BNP corridor","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000de7","properties":{"Bare ground":53.97223713166712,"EVI":0.4021480764808842,"NDVI":0.27332291810978976,"Name":"BNP western polygon","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dc5","properties":{"Bare ground":52.6240139214611,"EVI":0.4170302911299164,"NDVI":0.28286569975419323,"Name":"LNP-BNP corridor","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e0f","properties":{"Bare ground":62.697068465921205,"EVI":0.2988471024157962,"NDVI":0.210261995535399,"Name":"BNP western polygon","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ded","properties":{"Bare ground":63.256588588460765,"EVI":0.28213867827221134,"NDVI":0.19957875695576272,"Name":"LNP-BNP corridor","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e37","properties":{"Bare ground":72.99486542639475,"EVI":0.1795342195640924,"NDVI":0.12992252169056565,"Name":"BNP western polygon","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e15","properties":{"Bare ground":71.73268888831296,"EVI":0.18114834741147176,"NDVI":0.13116392448145545,"Name":"LNP-BNP corridor","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e5f","properties":{"Bare ground":78.27042110213783,"EVI":0.15672573845518878,"NDVI":0.11339400229322094,"Name":"BNP western polygon","date":1730419200000,"month":10,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e3d","properties":{"Bare ground":76.1038778776049,"EVI":0.16871120900712097,"NDVI":0.12202709732357143,"Name":"LNP-BNP corridor","date":1730419200000,"month":10,"year":2024}}]}],[{"type":"FeatureCollection","columns":{"Bare ground":"Float","EVI":"Float","NDVI":"Float","Name":"String","date":"Long","system:index":"String","year":"Integer"},"features":[{"type":"Feature","geometry":None,"id":"4669","properties":{"Bare ground":66.98364803153024,"EVI":0.25931378422899043,"NDVI":0.18172535940724382,"Name":"BNP western polygon","date":1704067200000,"year":2024}},{"type":"Feature","geometry":None,"id":"4854","properties":{"Bare ground":65.92929231895994,"EVI":0.2622571314551801,"NDVI":0.1839088696287457,"Name":"LNP-BNP corridor","date":1704067200000,"year":2024}}]},{"type":"FeatureCollection","columns":{"date":"Long"},"version":1733164362540944,"id":"projects/ee-yekelaso1818/assets/Temporal_pre_export_20241202","properties":{"system:asset_size":705844},"features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000987","properties":{"Bare ground":8.893449984668786,"EVI":0.85495483701733,"NDVI":0.5472915756967119,"Name":"BNP western polygon","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000965","properties":{"Bare ground":6.9157784025488205,"EVI":0.8978971424016382,"NDVI":0.5698814413997015,"Name":"LNP-BNP corridor","date":1485907200000,"month":1,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009af","properties":{"Bare ground":3.582137172215512,"EVI":0.6505001129552291,"NDVI":0.4509795054381152,"Name":"BNP western polygon","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"0000000000000000098d","properties":{"Bare ground":4.335482146923094,"EVI":0.6584149326273582,"NDVI":0.4553191831424044,"Name":"LNP-BNP corridor","date":1493596800000,"month":4,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009d7","properties":{"Bare ground":10.41642687996423,"EVI":0.42358333850631447,"NDVI":0.307281229635695,"Name":"BNP western polygon","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009b5","properties":{"Bare ground":10.339850543856336,"EVI":0.4130831735214416,"NDVI":0.3011000263468115,"Name":"LNP-BNP corridor","date":1501545600000,"month":7,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009ff","properties":{"Bare ground":10.253488026850588,"EVI":0.3643776400460183,"NDVI":0.2672656418779298,"Name":"BNP western polygon","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"000000000000000009dd","properties":{"Bare ground":10.71375079376716,"EVI":0.38440919383301225,"NDVI":0.28134231334785037,"Name":"LNP-BNP corridor","date":1509494400000,"month":10,"year":2017}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a27","properties":{"Bare ground":8.07232248044919,"EVI":0.6509225780859329,"NDVI":0.4425926467561585,"Name":"BNP western polygon","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a05","properties":{"Bare ground":8.149968272128243,"EVI":0.6522625611700374,"NDVI":0.44357560098316007,"Name":"LNP-BNP corridor","date":1517443200000,"month":1,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a4f","properties":{"Bare ground":4.850705262826095,"EVI":0.6191915082424767,"NDVI":0.4325149258415639,"Name":"BNP western polygon","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a2d","properties":{"Bare ground":4.724748271496909,"EVI":0.6685569411743395,"NDVI":0.4610820809502188,"Name":"LNP-BNP corridor","date":1525132800000,"month":4,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a77","properties":{"Bare ground":9.013722945173678,"EVI":0.31973713022641653,"NDVI":0.23851828034529635,"Name":"BNP western polygon","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a55","properties":{"Bare ground":9.696750734065605,"EVI":0.35405894316592207,"NDVI":0.26325106141786253,"Name":"LNP-BNP corridor","date":1533081600000,"month":7,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a9f","properties":{"Bare ground":14.212245667014576,"EVI":0.28852891169927586,"NDVI":0.21244138292207776,"Name":"BNP western polygon","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000a7d","properties":{"Bare ground":12.897315778002504,"EVI":0.3327049879568159,"NDVI":0.2438148673862133,"Name":"LNP-BNP corridor","date":1541030400000,"month":10,"year":2018}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ac7","properties":{"Bare ground":11.717480507578788,"EVI":0.6700598919557141,"NDVI":0.447952767416284,"Name":"BNP western polygon","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aa5","properties":{"Bare ground":11.20285511774706,"EVI":0.6666525261810323,"NDVI":0.4465404797702888,"Name":"LNP-BNP corridor","date":1548979200000,"month":1,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000aef","properties":{"Bare ground":10.113485493766031,"EVI":0.48908124893112664,"NDVI":0.34783003393759643,"Name":"BNP western polygon","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000acd","properties":{"Bare ground":7.986628491059495,"EVI":0.5348649073356715,"NDVI":0.3790769842043263,"Name":"LNP-BNP corridor","date":1556668800000,"month":4,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b17","properties":{"Bare ground":10.09992694946952,"EVI":0.3163713689143198,"NDVI":0.232912112661022,"Name":"BNP western polygon","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000af5","properties":{"Bare ground":10.4541158821234,"EVI":0.34769497698243307,"NDVI":0.25595327439033866,"Name":"LNP-BNP corridor","date":1564617600000,"month":7,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b3f","properties":{"Bare ground":21.859149759713823,"EVI":0.3434291317339757,"NDVI":0.24763109735052877,"Name":"BNP western polygon","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b1d","properties":{"Bare ground":14.765066150291531,"EVI":0.33131014043676366,"NDVI":0.2419575161875235,"Name":"LNP-BNP corridor","date":1572566400000,"month":10,"year":2019}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b67","properties":{"Bare ground":18.171063410972977,"EVI":0.5500698600829751,"NDVI":0.3786849487930583,"Name":"BNP western polygon","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b45","properties":{"Bare ground":13.254429365993046,"EVI":0.6069232404507992,"NDVI":0.4141219093481184,"Name":"LNP-BNP corridor","date":1580515200000,"month":1,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b8f","properties":{"Bare ground":10.575828273142472,"EVI":0.5483092333855671,"NDVI":0.38225614760487775,"Name":"BNP western polygon","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b6d","properties":{"Bare ground":6.1019851450599445,"EVI":0.6415924822340123,"NDVI":0.4423364987999644,"Name":"LNP-BNP corridor","date":1588291200000,"month":4,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bb7","properties":{"Bare ground":10.50195669789604,"EVI":0.33556730199309626,"NDVI":0.24533966577054345,"Name":"BNP western polygon","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000b95","properties":{"Bare ground":9.885546119016215,"EVI":0.4009636544148326,"NDVI":0.2923558649032758,"Name":"LNP-BNP corridor","date":1596240000000,"month":7,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bdf","properties":{"Bare ground":18.56952173895803,"EVI":0.409730124052845,"NDVI":0.2927925155914573,"Name":"BNP western polygon","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000bbd","properties":{"Bare ground":14.847752440276244,"EVI":0.48371560435242394,"NDVI":0.34266557663310115,"Name":"LNP-BNP corridor","date":1604188800000,"month":10,"year":2020}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c07","properties":{"Bare ground":4.437298239416296,"EVI":0.8726658352741172,"NDVI":0.5593752230406576,"Name":"BNP western polygon","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000be5","properties":{"Bare ground":4.13053036891886,"EVI":0.9064405493925978,"NDVI":0.5781667660710791,"Name":"LNP-BNP corridor","date":1612137600000,"month":1,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c2f","properties":{"Bare ground":3.2444857283541513,"EVI":0.7133116024088906,"NDVI":0.48492134533596626,"Name":"BNP western polygon","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c0d","properties":{"Bare ground":3.799966937302881,"EVI":0.744467429704249,"NDVI":0.5052728261257683,"Name":"LNP-BNP corridor","date":1619827200000,"month":4,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c57","properties":{"Bare ground":6.147844186365297,"EVI":0.5038093873100171,"NDVI":0.3618628340216633,"Name":"BNP western polygon","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c35","properties":{"Bare ground":5.805105762873004,"EVI":0.5277682596803768,"NDVI":0.37768481451688096,"Name":"LNP-BNP corridor","date":1627776000000,"month":7,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c7f","properties":{"Bare ground":10.807019345967722,"EVI":0.4539338189166745,"NDVI":0.3232581861712215,"Name":"BNP western polygon","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c5d","properties":{"Bare ground":9.780923628192127,"EVI":0.47829539559978695,"NDVI":0.33965212467334865,"Name":"LNP-BNP corridor","date":1635724800000,"month":10,"year":2021}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ca7","properties":{"Bare ground":55.22865956621969,"EVI":0.389655693889272,"NDVI":0.2655679349038552,"Name":"BNP western polygon","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000c85","properties":{"Bare ground":51.584680539505655,"EVI":0.42985678176581343,"NDVI":0.2902686021664811,"Name":"LNP-BNP corridor","date":1643673600000,"month":1,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ccf","properties":{"Bare ground":56.647643454528605,"EVI":0.3399350298480299,"NDVI":0.23750892284818048,"Name":"BNP western polygon","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cad","properties":{"Bare ground":53.35714117476383,"EVI":0.3592930681042307,"NDVI":0.2500771738504254,"Name":"LNP-BNP corridor","date":1651363200000,"month":4,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cf7","properties":{"Bare ground":72.93383272802524,"EVI":0.183448332273246,"NDVI":0.13247247608605614,"Name":"BNP western polygon","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cd5","properties":{"Bare ground":70.50330035504847,"EVI":0.2032394114462235,"NDVI":0.1463864010468255,"Name":"LNP-BNP corridor","date":1659312000000,"month":7,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d1f","properties":{"Bare ground":72.39515129830308,"EVI":0.2552577689082169,"NDVI":0.17875530223893557,"Name":"BNP western polygon","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000cfd","properties":{"Bare ground":72.96367200606471,"EVI":0.22855014733325024,"NDVI":0.16169861988365686,"Name":"LNP-BNP corridor","date":1667260800000,"month":10,"year":2022}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d47","properties":{"Bare ground":52.76706521868143,"EVI":0.4336104423010979,"NDVI":0.29085180538808547,"Name":"BNP western polygon","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d25","properties":{"Bare ground":51.06835322710476,"EVI":0.45876673561497056,"NDVI":0.30616766282703173,"Name":"LNP-BNP corridor","date":1675209600000,"month":1,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d6f","properties":{"Bare ground":52.135433862823426,"EVI":0.4009300331093532,"NDVI":0.27402443067258586,"Name":"BNP western polygon","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d4d","properties":{"Bare ground":50.6491515903907,"EVI":0.4140568230811021,"NDVI":0.282101924953775,"Name":"LNP-BNP corridor","date":1682899200000,"month":4,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d97","properties":{"Bare ground":68.49173938590198,"EVI":0.23985620226988472,"NDVI":0.17076024577827417,"Name":"BNP western polygon","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d75","properties":{"Bare ground":67.14160809790961,"EVI":0.23706833757979964,"NDVI":0.1688088953527196,"Name":"LNP-BNP corridor","date":1690848000000,"month":7,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dbf","properties":{"Bare ground":68.33505061753569,"EVI":0.2991483985163314,"NDVI":0.20830436421731896,"Name":"BNP western polygon","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000d9d","properties":{"Bare ground":63.95183503748443,"EVI":0.32310868032915535,"NDVI":0.22396811733415012,"Name":"LNP-BNP corridor","date":1698796800000,"month":10,"year":2023}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000de7","properties":{"Bare ground":53.97223713166712,"EVI":0.4021480764808842,"NDVI":0.27332291810978976,"Name":"BNP western polygon","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000dc5","properties":{"Bare ground":52.6240139214611,"EVI":0.4170302911299164,"NDVI":0.28286569975419323,"Name":"LNP-BNP corridor","date":1706745600000,"month":1,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e0f","properties":{"Bare ground":62.697068465921205,"EVI":0.2988471024157962,"NDVI":0.210261995535399,"Name":"BNP western polygon","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000ded","properties":{"Bare ground":63.256588588460765,"EVI":0.28213867827221134,"NDVI":0.19957875695576272,"Name":"LNP-BNP corridor","date":1714521600000,"month":4,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e37","properties":{"Bare ground":72.99486542639475,"EVI":0.1795342195640924,"NDVI":0.12992252169056565,"Name":"BNP western polygon","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e15","properties":{"Bare ground":71.73268888831296,"EVI":0.18114834741147176,"NDVI":0.13116392448145545,"Name":"LNP-BNP corridor","date":1722470400000,"month":7,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e5f","properties":{"Bare ground":78.27042110213783,"EVI":0.15672573845518878,"NDVI":0.11339400229322094,"Name":"BNP western polygon","date":1730419200000,"month":10,"year":2024}},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[]},"id":"00000000000000000e3d","properties":{"Bare ground":76.1038778776049,"EVI":0.16871120900712097,"NDVI":0.12202709732357143,"Name":"LNP-BNP corridor","date":1730419200000,"month":10,"year":2024}}]}]]

        results = self._combine_temporal_analysis_results(comp_years, results)
        return results

    def run_spatial_analysis(self, data):
        """Run the spatial analysis."""
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': data['variable'],
            't_resolution': '',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }
        initialize_engine_analysis()
        if data['longitude'] is None and data['latitude'] is None:
            # return the relative different layer
            input_layers = InputLayer()
            rel_diff = get_rel_diff(
                input_layers.get_spatial_layer_dict(),
                analysis_dict,
                data['reference_layer']
            )
            metadata = {
                'minValue': -25,
                'maxValue': 25,
                'colors': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
                'opacity': 0.7
            }
            return {
                'id': 'spatial_analysis_rel_diff',
                'uuid': str(uuid.uuid4()),
                'name': '% difference in ' + data['variable'],
                'type': 'raster',
                'group': 'spatial_analysis',
                'metadata': metadata,
                'url': rel_diff.getMapId({
                    'min': metadata['minValue'],
                    'max': metadata['maxValue'],
                    'palette': metadata['colors'],
                    'opacity': metadata['opacity']
                })['tile_fetcher'].url_format,
                'style': None
            }

        return run_analysis(
            lon=float(data['longitude']),
            lat=float(data['latitude']),
            analysis_dict=analysis_dict,
            reference_layer=data['reference_layer']
        )

    def post(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        data = request.data
        try:
            if data['analysisType'] == 'Baseline':
                results = self.run_baseline_analysis(data)
            elif data['analysisType'] == 'Temporal':
                results = self.run_temporal_analysis(data)
            elif data['analysisType'] == 'Spatial':
                results = self.run_spatial_analysis(data)
            else:
                raise ValueError('Invalid analysis type')
            return Response({
                'data': data,
                'results': results
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, status=status.HTTP_400_BAD_REQUEST
            )
