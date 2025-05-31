
export const testWidgetData: any = {
    "version": "1.0",
    "savedAt": "2025-05-30T22:47:34.983Z",
    "dashboardTitle": "Dynamic Dashboard",
    "widgets": [
        {
            "id": "1",
            "order": 3,
            "type": "chart",
            "title": "Limpopo NP - NDVI",
            "size": 3,
            "height": "large",
            "content": null,
            "config": {
                "chartType": "bar",
            },
            "hasData": true,
            "data": {
                "data": {
                    "period": {
                        "year": 2018
                    },
                    "variable": "NDVI",
                    "landscape": "Limpopo NP",
                    "locations": [
                        {
                            "lat": -23.549351331972545,
                            "lon": 31.858681110593636,
                            "community": "00000000000000000174",
                            "communityName": "Machamba 2",
                            "communityFeatureId": 449
                        },
                        {
                            "lat": -22.820242922752385,
                            "lon": 32.639018435357144,
                            "community": "00000000000000000160",
                            "communityName": "Bahine National Park",
                            "communityFeatureId": 429
                        }
                    ],
                    "custom_geom": null,
                    "analysisType": "Temporal",
                    "baselineEndDate": null,
                    "comparisonPeriod": {
                        "year": [
                            2020
                        ],
                        "month": [],
                        "quarter": []
                    },
                    "baselineStartDate": null,
                    "temporalResolution": "Annual",
                    "userDefinedFeatureId": null,
                    "userDefinedFeatureName": null
                },
                "results": [
                    {
                        "type": "FeatureCollection",
                        "columns": {
                            "EVI": "Float",
                            "NDVI": "Float",
                            "Name": "String",
                            "date": "Long",
                            "year": "Integer",
                            "Bare ground": "Float",
                            "system:index": "String"
                        },
                        "features": [
                            {
                                "id": "727",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4695950320635255,
                                    "NDVI": 0.3315168089662741,
                                    "Name": "BNP western polygon",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 9.037249088865885
                                }
                            },
                            {
                                "id": "728",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.43629795786145903,
                                    "NDVI": 0.3086322886343672,
                                    "Name": "Bahine National Park",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.557580039880225
                                }
                            },
                            {
                                "id": "918",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.37798484256893405,
                                    "NDVI": 0.27297072786582344,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 9.55109994591242
                                }
                            },
                            {
                                "id": "982",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.3725614792232661,
                                    "NDVI": 0.27075764539804564,
                                    "Name": "Machamba 2",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.903834326154385
                                }
                            },
                            {
                                "id": "983",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.37261676216063927,
                                    "NDVI": 0.27079620264465915,
                                    "Name": "Machamba_A",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.90207371142396
                                }
                            },
                            {
                                "id": "2041",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4609191298786209,
                                    "NDVI": 0.3247683194399842,
                                    "Name": "BNP western polygon",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 14.45459253024238
                                }
                            },
                            {
                                "id": "2042",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4098188951610506,
                                    "NDVI": 0.2906704059210686,
                                    "Name": "Bahine National Park",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 19.288214927011516
                                }
                            },
                            {
                                "id": "2232",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4748475557606069,
                                    "NDVI": 0.33402703432708375,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 9.723272199631811
                                }
                            },
                            {
                                "id": "2296",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.45779797168942815,
                                    "NDVI": 0.3227924582492876,
                                    "Name": "Machamba 2",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 13.696265109903043
                                }
                            },
                            {
                                "id": "2297",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.45787007508489574,
                                    "NDVI": 0.32284064830170506,
                                    "Name": "Machamba_A",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 13.691476463105275
                                }
                            }
                        ],
                        "statistics": {
                            "2020": {
                                "Machamba 2": {
                                    "EVI": {
                                        "max": 0.5729638051617303,
                                        "min": 0.33205746016240184,
                                        "mean": 0.4577979716894281
                                    },
                                    "NDVI": {
                                        "max": 0.39646643012277766,
                                        "min": 0.2416182735018764,
                                        "mean": 0.3227924582492876
                                    },
                                    "Bare ground": {
                                        "max": 19.88554992895711,
                                        "min": 8.08712052273922,
                                        "mean": 13.696265109903043
                                    }
                                },
                                "Machamba_A": {
                                    "EVI": {
                                        "max": 0.5730414470796611,
                                        "min": 0.33210768719508377,
                                        "mean": 0.4578700750848958
                                    },
                                    "NDVI": {
                                        "max": 0.3965175483923984,
                                        "min": 0.24165279480376808,
                                        "mean": 0.32284064830170506
                                    },
                                    "Bare ground": {
                                        "max": 19.875740588539273,
                                        "min": 8.084741627515918,
                                        "mean": 13.691476463105275
                                    }
                                },
                                "BNP western polygon": {
                                    "EVI": {
                                        "max": 0.5500698600829751,
                                        "min": 0.33556730199309626,
                                        "mean": 0.4609191298786209
                                    },
                                    "NDVI": {
                                        "max": 0.38225614760487775,
                                        "min": 0.24533966577054345,
                                        "mean": 0.3247683194399842
                                    },
                                    "Bare ground": {
                                        "max": 18.56952173895803,
                                        "min": 10.50195669789604,
                                        "mean": 14.45459253024238
                                    }
                                },
                                "Bahine National Park": {
                                    "EVI": {
                                        "max": 0.5235891350745732,
                                        "min": 0.2916413181123904,
                                        "mean": 0.40981889516105063
                                    },
                                    "NDVI": {
                                        "max": 0.3615862755293638,
                                        "min": 0.21459955366169448,
                                        "mean": 0.2906704059210686
                                    },
                                    "Bare ground": {
                                        "max": 26.425618961202456,
                                        "min": 14.754189496818992,
                                        "mean": 19.288214927011513
                                    }
                                },
                                "Limpopo National Park Central": {
                                    "EVI": {
                                        "max": 0.6423261767744879,
                                        "min": 0.2965242125476117,
                                        "mean": 0.4748475557606069
                                    },
                                    "NDVI": {
                                        "max": 0.4352308211797352,
                                        "min": 0.21988657856929497,
                                        "mean": 0.33402703432708375
                                    },
                                    "Bare ground": {
                                        "max": 13.106162170392476,
                                        "min": 5.897350814383153,
                                        "mean": 9.723272199631811
                                    }
                                }
                            }
                        }
                    },
                    {
                        "id": "projects/ee-yekelaso1818/assets/Temporal_pre_export_20241202",
                        "type": "FeatureCollection",
                        "columns": {
                            "date": "Long"
                        },
                        "version": 1733164362540944,
                        "features": [
                            {
                                "id": "00000000000000000987",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.85495483701733,
                                    "NDVI": 0.5472915756967119,
                                    "Name": "BNP western polygon",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 8.893449984668786
                                }
                            },
                            {
                                "id": "00000000000000000964",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.788239496137923,
                                    "NDVI": 0.5102211821729893,
                                    "Name": "Bahine National Park",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.379173327831984
                                }
                            },
                            {
                                "id": "00000000000000000960",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8259463581665435,
                                    "NDVI": 0.5321435695251074,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 6.181607809728489
                                }
                            },
                            {
                                "id": "00000000000000000978",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7322094532992601,
                                    "NDVI": 0.48238966910067366,
                                    "Name": "Machamba 2",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.11526263339653
                                }
                            },
                            {
                                "id": "00000000000000000977",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7322015017416681,
                                    "NDVI": 0.4823910621743738,
                                    "Name": "Machamba_A",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.112766127197492
                                }
                            },
                            {
                                "id": "000000000000000009af",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6505001129552291,
                                    "NDVI": 0.4509795054381152,
                                    "Name": "BNP western polygon",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 3.582137172215512
                                }
                            },
                            {
                                "id": "0000000000000000098c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.613609355660973,
                                    "NDVI": 0.4271978805201294,
                                    "Name": "Bahine National Park",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.715974222226792
                                }
                            },
                            {
                                "id": "00000000000000000988",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5470037100194012,
                                    "NDVI": 0.3853917839474786,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.3263316802563345
                                }
                            },
                            {
                                "id": "000000000000000009a0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5834155799972212,
                                    "NDVI": 0.4074279715227161,
                                    "Name": "Machamba 2",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.286241505965498
                                }
                            },
                            {
                                "id": "0000000000000000099f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5835113473103551,
                                    "NDVI": 0.40749106677001734,
                                    "Name": "Machamba_A",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.282533897934344
                                }
                            },
                            {
                                "id": "000000000000000009d7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.42358333850631447,
                                    "NDVI": 0.307281229635695,
                                    "Name": "BNP western polygon",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 10.41642687996423
                                }
                            },
                            {
                                "id": "000000000000000009b4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4179296411500794,
                                    "NDVI": 0.3027068963252161,
                                    "Name": "Bahine National Park",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.206003337775131
                                }
                            },
                            {
                                "id": "000000000000000009b0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3015283476088467,
                                    "NDVI": 0.22338373898558683,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 10.489362048455646
                                }
                            },
                            {
                                "id": "000000000000000009c8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.32246395536806116,
                                    "NDVI": 0.23672718878191015,
                                    "Name": "Machamba 2",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.592298067816598
                                }
                            },
                            {
                                "id": "000000000000000009c7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.322506128794119,
                                    "NDVI": 0.2367576497105985,
                                    "Name": "Machamba_A",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.583995875790784
                                }
                            },
                            {
                                "id": "000000000000000009ff",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3643776400460183,
                                    "NDVI": 0.2672656418779298,
                                    "Name": "BNP western polygon",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 10.253488026850588
                                }
                            },
                            {
                                "id": "000000000000000009dc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34289093962769235,
                                    "NDVI": 0.25053173466067313,
                                    "Name": "Bahine National Park",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 14.379848626437788
                                }
                            },
                            {
                                "id": "000000000000000009d8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.26344669167735896,
                                    "NDVI": 0.1968140307427279,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 9.455775609561927
                                }
                            },
                            {
                                "id": "000000000000000009f0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2416714433479389,
                                    "NDVI": 0.18019892644792956,
                                    "Name": "Machamba 2",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 11.810349687745456
                                }
                            },
                            {
                                "id": "000000000000000009ef",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24169552011911768,
                                    "NDVI": 0.18021696143182028,
                                    "Name": "Machamba_A",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 11.799948007369755
                                }
                            },
                            {
                                "id": "00000000000000000a27",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6509225780859329,
                                    "NDVI": 0.4425926467561585,
                                    "Name": "BNP western polygon",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 8.07232248044919
                                }
                            },
                            {
                                "id": "00000000000000000a04",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6108852217255603,
                                    "NDVI": 0.41680982151821006,
                                    "Name": "Bahine National Park",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 11.664147660938491
                                }
                            },
                            {
                                "id": "00000000000000000a00",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.547634710917738,
                                    "NDVI": 0.38133847693999784,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 9.224079675020205
                                }
                            },
                            {
                                "id": "00000000000000000a18",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4151760479569597,
                                    "NDVI": 0.3016892402439638,
                                    "Name": "Machamba 2",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 13.883854337124696
                                }
                            },
                            {
                                "id": "00000000000000000a17",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.415244702234996,
                                    "NDVI": 0.30173731611839794,
                                    "Name": "Machamba_A",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 13.883778152254695
                                }
                            },
                            {
                                "id": "00000000000000000a4f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6191915082424767,
                                    "NDVI": 0.4325149258415639,
                                    "Name": "BNP western polygon",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 4.850705262826095
                                }
                            },
                            {
                                "id": "00000000000000000a2c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5780592917887416,
                                    "NDVI": 0.40460286247689425,
                                    "Name": "Bahine National Park",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 6.988743874933611
                                }
                            },
                            {
                                "id": "00000000000000000a28",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.48295263931280297,
                                    "NDVI": 0.34852144901601456,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 6.36817941309296
                                }
                            },
                            {
                                "id": "00000000000000000a40",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5413546198901411,
                                    "NDVI": 0.3837070996395632,
                                    "Name": "Machamba 2",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 7.003374688537098
                                }
                            },
                            {
                                "id": "00000000000000000a3f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5414385390547295,
                                    "NDVI": 0.38376377958476665,
                                    "Name": "Machamba_A",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 7.000887946655666
                                }
                            },
                            {
                                "id": "00000000000000000a77",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.31973713022641653,
                                    "NDVI": 0.23851828034529635,
                                    "Name": "BNP western polygon",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.013722945173678
                                }
                            },
                            {
                                "id": "00000000000000000a54",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2993458790802785,
                                    "NDVI": 0.22359243941618528,
                                    "Name": "Bahine National Park",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.706193974311423
                                }
                            },
                            {
                                "id": "00000000000000000a50",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23950231999740249,
                                    "NDVI": 0.18188081733501624,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 10.39943707303038
                                }
                            },
                            {
                                "id": "00000000000000000a68",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2853765941667647,
                                    "NDVI": 0.2137771629384836,
                                    "Name": "Machamba 2",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.886354197034764
                                }
                            },
                            {
                                "id": "00000000000000000a67",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2854183420090945,
                                    "NDVI": 0.21380719209458396,
                                    "Name": "Machamba_A",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.886536308624956
                                }
                            },
                            {
                                "id": "00000000000000000a9f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.28852891169927586,
                                    "NDVI": 0.21244138292207776,
                                    "Name": "BNP western polygon",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 14.212245667014576
                                }
                            },
                            {
                                "id": "00000000000000000a7c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.25690143885125555,
                                    "NDVI": 0.18952403112617924,
                                    "Name": "Bahine National Park",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 21.87123464933737
                                }
                            },
                            {
                                "id": "00000000000000000a78",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24184970004779285,
                                    "NDVI": 0.18014216817226503,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 12.212703622506137
                                }
                            },
                            {
                                "id": "00000000000000000a90",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24833865487919887,
                                    "NDVI": 0.183857078770172,
                                    "Name": "Machamba 2",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 20.841754081920985
                                }
                            },
                            {
                                "id": "00000000000000000a8f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24836546534373696,
                                    "NDVI": 0.183876522780888,
                                    "Name": "Machamba_A",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 20.83709243816052
                                }
                            },
                            {
                                "id": "00000000000000000ac7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6700598919557141,
                                    "NDVI": 0.447952767416284,
                                    "Name": "BNP western polygon",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 11.717480507578788
                                }
                            },
                            {
                                "id": "00000000000000000aa4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.629990050040012,
                                    "NDVI": 0.4235883022080698,
                                    "Name": "Bahine National Park",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.25809003931379
                                }
                            },
                            {
                                "id": "00000000000000000aa0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6169765336794916,
                                    "NDVI": 0.4195722284308421,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 10.240456980660982
                                }
                            },
                            {
                                "id": "00000000000000000ab8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5389132728390554,
                                    "NDVI": 0.3726157305034974,
                                    "Name": "Machamba 2",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.998924624965127
                                }
                            },
                            {
                                "id": "00000000000000000ab7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5389764286473481,
                                    "NDVI": 0.3726572670480194,
                                    "Name": "Machamba_A",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.992901013139509
                                }
                            },
                            {
                                "id": "00000000000000000aef",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.48908124893112664,
                                    "NDVI": 0.34783003393759643,
                                    "Name": "BNP western polygon",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 10.113485493766031
                                }
                            },
                            {
                                "id": "00000000000000000acc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4738521136366971,
                                    "NDVI": 0.3352189201607451,
                                    "Name": "Bahine National Park",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 12.66824705615648
                                }
                            },
                            {
                                "id": "00000000000000000ac8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4596854254257808,
                                    "NDVI": 0.32884583642118204,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.875020228171779
                                }
                            },
                            {
                                "id": "00000000000000000ae0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5548073065609186,
                                    "NDVI": 0.3884636754478395,
                                    "Name": "Machamba 2",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.244973140103997
                                }
                            },
                            {
                                "id": "00000000000000000adf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5549176655991532,
                                    "NDVI": 0.38853704947587503,
                                    "Name": "Machamba_A",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.241803745248756
                                }
                            },
                            {
                                "id": "00000000000000000b17",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3163713689143198,
                                    "NDVI": 0.232912112661022,
                                    "Name": "BNP western polygon",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 10.09992694946952
                                }
                            },
                            {
                                "id": "00000000000000000af4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2977941332105649,
                                    "NDVI": 0.21921382123484387,
                                    "Name": "Bahine National Park",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 11.86991043066086
                                }
                            },
                            {
                                "id": "00000000000000000af0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2715490438216425,
                                    "NDVI": 0.2019167386994745,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 10.228592032241073
                                }
                            },
                            {
                                "id": "00000000000000000b08",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30965088134719043,
                                    "NDVI": 0.2267650046255877,
                                    "Name": "Machamba 2",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 13.278842930432427
                                }
                            },
                            {
                                "id": "00000000000000000b07",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30969372545679485,
                                    "NDVI": 0.22679489804169695,
                                    "Name": "Machamba_A",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 13.279181035033272
                                }
                            },
                            {
                                "id": "00000000000000000b3f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3434291317339757,
                                    "NDVI": 0.24763109735052877,
                                    "Name": "BNP western polygon",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 21.859149759713823
                                }
                            },
                            {
                                "id": "00000000000000000b1c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3407335928751696,
                                    "NDVI": 0.2435971838691636,
                                    "Name": "Bahine National Park",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 28.155220124181263
                                }
                            },
                            {
                                "id": "00000000000000000b18",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2827590836324765,
                                    "NDVI": 0.20729087592805664,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 13.535640209930127
                                }
                            },
                            {
                                "id": "00000000000000000b30",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.31513646130982753,
                                    "NDVI": 0.22782037474681743,
                                    "Name": "Machamba 2",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 22.838910769887818
                                }
                            },
                            {
                                "id": "00000000000000000b2f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3151746775007484,
                                    "NDVI": 0.22784733976122,
                                    "Name": "Machamba_A",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 22.830161689648467
                                }
                            },
                            {
                                "id": "00000000000000000b67",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5500698600829751,
                                    "NDVI": 0.3786849487930583,
                                    "Name": "BNP western polygon",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 18.171063410972977
                                }
                            },
                            {
                                "id": "00000000000000000b44",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5235891350745732,
                                    "NDVI": 0.3615862755293638,
                                    "Name": "Bahine National Park",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 20.955323516017017
                                }
                            },
                            {
                                "id": "00000000000000000b40",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6423261767744879,
                                    "NDVI": 0.4352308211797352,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 8.98706113459109
                                }
                            },
                            {
                                "id": "00000000000000000b58",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5729638051617303,
                                    "NDVI": 0.39646643012277766,
                                    "Name": "Machamba 2",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 11.88545436133703
                                }
                            },
                            {
                                "id": "00000000000000000b57",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5730414470796611,
                                    "NDVI": 0.3965175483923984,
                                    "Name": "Machamba_A",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 11.878623606274031
                                }
                            },
                            {
                                "id": "00000000000000000b8f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5483092333855671,
                                    "NDVI": 0.38225614760487775,
                                    "Name": "BNP western polygon",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 10.575828273142472
                                }
                            },
                            {
                                "id": "00000000000000000b6c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4597782080478948,
                                    "NDVI": 0.3254252084507938,
                                    "Name": "Bahine National Park",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 14.754189496818992
                                }
                            },
                            {
                                "id": "00000000000000000b68",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5351194158986845,
                                    "NDVI": 0.3773347281100046,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 5.897350814383153
                                }
                            },
                            {
                                "id": "00000000000000000b80",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5632643095460413,
                                    "NDVI": 0.3922711838363151,
                                    "Name": "Machamba 2",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 8.08712052273922
                                }
                            },
                            {
                                "id": "00000000000000000b7f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5633816088747479,
                                    "NDVI": 0.3923483473799717,
                                    "Name": "Machamba_A",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 8.084741627515918
                                }
                            },
                            {
                                "id": "00000000000000000bb7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33556730199309626,
                                    "NDVI": 0.24533966577054345,
                                    "Name": "BNP western polygon",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 10.50195669789604
                                }
                            },
                            {
                                "id": "00000000000000000b94",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2916413181123904,
                                    "NDVI": 0.21459955366169448,
                                    "Name": "Bahine National Park",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 15.017727734007591
                                }
                            },
                            {
                                "id": "00000000000000000b90",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2965242125476117,
                                    "NDVI": 0.21988657856929497,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 10.902514679160523
                                }
                            },
                            {
                                "id": "00000000000000000ba8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33205746016240184,
                                    "NDVI": 0.2416182735018764,
                                    "Name": "Machamba 2",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 14.92693562657881
                                }
                            },
                            {
                                "id": "00000000000000000ba7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33210768719508377,
                                    "NDVI": 0.24165279480376808,
                                    "Name": "Machamba_A",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 14.92680003009188
                                }
                            },
                            {
                                "id": "00000000000000000bdf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.409730124052845,
                                    "NDVI": 0.2927925155914573,
                                    "Name": "BNP western polygon",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 18.56952173895803
                                }
                            },
                            {
                                "id": "00000000000000000bbc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.364266919409344,
                                    "NDVI": 0.2610705860424223,
                                    "Name": "Bahine National Park",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 26.425618961202456
                                }
                            },
                            {
                                "id": "00000000000000000bb8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.42542041782164336,
                                    "NDVI": 0.30365600944930016,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 13.106162170392476
                                }
                            },
                            {
                                "id": "00000000000000000bd0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36290631188753897,
                                    "NDVI": 0.26081394553618126,
                                    "Name": "Machamba 2",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 19.88554992895711
                                }
                            },
                            {
                                "id": "00000000000000000bcf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3629495571900905,
                                    "NDVI": 0.26084390263068213,
                                    "Name": "Machamba_A",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 19.875740588539273
                                }
                            },
                            {
                                "id": "00000000000000000c07",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8726658352741172,
                                    "NDVI": 0.5593752230406576,
                                    "Name": "BNP western polygon",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.437298239416296
                                }
                            },
                            {
                                "id": "00000000000000000be4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7802342004483362,
                                    "NDVI": 0.5078118313380994,
                                    "Name": "Bahine National Park",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 5.662817344529138
                                }
                            },
                            {
                                "id": "00000000000000000be0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8947685554295333,
                                    "NDVI": 0.5700359941975318,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.258803081467935
                                }
                            },
                            {
                                "id": "00000000000000000bf8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.9068816692541036,
                                    "NDVI": 0.572615523343413,
                                    "Name": "Machamba 2",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.871721075001356
                                }
                            },
                            {
                                "id": "00000000000000000bf7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.9069619953947322,
                                    "NDVI": 0.5726614197650479,
                                    "Name": "Machamba_A",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.868844550857666
                                }
                            },
                            {
                                "id": "00000000000000000c2f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7133116024088906,
                                    "NDVI": 0.48492134533596626,
                                    "Name": "BNP western polygon",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 3.2444857283541513
                                }
                            },
                            {
                                "id": "00000000000000000c0c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6383708467161011,
                                    "NDVI": 0.4398052374331354,
                                    "Name": "Bahine National Park",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.440119398437476
                                }
                            },
                            {
                                "id": "00000000000000000c08",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6960831372862759,
                                    "NDVI": 0.47434194867687574,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 3.841451152280773
                                }
                            },
                            {
                                "id": "00000000000000000c20",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7621144382099395,
                                    "NDVI": 0.5063912359928054,
                                    "Name": "Machamba 2",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.112476024295802
                                }
                            },
                            {
                                "id": "00000000000000000c1f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.762213977923599,
                                    "NDVI": 0.5064510598348534,
                                    "Name": "Machamba_A",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.108919939177857
                                }
                            },
                            {
                                "id": "00000000000000000c57",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5038093873100171,
                                    "NDVI": 0.3618628340216633,
                                    "Name": "BNP western polygon",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 6.147844186365297
                                }
                            },
                            {
                                "id": "00000000000000000c34",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4511046597196804,
                                    "NDVI": 0.3281766725581113,
                                    "Name": "Bahine National Park",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 7.578342652700807
                                }
                            },
                            {
                                "id": "00000000000000000c30",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3969882713648644,
                                    "NDVI": 0.2908416470072133,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 9.088986472041038
                                }
                            },
                            {
                                "id": "00000000000000000c48",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.459093274312982,
                                    "NDVI": 0.32956008117390156,
                                    "Name": "Machamba 2",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 8.664179188745393
                                }
                            },
                            {
                                "id": "00000000000000000c47",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4591660495783933,
                                    "NDVI": 0.32961015080892675,
                                    "Name": "Machamba_A",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 8.6626247320213
                                }
                            },
                            {
                                "id": "00000000000000000c7f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4539338189166745,
                                    "NDVI": 0.3232581861712215,
                                    "Name": "BNP western polygon",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 10.807019345967722
                                }
                            },
                            {
                                "id": "00000000000000000c5c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.39556659330843,
                                    "NDVI": 0.2856441365870216,
                                    "Name": "Bahine National Park",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 13.647500591528184
                                }
                            },
                            {
                                "id": "00000000000000000c58",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3170163155904578,
                                    "NDVI": 0.23494655984121168,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 9.566699989595
                                }
                            },
                            {
                                "id": "00000000000000000c70",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.319431802602076,
                                    "NDVI": 0.2359060782854503,
                                    "Name": "Machamba 2",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 11.6816152554833
                                }
                            },
                            {
                                "id": "00000000000000000c6f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.319453098662023,
                                    "NDVI": 0.2359226795431968,
                                    "Name": "Machamba_A",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 11.672271873274983
                                }
                            },
                            {
                                "id": "00000000000000000ca7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.389655693889272,
                                    "NDVI": 0.2655679349038552,
                                    "Name": "BNP western polygon",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 55.22865956621969
                                }
                            },
                            {
                                "id": "00000000000000000c84",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.35958660769055056,
                                    "NDVI": 0.24604317675520992,
                                    "Name": "Bahine National Park",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.77551251489348
                                }
                            },
                            {
                                "id": "00000000000000000c80",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.39341122500767495,
                                    "NDVI": 0.26729830572023516,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 54.681300873076545
                                }
                            },
                            {
                                "id": "00000000000000000c98",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34170755452284995,
                                    "NDVI": 0.23615649975166592,
                                    "Name": "Machamba 2",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.3871726664599
                                }
                            },
                            {
                                "id": "00000000000000000c97",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34174628731974427,
                                    "NDVI": 0.23618253244554768,
                                    "Name": "Machamba_A",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.381732158341386
                                }
                            },
                            {
                                "id": "00000000000000000ccf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3399350298480299,
                                    "NDVI": 0.23750892284818048,
                                    "Name": "BNP western polygon",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 56.647643454528605
                                }
                            },
                            {
                                "id": "00000000000000000cac",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33959576086751364,
                                    "NDVI": 0.23604802742279157,
                                    "Name": "Bahine National Park",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 58.42588142920337
                                }
                            },
                            {
                                "id": "00000000000000000ca8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36131848106429953,
                                    "NDVI": 0.2503503016126336,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 53.93683855256363
                                }
                            },
                            {
                                "id": "00000000000000000cc0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.392929687960144,
                                    "NDVI": 0.2695002701782491,
                                    "Name": "Machamba 2",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 52.203578552770566
                                }
                            },
                            {
                                "id": "00000000000000000cbf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3929969824807518,
                                    "NDVI": 0.26954407310364936,
                                    "Name": "Machamba_A",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 52.19576319724304
                                }
                            },
                            {
                                "id": "00000000000000000cf7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.183448332273246,
                                    "NDVI": 0.13247247608605614,
                                    "Name": "BNP western polygon",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 72.93383272802524
                                }
                            },
                            {
                                "id": "00000000000000000cd4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18539374721835564,
                                    "NDVI": 0.13331443062364554,
                                    "Name": "Bahine National Park",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 74.2805982365135
                                }
                            },
                            {
                                "id": "00000000000000000cd0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.20972144854501767,
                                    "NDVI": 0.15062666016787643,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 70.75382455848836
                                }
                            },
                            {
                                "id": "00000000000000000ce8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2717632745177543,
                                    "NDVI": 0.1919629978706011,
                                    "Name": "Machamba 2",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 67.48475575897943
                                }
                            },
                            {
                                "id": "00000000000000000ce7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2717987379995947,
                                    "NDVI": 0.19198718701187556,
                                    "Name": "Machamba_A",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 67.48117707959686
                                }
                            },
                            {
                                "id": "00000000000000000d1f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2552577689082169,
                                    "NDVI": 0.17875530223893557,
                                    "Name": "BNP western polygon",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 72.39515129830308
                                }
                            },
                            {
                                "id": "00000000000000000cfc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2511389581353002,
                                    "NDVI": 0.1758354189374756,
                                    "Name": "Bahine National Park",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 73.19149219522399
                                }
                            },
                            {
                                "id": "00000000000000000cf8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.26855224535438543,
                                    "NDVI": 0.18751604582511944,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 69.79839711392698
                                }
                            },
                            {
                                "id": "00000000000000000d10",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.22315651512472368,
                                    "NDVI": 0.15796660613625058,
                                    "Name": "Machamba 2",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 76.4158096460583
                                }
                            },
                            {
                                "id": "00000000000000000d0f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.22318467351774143,
                                    "NDVI": 0.15798612927311104,
                                    "Name": "Machamba_A",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 76.41483382043367
                                }
                            },
                            {
                                "id": "00000000000000000d47",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4336104423010979,
                                    "NDVI": 0.29085180538808547,
                                    "Name": "BNP western polygon",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.76706521868143
                                }
                            },
                            {
                                "id": "00000000000000000d24",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3908203847406519,
                                    "NDVI": 0.2637926543598522,
                                    "Name": "Bahine National Park",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 53.78542311089545
                                }
                            },
                            {
                                "id": "00000000000000000d20",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.43774050734657416,
                                    "NDVI": 0.29345831727126753,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 51.469789298203146
                                }
                            },
                            {
                                "id": "00000000000000000d38",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.44888921160278206,
                                    "NDVI": 0.29960488626157417,
                                    "Name": "Machamba 2",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.09778225346077
                                }
                            },
                            {
                                "id": "00000000000000000d37",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4489300412977442,
                                    "NDVI": 0.29963013899729046,
                                    "Name": "Machamba_A",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.09509607825037
                                }
                            },
                            {
                                "id": "00000000000000000d6f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4009300331093532,
                                    "NDVI": 0.27402443067258586,
                                    "Name": "BNP western polygon",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.135433862823426
                                }
                            },
                            {
                                "id": "00000000000000000d4c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3718394478129795,
                                    "NDVI": 0.25512803903211523,
                                    "Name": "Bahine National Park",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 53.44207994404266
                                }
                            },
                            {
                                "id": "00000000000000000d48",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36862722424484545,
                                    "NDVI": 0.2535804658442324,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 54.135890583319906
                                }
                            },
                            {
                                "id": "00000000000000000d60",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3962028784780873,
                                    "NDVI": 0.270428967338462,
                                    "Name": "Machamba 2",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.98522021151816
                                }
                            },
                            {
                                "id": "00000000000000000d5f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.396239698077157,
                                    "NDVI": 0.27045298554698427,
                                    "Name": "Machamba_A",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.98085825864672
                                }
                            },
                            {
                                "id": "00000000000000000d97",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23985620226988472,
                                    "NDVI": 0.17076024577827417,
                                    "Name": "BNP western polygon",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 68.49173938590198
                                }
                            },
                            {
                                "id": "00000000000000000d74",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24162048112949225,
                                    "NDVI": 0.1717633126150561,
                                    "Name": "Bahine National Park",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 68.01618316098131
                                }
                            },
                            {
                                "id": "00000000000000000d70",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1746502194725212,
                                    "NDVI": 0.12640761221273775,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 71.48544189192393
                                }
                            },
                            {
                                "id": "00000000000000000d88",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2064350543279659,
                                    "NDVI": 0.14809876789343362,
                                    "Name": "Machamba 2",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 73.35894318729451
                                }
                            },
                            {
                                "id": "00000000000000000d87",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.206459570319793,
                                    "NDVI": 0.14811587849081737,
                                    "Name": "Machamba_A",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 73.35713834451188
                                }
                            },
                            {
                                "id": "00000000000000000dbf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2991483985163314,
                                    "NDVI": 0.20830436421731896,
                                    "Name": "BNP western polygon",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 68.33505061753569
                                }
                            },
                            {
                                "id": "00000000000000000d9c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2573612437711682,
                                    "NDVI": 0.1809200098739082,
                                    "Name": "Bahine National Park",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 72.48127573695633
                                }
                            },
                            {
                                "id": "00000000000000000d98",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23423455690455527,
                                    "NDVI": 0.165839051651565,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 74.43415108603746
                                }
                            },
                            {
                                "id": "00000000000000000db0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23044574213705085,
                                    "NDVI": 0.163167472892508,
                                    "Name": "Machamba 2",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 76.76280107144373
                                }
                            },
                            {
                                "id": "00000000000000000daf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.230474380884813,
                                    "NDVI": 0.16318720422390806,
                                    "Name": "Machamba_A",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 76.76158266664187
                                }
                            },
                            {
                                "id": "00000000000000000de7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4021480764808842,
                                    "NDVI": 0.27332291810978976,
                                    "Name": "BNP western polygon",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 53.97223713166712
                                }
                            },
                            {
                                "id": "00000000000000000dc4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36789797743283453,
                                    "NDVI": 0.25130911167015463,
                                    "Name": "Bahine National Park",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 57.73534559587409
                                }
                            },
                            {
                                "id": "00000000000000000dc0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3915070694797783,
                                    "NDVI": 0.2662614807362243,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 54.60303153049906
                                }
                            },
                            {
                                "id": "00000000000000000dd8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3699745812934469,
                                    "NDVI": 0.253171688971944,
                                    "Name": "Machamba 2",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 56.1599164250978
                                }
                            },
                            {
                                "id": "00000000000000000dd7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.37002063747802166,
                                    "NDVI": 0.25320177240316,
                                    "Name": "Machamba_A",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 56.15454351764022
                                }
                            },
                            {
                                "id": "00000000000000000e0f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2988471024157962,
                                    "NDVI": 0.210261995535399,
                                    "Name": "BNP western polygon",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 62.697068465921205
                                }
                            },
                            {
                                "id": "00000000000000000dec",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30812856323340027,
                                    "NDVI": 0.21537182078777808,
                                    "Name": "Bahine National Park",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 62.269151527312225
                                }
                            },
                            {
                                "id": "00000000000000000de8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2582742190862988,
                                    "NDVI": 0.1831158892081924,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 66.0432091052189
                                }
                            },
                            {
                                "id": "00000000000000000e00",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.32159478567123007,
                                    "NDVI": 0.22438613579525343,
                                    "Name": "Machamba 2",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 59.50893802976909
                                }
                            },
                            {
                                "id": "00000000000000000dff",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3216482175188434,
                                    "NDVI": 0.22442189168515647,
                                    "Name": "Machamba_A",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 59.50287419279247
                                }
                            },
                            {
                                "id": "00000000000000000e37",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1795342195640924,
                                    "NDVI": 0.12992252169056565,
                                    "Name": "BNP western polygon",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 72.99486542639475
                                }
                            },
                            {
                                "id": "00000000000000000e14",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18973808466338823,
                                    "NDVI": 0.1365576153219193,
                                    "Name": "Bahine National Park",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 73.03240447400815
                                }
                            },
                            {
                                "id": "00000000000000000e10",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.15795700012313893,
                                    "NDVI": 0.1147347219910602,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 73.21244482748418
                                }
                            },
                            {
                                "id": "00000000000000000e28",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18534309241855929,
                                    "NDVI": 0.1333181184107805,
                                    "Name": "Machamba 2",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 75.18459126460863
                                }
                            },
                            {
                                "id": "00000000000000000e27",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18536266367650847,
                                    "NDVI": 0.13333174645080886,
                                    "Name": "Machamba_A",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 75.18387344219171
                                }
                            },
                            {
                                "id": "00000000000000000e5f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.15672573845518878,
                                    "NDVI": 0.11339400229322094,
                                    "Name": "BNP western polygon",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 78.27042110213783
                                }
                            },
                            {
                                "id": "00000000000000000e3c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1572509081221212,
                                    "NDVI": 0.11319781437094915,
                                    "Name": "Bahine National Park",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 77.8750900551403
                                }
                            },
                            {
                                "id": "00000000000000000e38",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.14779732874681137,
                                    "NDVI": 0.10695346709047236,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 77.0897749679337
                                }
                            },
                            {
                                "id": "00000000000000000e50",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.16398130598639565,
                                    "NDVI": 0.1178404698262152,
                                    "Name": "Machamba 2",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 79.91240870247493
                                }
                            },
                            {
                                "id": "00000000000000000e4f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1639982300787504,
                                    "NDVI": 0.11785234035314258,
                                    "Name": "Machamba_A",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 79.91235520800299
                                }
                            }
                        ],
                        "properties": {
                            "system:asset_size": 705844
                        }
                    }
                ]
            },
        },
        {
            "id": "2",
            "order": 4,
            "type": "chart",
            "title": "Limpopo NP - NDVI",
            "size": 3,
            "height": "large",
            "content": null,
            "config": {
                "chartType": "line",
            },
            "hasData": true,
            "data": {
                "data": {
                    "period": {
                        "year": 2018
                    },
                    "variable": "NDVI",
                    "landscape": "Limpopo NP",
                    "locations": [
                        {
                            "lat": -23.549351331972545,
                            "lon": 31.858681110593636,
                            "community": "00000000000000000174",
                            "communityName": "Machamba 2",
                            "communityFeatureId": 449
                        },
                        {
                            "lat": -22.820242922752385,
                            "lon": 32.639018435357144,
                            "community": "00000000000000000160",
                            "communityName": "Bahine National Park",
                            "communityFeatureId": 429
                        }
                    ],
                    "custom_geom": null,
                    "analysisType": "Temporal",
                    "baselineEndDate": null,
                    "comparisonPeriod": {
                        "year": [
                            2020
                        ],
                        "month": [],
                        "quarter": []
                    },
                    "baselineStartDate": null,
                    "temporalResolution": "Annual",
                    "userDefinedFeatureId": null,
                    "userDefinedFeatureName": null
                },
                "results": [
                    {
                        "type": "FeatureCollection",
                        "columns": {
                            "EVI": "Float",
                            "NDVI": "Float",
                            "Name": "String",
                            "date": "Long",
                            "year": "Integer",
                            "Bare ground": "Float",
                            "system:index": "String"
                        },
                        "features": [
                            {
                                "id": "727",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4695950320635255,
                                    "NDVI": 0.3315168089662741,
                                    "Name": "BNP western polygon",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 9.037249088865885
                                }
                            },
                            {
                                "id": "728",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.43629795786145903,
                                    "NDVI": 0.3086322886343672,
                                    "Name": "Bahine National Park",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.557580039880225
                                }
                            },
                            {
                                "id": "918",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.37798484256893405,
                                    "NDVI": 0.27297072786582344,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 9.55109994591242
                                }
                            },
                            {
                                "id": "982",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.3725614792232661,
                                    "NDVI": 0.27075764539804564,
                                    "Name": "Machamba 2",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.903834326154385
                                }
                            },
                            {
                                "id": "983",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.37261676216063927,
                                    "NDVI": 0.27079620264465915,
                                    "Name": "Machamba_A",
                                    "date": 1514764800000,
                                    "year": 2018,
                                    "Bare ground": 12.90207371142396
                                }
                            },
                            {
                                "id": "2041",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4609191298786209,
                                    "NDVI": 0.3247683194399842,
                                    "Name": "BNP western polygon",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 14.45459253024238
                                }
                            },
                            {
                                "id": "2042",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4098188951610506,
                                    "NDVI": 0.2906704059210686,
                                    "Name": "Bahine National Park",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 19.288214927011516
                                }
                            },
                            {
                                "id": "2232",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.4748475557606069,
                                    "NDVI": 0.33402703432708375,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 9.723272199631811
                                }
                            },
                            {
                                "id": "2296",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.45779797168942815,
                                    "NDVI": 0.3227924582492876,
                                    "Name": "Machamba 2",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 13.696265109903043
                                }
                            },
                            {
                                "id": "2297",
                                "type": "Feature",
                                "geometry": null,
                                "properties": {
                                    "EVI": 0.45787007508489574,
                                    "NDVI": 0.32284064830170506,
                                    "Name": "Machamba_A",
                                    "date": 1577836800000,
                                    "year": 2020,
                                    "Bare ground": 13.691476463105275
                                }
                            }
                        ],
                        "statistics": {
                            "2020": {
                                "Machamba 2": {
                                    "EVI": {
                                        "max": 0.5729638051617303,
                                        "min": 0.33205746016240184,
                                        "mean": 0.4577979716894281
                                    },
                                    "NDVI": {
                                        "max": 0.39646643012277766,
                                        "min": 0.2416182735018764,
                                        "mean": 0.3227924582492876
                                    },
                                    "Bare ground": {
                                        "max": 19.88554992895711,
                                        "min": 8.08712052273922,
                                        "mean": 13.696265109903043
                                    }
                                },
                                "Machamba_A": {
                                    "EVI": {
                                        "max": 0.5730414470796611,
                                        "min": 0.33210768719508377,
                                        "mean": 0.4578700750848958
                                    },
                                    "NDVI": {
                                        "max": 0.3965175483923984,
                                        "min": 0.24165279480376808,
                                        "mean": 0.32284064830170506
                                    },
                                    "Bare ground": {
                                        "max": 19.875740588539273,
                                        "min": 8.084741627515918,
                                        "mean": 13.691476463105275
                                    }
                                },
                                "BNP western polygon": {
                                    "EVI": {
                                        "max": 0.5500698600829751,
                                        "min": 0.33556730199309626,
                                        "mean": 0.4609191298786209
                                    },
                                    "NDVI": {
                                        "max": 0.38225614760487775,
                                        "min": 0.24533966577054345,
                                        "mean": 0.3247683194399842
                                    },
                                    "Bare ground": {
                                        "max": 18.56952173895803,
                                        "min": 10.50195669789604,
                                        "mean": 14.45459253024238
                                    }
                                },
                                "Bahine National Park": {
                                    "EVI": {
                                        "max": 0.5235891350745732,
                                        "min": 0.2916413181123904,
                                        "mean": 0.40981889516105063
                                    },
                                    "NDVI": {
                                        "max": 0.3615862755293638,
                                        "min": 0.21459955366169448,
                                        "mean": 0.2906704059210686
                                    },
                                    "Bare ground": {
                                        "max": 26.425618961202456,
                                        "min": 14.754189496818992,
                                        "mean": 19.288214927011513
                                    }
                                },
                                "Limpopo National Park Central": {
                                    "EVI": {
                                        "max": 0.6423261767744879,
                                        "min": 0.2965242125476117,
                                        "mean": 0.4748475557606069
                                    },
                                    "NDVI": {
                                        "max": 0.4352308211797352,
                                        "min": 0.21988657856929497,
                                        "mean": 0.33402703432708375
                                    },
                                    "Bare ground": {
                                        "max": 13.106162170392476,
                                        "min": 5.897350814383153,
                                        "mean": 9.723272199631811
                                    }
                                }
                            }
                        }
                    },
                    {
                        "id": "projects/ee-yekelaso1818/assets/Temporal_pre_export_20241202",
                        "type": "FeatureCollection",
                        "columns": {
                            "date": "Long"
                        },
                        "version": 1733164362540944,
                        "features": [
                            {
                                "id": "00000000000000000987",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.85495483701733,
                                    "NDVI": 0.5472915756967119,
                                    "Name": "BNP western polygon",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 8.893449984668786
                                }
                            },
                            {
                                "id": "00000000000000000964",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.788239496137923,
                                    "NDVI": 0.5102211821729893,
                                    "Name": "Bahine National Park",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.379173327831984
                                }
                            },
                            {
                                "id": "00000000000000000960",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8259463581665435,
                                    "NDVI": 0.5321435695251074,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 6.181607809728489
                                }
                            },
                            {
                                "id": "00000000000000000978",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7322094532992601,
                                    "NDVI": 0.48238966910067366,
                                    "Name": "Machamba 2",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.11526263339653
                                }
                            },
                            {
                                "id": "00000000000000000977",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7322015017416681,
                                    "NDVI": 0.4823910621743738,
                                    "Name": "Machamba_A",
                                    "date": 1485907200000,
                                    "year": 2017,
                                    "month": 1,
                                    "Bare ground": 10.112766127197492
                                }
                            },
                            {
                                "id": "000000000000000009af",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6505001129552291,
                                    "NDVI": 0.4509795054381152,
                                    "Name": "BNP western polygon",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 3.582137172215512
                                }
                            },
                            {
                                "id": "0000000000000000098c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.613609355660973,
                                    "NDVI": 0.4271978805201294,
                                    "Name": "Bahine National Park",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.715974222226792
                                }
                            },
                            {
                                "id": "00000000000000000988",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5470037100194012,
                                    "NDVI": 0.3853917839474786,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.3263316802563345
                                }
                            },
                            {
                                "id": "000000000000000009a0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5834155799972212,
                                    "NDVI": 0.4074279715227161,
                                    "Name": "Machamba 2",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.286241505965498
                                }
                            },
                            {
                                "id": "0000000000000000099f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5835113473103551,
                                    "NDVI": 0.40749106677001734,
                                    "Name": "Machamba_A",
                                    "date": 1493596800000,
                                    "year": 2017,
                                    "month": 4,
                                    "Bare ground": 5.282533897934344
                                }
                            },
                            {
                                "id": "000000000000000009d7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.42358333850631447,
                                    "NDVI": 0.307281229635695,
                                    "Name": "BNP western polygon",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 10.41642687996423
                                }
                            },
                            {
                                "id": "000000000000000009b4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4179296411500794,
                                    "NDVI": 0.3027068963252161,
                                    "Name": "Bahine National Park",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.206003337775131
                                }
                            },
                            {
                                "id": "000000000000000009b0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3015283476088467,
                                    "NDVI": 0.22338373898558683,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 10.489362048455646
                                }
                            },
                            {
                                "id": "000000000000000009c8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.32246395536806116,
                                    "NDVI": 0.23672718878191015,
                                    "Name": "Machamba 2",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.592298067816598
                                }
                            },
                            {
                                "id": "000000000000000009c7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.322506128794119,
                                    "NDVI": 0.2367576497105985,
                                    "Name": "Machamba_A",
                                    "date": 1501545600000,
                                    "year": 2017,
                                    "month": 7,
                                    "Bare ground": 11.583995875790784
                                }
                            },
                            {
                                "id": "000000000000000009ff",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3643776400460183,
                                    "NDVI": 0.2672656418779298,
                                    "Name": "BNP western polygon",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 10.253488026850588
                                }
                            },
                            {
                                "id": "000000000000000009dc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34289093962769235,
                                    "NDVI": 0.25053173466067313,
                                    "Name": "Bahine National Park",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 14.379848626437788
                                }
                            },
                            {
                                "id": "000000000000000009d8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.26344669167735896,
                                    "NDVI": 0.1968140307427279,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 9.455775609561927
                                }
                            },
                            {
                                "id": "000000000000000009f0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2416714433479389,
                                    "NDVI": 0.18019892644792956,
                                    "Name": "Machamba 2",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 11.810349687745456
                                }
                            },
                            {
                                "id": "000000000000000009ef",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24169552011911768,
                                    "NDVI": 0.18021696143182028,
                                    "Name": "Machamba_A",
                                    "date": 1509494400000,
                                    "year": 2017,
                                    "month": 10,
                                    "Bare ground": 11.799948007369755
                                }
                            },
                            {
                                "id": "00000000000000000a27",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6509225780859329,
                                    "NDVI": 0.4425926467561585,
                                    "Name": "BNP western polygon",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 8.07232248044919
                                }
                            },
                            {
                                "id": "00000000000000000a04",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6108852217255603,
                                    "NDVI": 0.41680982151821006,
                                    "Name": "Bahine National Park",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 11.664147660938491
                                }
                            },
                            {
                                "id": "00000000000000000a00",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.547634710917738,
                                    "NDVI": 0.38133847693999784,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 9.224079675020205
                                }
                            },
                            {
                                "id": "00000000000000000a18",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4151760479569597,
                                    "NDVI": 0.3016892402439638,
                                    "Name": "Machamba 2",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 13.883854337124696
                                }
                            },
                            {
                                "id": "00000000000000000a17",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.415244702234996,
                                    "NDVI": 0.30173731611839794,
                                    "Name": "Machamba_A",
                                    "date": 1517443200000,
                                    "year": 2018,
                                    "month": 1,
                                    "Bare ground": 13.883778152254695
                                }
                            },
                            {
                                "id": "00000000000000000a4f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6191915082424767,
                                    "NDVI": 0.4325149258415639,
                                    "Name": "BNP western polygon",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 4.850705262826095
                                }
                            },
                            {
                                "id": "00000000000000000a2c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5780592917887416,
                                    "NDVI": 0.40460286247689425,
                                    "Name": "Bahine National Park",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 6.988743874933611
                                }
                            },
                            {
                                "id": "00000000000000000a28",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.48295263931280297,
                                    "NDVI": 0.34852144901601456,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 6.36817941309296
                                }
                            },
                            {
                                "id": "00000000000000000a40",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5413546198901411,
                                    "NDVI": 0.3837070996395632,
                                    "Name": "Machamba 2",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 7.003374688537098
                                }
                            },
                            {
                                "id": "00000000000000000a3f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5414385390547295,
                                    "NDVI": 0.38376377958476665,
                                    "Name": "Machamba_A",
                                    "date": 1525132800000,
                                    "year": 2018,
                                    "month": 4,
                                    "Bare ground": 7.000887946655666
                                }
                            },
                            {
                                "id": "00000000000000000a77",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.31973713022641653,
                                    "NDVI": 0.23851828034529635,
                                    "Name": "BNP western polygon",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.013722945173678
                                }
                            },
                            {
                                "id": "00000000000000000a54",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2993458790802785,
                                    "NDVI": 0.22359243941618528,
                                    "Name": "Bahine National Park",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.706193974311423
                                }
                            },
                            {
                                "id": "00000000000000000a50",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23950231999740249,
                                    "NDVI": 0.18188081733501624,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 10.39943707303038
                                }
                            },
                            {
                                "id": "00000000000000000a68",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2853765941667647,
                                    "NDVI": 0.2137771629384836,
                                    "Name": "Machamba 2",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.886354197034764
                                }
                            },
                            {
                                "id": "00000000000000000a67",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2854183420090945,
                                    "NDVI": 0.21380719209458396,
                                    "Name": "Machamba_A",
                                    "date": 1533081600000,
                                    "year": 2018,
                                    "month": 7,
                                    "Bare ground": 9.886536308624956
                                }
                            },
                            {
                                "id": "00000000000000000a9f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.28852891169927586,
                                    "NDVI": 0.21244138292207776,
                                    "Name": "BNP western polygon",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 14.212245667014576
                                }
                            },
                            {
                                "id": "00000000000000000a7c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.25690143885125555,
                                    "NDVI": 0.18952403112617924,
                                    "Name": "Bahine National Park",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 21.87123464933737
                                }
                            },
                            {
                                "id": "00000000000000000a78",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24184970004779285,
                                    "NDVI": 0.18014216817226503,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 12.212703622506137
                                }
                            },
                            {
                                "id": "00000000000000000a90",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24833865487919887,
                                    "NDVI": 0.183857078770172,
                                    "Name": "Machamba 2",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 20.841754081920985
                                }
                            },
                            {
                                "id": "00000000000000000a8f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24836546534373696,
                                    "NDVI": 0.183876522780888,
                                    "Name": "Machamba_A",
                                    "date": 1541030400000,
                                    "year": 2018,
                                    "month": 10,
                                    "Bare ground": 20.83709243816052
                                }
                            },
                            {
                                "id": "00000000000000000ac7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6700598919557141,
                                    "NDVI": 0.447952767416284,
                                    "Name": "BNP western polygon",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 11.717480507578788
                                }
                            },
                            {
                                "id": "00000000000000000aa4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.629990050040012,
                                    "NDVI": 0.4235883022080698,
                                    "Name": "Bahine National Park",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.25809003931379
                                }
                            },
                            {
                                "id": "00000000000000000aa0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6169765336794916,
                                    "NDVI": 0.4195722284308421,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 10.240456980660982
                                }
                            },
                            {
                                "id": "00000000000000000ab8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5389132728390554,
                                    "NDVI": 0.3726157305034974,
                                    "Name": "Machamba 2",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.998924624965127
                                }
                            },
                            {
                                "id": "00000000000000000ab7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5389764286473481,
                                    "NDVI": 0.3726572670480194,
                                    "Name": "Machamba_A",
                                    "date": 1548979200000,
                                    "year": 2019,
                                    "month": 1,
                                    "Bare ground": 14.992901013139509
                                }
                            },
                            {
                                "id": "00000000000000000aef",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.48908124893112664,
                                    "NDVI": 0.34783003393759643,
                                    "Name": "BNP western polygon",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 10.113485493766031
                                }
                            },
                            {
                                "id": "00000000000000000acc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4738521136366971,
                                    "NDVI": 0.3352189201607451,
                                    "Name": "Bahine National Park",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 12.66824705615648
                                }
                            },
                            {
                                "id": "00000000000000000ac8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4596854254257808,
                                    "NDVI": 0.32884583642118204,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.875020228171779
                                }
                            },
                            {
                                "id": "00000000000000000ae0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5548073065609186,
                                    "NDVI": 0.3884636754478395,
                                    "Name": "Machamba 2",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.244973140103997
                                }
                            },
                            {
                                "id": "00000000000000000adf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5549176655991532,
                                    "NDVI": 0.38853704947587503,
                                    "Name": "Machamba_A",
                                    "date": 1556668800000,
                                    "year": 2019,
                                    "month": 4,
                                    "Bare ground": 7.241803745248756
                                }
                            },
                            {
                                "id": "00000000000000000b17",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3163713689143198,
                                    "NDVI": 0.232912112661022,
                                    "Name": "BNP western polygon",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 10.09992694946952
                                }
                            },
                            {
                                "id": "00000000000000000af4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2977941332105649,
                                    "NDVI": 0.21921382123484387,
                                    "Name": "Bahine National Park",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 11.86991043066086
                                }
                            },
                            {
                                "id": "00000000000000000af0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2715490438216425,
                                    "NDVI": 0.2019167386994745,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 10.228592032241073
                                }
                            },
                            {
                                "id": "00000000000000000b08",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30965088134719043,
                                    "NDVI": 0.2267650046255877,
                                    "Name": "Machamba 2",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 13.278842930432427
                                }
                            },
                            {
                                "id": "00000000000000000b07",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30969372545679485,
                                    "NDVI": 0.22679489804169695,
                                    "Name": "Machamba_A",
                                    "date": 1564617600000,
                                    "year": 2019,
                                    "month": 7,
                                    "Bare ground": 13.279181035033272
                                }
                            },
                            {
                                "id": "00000000000000000b3f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3434291317339757,
                                    "NDVI": 0.24763109735052877,
                                    "Name": "BNP western polygon",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 21.859149759713823
                                }
                            },
                            {
                                "id": "00000000000000000b1c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3407335928751696,
                                    "NDVI": 0.2435971838691636,
                                    "Name": "Bahine National Park",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 28.155220124181263
                                }
                            },
                            {
                                "id": "00000000000000000b18",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2827590836324765,
                                    "NDVI": 0.20729087592805664,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 13.535640209930127
                                }
                            },
                            {
                                "id": "00000000000000000b30",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.31513646130982753,
                                    "NDVI": 0.22782037474681743,
                                    "Name": "Machamba 2",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 22.838910769887818
                                }
                            },
                            {
                                "id": "00000000000000000b2f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3151746775007484,
                                    "NDVI": 0.22784733976122,
                                    "Name": "Machamba_A",
                                    "date": 1572566400000,
                                    "year": 2019,
                                    "month": 10,
                                    "Bare ground": 22.830161689648467
                                }
                            },
                            {
                                "id": "00000000000000000b67",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5500698600829751,
                                    "NDVI": 0.3786849487930583,
                                    "Name": "BNP western polygon",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 18.171063410972977
                                }
                            },
                            {
                                "id": "00000000000000000b44",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5235891350745732,
                                    "NDVI": 0.3615862755293638,
                                    "Name": "Bahine National Park",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 20.955323516017017
                                }
                            },
                            {
                                "id": "00000000000000000b40",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6423261767744879,
                                    "NDVI": 0.4352308211797352,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 8.98706113459109
                                }
                            },
                            {
                                "id": "00000000000000000b58",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5729638051617303,
                                    "NDVI": 0.39646643012277766,
                                    "Name": "Machamba 2",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 11.88545436133703
                                }
                            },
                            {
                                "id": "00000000000000000b57",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5730414470796611,
                                    "NDVI": 0.3965175483923984,
                                    "Name": "Machamba_A",
                                    "date": 1580515200000,
                                    "year": 2020,
                                    "month": 1,
                                    "Bare ground": 11.878623606274031
                                }
                            },
                            {
                                "id": "00000000000000000b8f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5483092333855671,
                                    "NDVI": 0.38225614760487775,
                                    "Name": "BNP western polygon",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 10.575828273142472
                                }
                            },
                            {
                                "id": "00000000000000000b6c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4597782080478948,
                                    "NDVI": 0.3254252084507938,
                                    "Name": "Bahine National Park",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 14.754189496818992
                                }
                            },
                            {
                                "id": "00000000000000000b68",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5351194158986845,
                                    "NDVI": 0.3773347281100046,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 5.897350814383153
                                }
                            },
                            {
                                "id": "00000000000000000b80",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5632643095460413,
                                    "NDVI": 0.3922711838363151,
                                    "Name": "Machamba 2",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 8.08712052273922
                                }
                            },
                            {
                                "id": "00000000000000000b7f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5633816088747479,
                                    "NDVI": 0.3923483473799717,
                                    "Name": "Machamba_A",
                                    "date": 1588291200000,
                                    "year": 2020,
                                    "month": 4,
                                    "Bare ground": 8.084741627515918
                                }
                            },
                            {
                                "id": "00000000000000000bb7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33556730199309626,
                                    "NDVI": 0.24533966577054345,
                                    "Name": "BNP western polygon",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 10.50195669789604
                                }
                            },
                            {
                                "id": "00000000000000000b94",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2916413181123904,
                                    "NDVI": 0.21459955366169448,
                                    "Name": "Bahine National Park",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 15.017727734007591
                                }
                            },
                            {
                                "id": "00000000000000000b90",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2965242125476117,
                                    "NDVI": 0.21988657856929497,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 10.902514679160523
                                }
                            },
                            {
                                "id": "00000000000000000ba8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33205746016240184,
                                    "NDVI": 0.2416182735018764,
                                    "Name": "Machamba 2",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 14.92693562657881
                                }
                            },
                            {
                                "id": "00000000000000000ba7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33210768719508377,
                                    "NDVI": 0.24165279480376808,
                                    "Name": "Machamba_A",
                                    "date": 1596240000000,
                                    "year": 2020,
                                    "month": 7,
                                    "Bare ground": 14.92680003009188
                                }
                            },
                            {
                                "id": "00000000000000000bdf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.409730124052845,
                                    "NDVI": 0.2927925155914573,
                                    "Name": "BNP western polygon",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 18.56952173895803
                                }
                            },
                            {
                                "id": "00000000000000000bbc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.364266919409344,
                                    "NDVI": 0.2610705860424223,
                                    "Name": "Bahine National Park",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 26.425618961202456
                                }
                            },
                            {
                                "id": "00000000000000000bb8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.42542041782164336,
                                    "NDVI": 0.30365600944930016,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 13.106162170392476
                                }
                            },
                            {
                                "id": "00000000000000000bd0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36290631188753897,
                                    "NDVI": 0.26081394553618126,
                                    "Name": "Machamba 2",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 19.88554992895711
                                }
                            },
                            {
                                "id": "00000000000000000bcf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3629495571900905,
                                    "NDVI": 0.26084390263068213,
                                    "Name": "Machamba_A",
                                    "date": 1604188800000,
                                    "year": 2020,
                                    "month": 10,
                                    "Bare ground": 19.875740588539273
                                }
                            },
                            {
                                "id": "00000000000000000c07",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8726658352741172,
                                    "NDVI": 0.5593752230406576,
                                    "Name": "BNP western polygon",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.437298239416296
                                }
                            },
                            {
                                "id": "00000000000000000be4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7802342004483362,
                                    "NDVI": 0.5078118313380994,
                                    "Name": "Bahine National Park",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 5.662817344529138
                                }
                            },
                            {
                                "id": "00000000000000000be0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.8947685554295333,
                                    "NDVI": 0.5700359941975318,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.258803081467935
                                }
                            },
                            {
                                "id": "00000000000000000bf8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.9068816692541036,
                                    "NDVI": 0.572615523343413,
                                    "Name": "Machamba 2",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.871721075001356
                                }
                            },
                            {
                                "id": "00000000000000000bf7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.9069619953947322,
                                    "NDVI": 0.5726614197650479,
                                    "Name": "Machamba_A",
                                    "date": 1612137600000,
                                    "year": 2021,
                                    "month": 1,
                                    "Bare ground": 4.868844550857666
                                }
                            },
                            {
                                "id": "00000000000000000c2f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7133116024088906,
                                    "NDVI": 0.48492134533596626,
                                    "Name": "BNP western polygon",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 3.2444857283541513
                                }
                            },
                            {
                                "id": "00000000000000000c0c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6383708467161011,
                                    "NDVI": 0.4398052374331354,
                                    "Name": "Bahine National Park",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.440119398437476
                                }
                            },
                            {
                                "id": "00000000000000000c08",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.6960831372862759,
                                    "NDVI": 0.47434194867687574,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 3.841451152280773
                                }
                            },
                            {
                                "id": "00000000000000000c20",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.7621144382099395,
                                    "NDVI": 0.5063912359928054,
                                    "Name": "Machamba 2",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.112476024295802
                                }
                            },
                            {
                                "id": "00000000000000000c1f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.762213977923599,
                                    "NDVI": 0.5064510598348534,
                                    "Name": "Machamba_A",
                                    "date": 1619827200000,
                                    "year": 2021,
                                    "month": 4,
                                    "Bare ground": 4.108919939177857
                                }
                            },
                            {
                                "id": "00000000000000000c57",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.5038093873100171,
                                    "NDVI": 0.3618628340216633,
                                    "Name": "BNP western polygon",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 6.147844186365297
                                }
                            },
                            {
                                "id": "00000000000000000c34",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4511046597196804,
                                    "NDVI": 0.3281766725581113,
                                    "Name": "Bahine National Park",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 7.578342652700807
                                }
                            },
                            {
                                "id": "00000000000000000c30",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3969882713648644,
                                    "NDVI": 0.2908416470072133,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 9.088986472041038
                                }
                            },
                            {
                                "id": "00000000000000000c48",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.459093274312982,
                                    "NDVI": 0.32956008117390156,
                                    "Name": "Machamba 2",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 8.664179188745393
                                }
                            },
                            {
                                "id": "00000000000000000c47",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4591660495783933,
                                    "NDVI": 0.32961015080892675,
                                    "Name": "Machamba_A",
                                    "date": 1627776000000,
                                    "year": 2021,
                                    "month": 7,
                                    "Bare ground": 8.6626247320213
                                }
                            },
                            {
                                "id": "00000000000000000c7f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4539338189166745,
                                    "NDVI": 0.3232581861712215,
                                    "Name": "BNP western polygon",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 10.807019345967722
                                }
                            },
                            {
                                "id": "00000000000000000c5c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.39556659330843,
                                    "NDVI": 0.2856441365870216,
                                    "Name": "Bahine National Park",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 13.647500591528184
                                }
                            },
                            {
                                "id": "00000000000000000c58",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3170163155904578,
                                    "NDVI": 0.23494655984121168,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 9.566699989595
                                }
                            },
                            {
                                "id": "00000000000000000c70",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.319431802602076,
                                    "NDVI": 0.2359060782854503,
                                    "Name": "Machamba 2",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 11.6816152554833
                                }
                            },
                            {
                                "id": "00000000000000000c6f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.319453098662023,
                                    "NDVI": 0.2359226795431968,
                                    "Name": "Machamba_A",
                                    "date": 1635724800000,
                                    "year": 2021,
                                    "month": 10,
                                    "Bare ground": 11.672271873274983
                                }
                            },
                            {
                                "id": "00000000000000000ca7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.389655693889272,
                                    "NDVI": 0.2655679349038552,
                                    "Name": "BNP western polygon",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 55.22865956621969
                                }
                            },
                            {
                                "id": "00000000000000000c84",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.35958660769055056,
                                    "NDVI": 0.24604317675520992,
                                    "Name": "Bahine National Park",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.77551251489348
                                }
                            },
                            {
                                "id": "00000000000000000c80",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.39341122500767495,
                                    "NDVI": 0.26729830572023516,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 54.681300873076545
                                }
                            },
                            {
                                "id": "00000000000000000c98",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34170755452284995,
                                    "NDVI": 0.23615649975166592,
                                    "Name": "Machamba 2",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.3871726664599
                                }
                            },
                            {
                                "id": "00000000000000000c97",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.34174628731974427,
                                    "NDVI": 0.23618253244554768,
                                    "Name": "Machamba_A",
                                    "date": 1643673600000,
                                    "year": 2022,
                                    "month": 1,
                                    "Bare ground": 58.381732158341386
                                }
                            },
                            {
                                "id": "00000000000000000ccf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3399350298480299,
                                    "NDVI": 0.23750892284818048,
                                    "Name": "BNP western polygon",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 56.647643454528605
                                }
                            },
                            {
                                "id": "00000000000000000cac",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.33959576086751364,
                                    "NDVI": 0.23604802742279157,
                                    "Name": "Bahine National Park",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 58.42588142920337
                                }
                            },
                            {
                                "id": "00000000000000000ca8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36131848106429953,
                                    "NDVI": 0.2503503016126336,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 53.93683855256363
                                }
                            },
                            {
                                "id": "00000000000000000cc0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.392929687960144,
                                    "NDVI": 0.2695002701782491,
                                    "Name": "Machamba 2",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 52.203578552770566
                                }
                            },
                            {
                                "id": "00000000000000000cbf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3929969824807518,
                                    "NDVI": 0.26954407310364936,
                                    "Name": "Machamba_A",
                                    "date": 1651363200000,
                                    "year": 2022,
                                    "month": 4,
                                    "Bare ground": 52.19576319724304
                                }
                            },
                            {
                                "id": "00000000000000000cf7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.183448332273246,
                                    "NDVI": 0.13247247608605614,
                                    "Name": "BNP western polygon",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 72.93383272802524
                                }
                            },
                            {
                                "id": "00000000000000000cd4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18539374721835564,
                                    "NDVI": 0.13331443062364554,
                                    "Name": "Bahine National Park",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 74.2805982365135
                                }
                            },
                            {
                                "id": "00000000000000000cd0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.20972144854501767,
                                    "NDVI": 0.15062666016787643,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 70.75382455848836
                                }
                            },
                            {
                                "id": "00000000000000000ce8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2717632745177543,
                                    "NDVI": 0.1919629978706011,
                                    "Name": "Machamba 2",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 67.48475575897943
                                }
                            },
                            {
                                "id": "00000000000000000ce7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2717987379995947,
                                    "NDVI": 0.19198718701187556,
                                    "Name": "Machamba_A",
                                    "date": 1659312000000,
                                    "year": 2022,
                                    "month": 7,
                                    "Bare ground": 67.48117707959686
                                }
                            },
                            {
                                "id": "00000000000000000d1f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2552577689082169,
                                    "NDVI": 0.17875530223893557,
                                    "Name": "BNP western polygon",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 72.39515129830308
                                }
                            },
                            {
                                "id": "00000000000000000cfc",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2511389581353002,
                                    "NDVI": 0.1758354189374756,
                                    "Name": "Bahine National Park",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 73.19149219522399
                                }
                            },
                            {
                                "id": "00000000000000000cf8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.26855224535438543,
                                    "NDVI": 0.18751604582511944,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 69.79839711392698
                                }
                            },
                            {
                                "id": "00000000000000000d10",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.22315651512472368,
                                    "NDVI": 0.15796660613625058,
                                    "Name": "Machamba 2",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 76.4158096460583
                                }
                            },
                            {
                                "id": "00000000000000000d0f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.22318467351774143,
                                    "NDVI": 0.15798612927311104,
                                    "Name": "Machamba_A",
                                    "date": 1667260800000,
                                    "year": 2022,
                                    "month": 10,
                                    "Bare ground": 76.41483382043367
                                }
                            },
                            {
                                "id": "00000000000000000d47",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4336104423010979,
                                    "NDVI": 0.29085180538808547,
                                    "Name": "BNP western polygon",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.76706521868143
                                }
                            },
                            {
                                "id": "00000000000000000d24",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3908203847406519,
                                    "NDVI": 0.2637926543598522,
                                    "Name": "Bahine National Park",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 53.78542311089545
                                }
                            },
                            {
                                "id": "00000000000000000d20",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.43774050734657416,
                                    "NDVI": 0.29345831727126753,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 51.469789298203146
                                }
                            },
                            {
                                "id": "00000000000000000d38",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.44888921160278206,
                                    "NDVI": 0.29960488626157417,
                                    "Name": "Machamba 2",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.09778225346077
                                }
                            },
                            {
                                "id": "00000000000000000d37",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4489300412977442,
                                    "NDVI": 0.29963013899729046,
                                    "Name": "Machamba_A",
                                    "date": 1675209600000,
                                    "year": 2023,
                                    "month": 1,
                                    "Bare ground": 52.09509607825037
                                }
                            },
                            {
                                "id": "00000000000000000d6f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4009300331093532,
                                    "NDVI": 0.27402443067258586,
                                    "Name": "BNP western polygon",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.135433862823426
                                }
                            },
                            {
                                "id": "00000000000000000d4c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3718394478129795,
                                    "NDVI": 0.25512803903211523,
                                    "Name": "Bahine National Park",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 53.44207994404266
                                }
                            },
                            {
                                "id": "00000000000000000d48",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36862722424484545,
                                    "NDVI": 0.2535804658442324,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 54.135890583319906
                                }
                            },
                            {
                                "id": "00000000000000000d60",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3962028784780873,
                                    "NDVI": 0.270428967338462,
                                    "Name": "Machamba 2",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.98522021151816
                                }
                            },
                            {
                                "id": "00000000000000000d5f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.396239698077157,
                                    "NDVI": 0.27045298554698427,
                                    "Name": "Machamba_A",
                                    "date": 1682899200000,
                                    "year": 2023,
                                    "month": 4,
                                    "Bare ground": 52.98085825864672
                                }
                            },
                            {
                                "id": "00000000000000000d97",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23985620226988472,
                                    "NDVI": 0.17076024577827417,
                                    "Name": "BNP western polygon",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 68.49173938590198
                                }
                            },
                            {
                                "id": "00000000000000000d74",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.24162048112949225,
                                    "NDVI": 0.1717633126150561,
                                    "Name": "Bahine National Park",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 68.01618316098131
                                }
                            },
                            {
                                "id": "00000000000000000d70",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1746502194725212,
                                    "NDVI": 0.12640761221273775,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 71.48544189192393
                                }
                            },
                            {
                                "id": "00000000000000000d88",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2064350543279659,
                                    "NDVI": 0.14809876789343362,
                                    "Name": "Machamba 2",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 73.35894318729451
                                }
                            },
                            {
                                "id": "00000000000000000d87",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.206459570319793,
                                    "NDVI": 0.14811587849081737,
                                    "Name": "Machamba_A",
                                    "date": 1690848000000,
                                    "year": 2023,
                                    "month": 7,
                                    "Bare ground": 73.35713834451188
                                }
                            },
                            {
                                "id": "00000000000000000dbf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2991483985163314,
                                    "NDVI": 0.20830436421731896,
                                    "Name": "BNP western polygon",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 68.33505061753569
                                }
                            },
                            {
                                "id": "00000000000000000d9c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2573612437711682,
                                    "NDVI": 0.1809200098739082,
                                    "Name": "Bahine National Park",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 72.48127573695633
                                }
                            },
                            {
                                "id": "00000000000000000d98",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23423455690455527,
                                    "NDVI": 0.165839051651565,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 74.43415108603746
                                }
                            },
                            {
                                "id": "00000000000000000db0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.23044574213705085,
                                    "NDVI": 0.163167472892508,
                                    "Name": "Machamba 2",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 76.76280107144373
                                }
                            },
                            {
                                "id": "00000000000000000daf",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.230474380884813,
                                    "NDVI": 0.16318720422390806,
                                    "Name": "Machamba_A",
                                    "date": 1698796800000,
                                    "year": 2023,
                                    "month": 10,
                                    "Bare ground": 76.76158266664187
                                }
                            },
                            {
                                "id": "00000000000000000de7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.4021480764808842,
                                    "NDVI": 0.27332291810978976,
                                    "Name": "BNP western polygon",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 53.97223713166712
                                }
                            },
                            {
                                "id": "00000000000000000dc4",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.36789797743283453,
                                    "NDVI": 0.25130911167015463,
                                    "Name": "Bahine National Park",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 57.73534559587409
                                }
                            },
                            {
                                "id": "00000000000000000dc0",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3915070694797783,
                                    "NDVI": 0.2662614807362243,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 54.60303153049906
                                }
                            },
                            {
                                "id": "00000000000000000dd8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3699745812934469,
                                    "NDVI": 0.253171688971944,
                                    "Name": "Machamba 2",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 56.1599164250978
                                }
                            },
                            {
                                "id": "00000000000000000dd7",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.37002063747802166,
                                    "NDVI": 0.25320177240316,
                                    "Name": "Machamba_A",
                                    "date": 1706745600000,
                                    "year": 2024,
                                    "month": 1,
                                    "Bare ground": 56.15454351764022
                                }
                            },
                            {
                                "id": "00000000000000000e0f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2988471024157962,
                                    "NDVI": 0.210261995535399,
                                    "Name": "BNP western polygon",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 62.697068465921205
                                }
                            },
                            {
                                "id": "00000000000000000dec",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.30812856323340027,
                                    "NDVI": 0.21537182078777808,
                                    "Name": "Bahine National Park",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 62.269151527312225
                                }
                            },
                            {
                                "id": "00000000000000000de8",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.2582742190862988,
                                    "NDVI": 0.1831158892081924,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 66.0432091052189
                                }
                            },
                            {
                                "id": "00000000000000000e00",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.32159478567123007,
                                    "NDVI": 0.22438613579525343,
                                    "Name": "Machamba 2",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 59.50893802976909
                                }
                            },
                            {
                                "id": "00000000000000000dff",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.3216482175188434,
                                    "NDVI": 0.22442189168515647,
                                    "Name": "Machamba_A",
                                    "date": 1714521600000,
                                    "year": 2024,
                                    "month": 4,
                                    "Bare ground": 59.50287419279247
                                }
                            },
                            {
                                "id": "00000000000000000e37",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1795342195640924,
                                    "NDVI": 0.12992252169056565,
                                    "Name": "BNP western polygon",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 72.99486542639475
                                }
                            },
                            {
                                "id": "00000000000000000e14",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18973808466338823,
                                    "NDVI": 0.1365576153219193,
                                    "Name": "Bahine National Park",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 73.03240447400815
                                }
                            },
                            {
                                "id": "00000000000000000e10",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.15795700012313893,
                                    "NDVI": 0.1147347219910602,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 73.21244482748418
                                }
                            },
                            {
                                "id": "00000000000000000e28",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18534309241855929,
                                    "NDVI": 0.1333181184107805,
                                    "Name": "Machamba 2",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 75.18459126460863
                                }
                            },
                            {
                                "id": "00000000000000000e27",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.18536266367650847,
                                    "NDVI": 0.13333174645080886,
                                    "Name": "Machamba_A",
                                    "date": 1722470400000,
                                    "year": 2024,
                                    "month": 7,
                                    "Bare ground": 75.18387344219171
                                }
                            },
                            {
                                "id": "00000000000000000e5f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.15672573845518878,
                                    "NDVI": 0.11339400229322094,
                                    "Name": "BNP western polygon",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 78.27042110213783
                                }
                            },
                            {
                                "id": "00000000000000000e3c",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1572509081221212,
                                    "NDVI": 0.11319781437094915,
                                    "Name": "Bahine National Park",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 77.8750900551403
                                }
                            },
                            {
                                "id": "00000000000000000e38",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.14779732874681137,
                                    "NDVI": 0.10695346709047236,
                                    "Name": "Limpopo National Park Central",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 77.0897749679337
                                }
                            },
                            {
                                "id": "00000000000000000e50",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.16398130598639565,
                                    "NDVI": 0.1178404698262152,
                                    "Name": "Machamba 2",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 79.91240870247493
                                }
                            },
                            {
                                "id": "00000000000000000e4f",
                                "type": "Feature",
                                "geometry": {
                                    "type": "MultiPoint",
                                    "coordinates": []
                                },
                                "properties": {
                                    "EVI": 0.1639982300787504,
                                    "NDVI": 0.11785234035314258,
                                    "Name": "Machamba_A",
                                    "date": 1730419200000,
                                    "year": 2024,
                                    "month": 10,
                                    "Bare ground": 79.91235520800299
                                }
                            }
                        ],
                        "properties": {
                            "system:asset_size": 705844
                        }
                    }
                ]
            },
        },
        {
            "id": "3",
            "order": 5,
            "type": "table",
            "title": "Limpopo NP - Baseline",
            "size": 4,
            "height": "large",
            "content": null,
            "config": {
                "chartType": "bar",
            },
            "hasData": true,
            "data": {
                "data": {
                    "landscape": "Limpopo NP",
                    "locations": [
                        {
                            "lat": -23.636387846153383,
                            "lon": 32.40286371865312,
                            "community": "00000000000000000163",
                            "communityName": "Limpopo National Park South",
                            "communityFeatureId": 432
                        },
                        {
                            "lat": -22.947945714483907,
                            "lon": 32.70575781181873,
                            "community": "00000000000000000160",
                            "communityName": "Bahine National Park",
                            "communityFeatureId": 429
                        },
                        {
                            "lat": -22.668736275473776,
                            "lon": 31.43000896178887,
                            "community": "0000000000000000015d",
                            "communityName": "Limpopo National Park North",
                            "communityFeatureId": 426
                        }
                    ],
                    "custom_geom": null,
                    "analysisType": "Baseline",
                    "comparisonPeriod": {
                        "month": null,
                        "quarter": null
                    },
                    "userDefinedFeatureId": null,
                    "userDefinedFeatureName": null
                },
                "results": {
                    "id": "projects/ee-yekelaso1818/assets/CSA/Baseline_pre_export_20241007",
                    "type": "FeatureCollection",
                    "columns": {
                        "EVI": "Float",
                        "NDVI": "Float",
                        "Name": "String",
                        "area": "Float",
                        "Project": "String",
                        "Fires/yr": "Float",
                        "SOC kg/m2": "Float",
                        "system:index": "String",
                        "Bare ground %": "Float",
                        "Grass cover %": "Float",
                        "Woody cover %": "Float",
                        "SOC change kg/m2": "Float",
                        "Grazing capacity LSU/ha": "Float"
                    },
                    "version": 1728308738553469,
                    "features": [
                        {
                            "id": "0000000000000000015d",
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [
                                        [
                                            31.55780556371505,
                                            -23.17140601327735
                                        ],
                                        [
                                            31.603729650259154,
                                            -23.124680918411947
                                        ],
                                        [
                                            31.64630170251097,
                                            -23.075416829264842
                                        ],
                                        [
                                            31.752045094172782,
                                            -23.01728725382652
                                        ],
                                        [
                                            31.784211722398734,
                                            -23.00591115982221
                                        ],
                                        [
                                            31.81305088459269,
                                            -23.017287197802652
                                        ],
                                        [
                                            31.847383103710953,
                                            -22.99832653109984
                                        ],
                                        [
                                            31.873475649442188,
                                            -22.94901616089469
                                        ],
                                        [
                                            31.88720854858628,
                                            -22.941428388718847
                                        ],
                                        [
                                            31.90643464061185,
                                            -22.895892618187336
                                        ],
                                        [
                                            31.92027890868585,
                                            -22.892994857182725
                                        ],
                                        [
                                            31.919738294750417,
                                            -22.891599396981043
                                        ],
                                        [
                                            31.916192506539293,
                                            -22.887200806398884
                                        ],
                                        [
                                            31.91332000539584,
                                            -22.882488100740247
                                        ],
                                        [
                                            31.911569553228883,
                                            -22.878762799451575
                                        ],
                                        [
                                            31.90963951748301,
                                            -22.87319725266837
                                        ],
                                        [
                                            31.908337902933425,
                                            -22.868080577902703
                                        ],
                                        [
                                            31.90770953478476,
                                            -22.86305364285508
                                        ],
                                        [
                                            31.907664645006616,
                                            -22.85852043421506
                                        ],
                                        [
                                            31.908203321138455,
                                            -22.852999745537964
                                        ],
                                        [
                                            31.900707811050104,
                                            -22.848780717280178
                                        ],
                                        [
                                            31.895411570771227,
                                            -22.84469637675776
                                        ],
                                        [
                                            31.890788528282442,
                                            -22.840432435193414
                                        ],
                                        [
                                            31.884011184093048,
                                            -22.833296018991188
                                        ],
                                        [
                                            31.878804728137773,
                                            -22.82647374161547
                                        ],
                                        [
                                            31.874406202654868,
                                            -22.81799078835631
                                        ],
                                        [
                                            31.871399030156358,
                                            -22.8086550445986
                                        ],
                                        [
                                            31.869603616377066,
                                            -22.79882560352464
                                        ],
                                        [
                                            31.86982805554904,
                                            -22.790387549928422
                                        ],
                                        [
                                            31.857619780255288,
                                            -22.772748476062855
                                        ],
                                        [
                                            31.852144086345167,
                                            -22.762874074232617
                                        ],
                                        [
                                            31.84931639795843,
                                            -22.75685974796381
                                        ],
                                        [
                                            31.839262535173813,
                                            -22.75304472029848
                                        ],
                                        [
                                            31.83306869401556,
                                            -22.750082366749442
                                        ],
                                        [
                                            31.82512433907471,
                                            -22.748197295390238
                                        ],
                                        [
                                            31.819154859977534,
                                            -22.74581846228681
                                        ],
                                        [
                                            31.80910096264515,
                                            -22.739849005873534
                                        ],
                                        [
                                            31.80313149331455,
                                            -22.735136285799282
                                        ],
                                        [
                                            31.791865821439693,
                                            -22.722703553762003
                                        ],
                                        [
                                            31.788858587506077,
                                            -22.71834993924004
                                        ],
                                        [
                                            31.78639001883027,
                                            -22.71359227301611
                                        ],
                                        [
                                            31.77714404874087,
                                            -22.702236773019482
                                        ],
                                        [
                                            31.77431645418734,
                                            -22.697344534491908
                                        ],
                                        [
                                            31.772117145199385,
                                            -22.692497144967728
                                        ],
                                        [
                                            31.770546245811495,
                                            -22.68800875124375
                                        ],
                                        [
                                            31.769513891223045,
                                            -22.683385843419675
                                        ],
                                        [
                                            31.762557007244045,
                                            -22.684507894590812
                                        ],
                                        [
                                            31.753894573118046,
                                            -22.684687390843205
                                        ],
                                        [
                                            31.747835287654333,
                                            -22.684148814173117
                                        ],
                                        [
                                            31.740833490781796,
                                            -22.682622809004666
                                        ],
                                        [
                                            31.734190762071258,
                                            -22.68015418407602
                                        ],
                                        [
                                            31.728759881769335,
                                            -22.677236802011368
                                        ],
                                        [
                                            31.71852651257263,
                                            -22.674992613127994
                                        ],
                                        [
                                            31.708607263434875,
                                            -22.67131222568311
                                        ],
                                        [
                                            31.698284112288004,
                                            -22.665926233387516
                                        ],
                                        [
                                            31.689442114814433,
                                            -22.660001588007642
                                        ],
                                        [
                                            31.672969925967312,
                                            -22.64483109409932
                                        ],
                                        [
                                            31.66960370991603,
                                            -22.64083645458145
                                        ],
                                        [
                                            31.66538472595868,
                                            -22.63468744063583
                                        ],
                                        [
                                            31.662377496460675,
                                            -22.62867304773156
                                        ],
                                        [
                                            31.66044749848816,
                                            -22.622658762270504
                                        ],
                                        [
                                            31.659370360985562,
                                            -22.61570180930921
                                        ],
                                        [
                                            31.659415176654214,
                                            -22.609463019170416
                                        ],
                                        [
                                            31.648508607678043,
                                            -22.599498958783865
                                        ],
                                        [
                                            31.64285331617745,
                                            -22.592407405227778
                                        ],
                                        [
                                            31.630959224502696,
                                            -22.582398376494332
                                        ],
                                        [
                                            31.625393672824448,
                                            -22.581859775496337
                                        ],
                                        [
                                            31.62099511047816,
                                            -22.58096217786085
                                        ],
                                        [
                                            31.60838292239727,
                                            -22.576743108794574
                                        ],
                                        [
                                            31.59132730772832,
                                            -22.569112933938886
                                        ],
                                        [
                                            31.586794025852516,
                                            -22.566419958806254
                                        ],
                                        [
                                            31.581991573461686,
                                            -22.56273949910207
                                        ],
                                        [
                                            31.576560694726734,
                                            -22.557174017316726
                                        ],
                                        [
                                            31.57162352148192,
                                            -22.54981312850991
                                        ],
                                        [
                                            31.56866118461665,
                                            -22.547299650731002
                                        ],
                                        [
                                            31.56237753617329,
                                            -22.543394836992533
                                        ],
                                        [
                                            31.55770966817562,
                                            -22.53962465230735
                                        ],
                                        [
                                            31.55389459785399,
                                            -22.535944224400783
                                        ],
                                        [
                                            31.550483476913385,
                                            -22.531770031950483
                                        ],
                                        [
                                            31.54752120136188,
                                            -22.52710218172113
                                        ],
                                        [
                                            31.544873049499422,
                                            -22.521312246824166
                                        ],
                                        [
                                            31.542583992011483,
                                            -22.513861648028364
                                        ],
                                        [
                                            31.54159659425619,
                                            -22.506545628224053
                                        ],
                                        [
                                            31.53674920572678,
                                            -22.506366145073734
                                        ],
                                        [
                                            31.529792284802703,
                                            -22.505378709105134
                                        ],
                                        [
                                            31.521892852994792,
                                            -22.508206328871086
                                        ],
                                        [
                                            31.510627096903548,
                                            -22.510630022197244
                                        ],
                                        [
                                            31.50349065132036,
                                            -22.511213522374387
                                        ],
                                        [
                                            31.49595027896421,
                                            -22.51076465306481
                                        ],
                                        [
                                            31.481497845284082,
                                            -22.507802360444874
                                        ],
                                        [
                                            31.467090318603194,
                                            -22.504211684564115
                                        ],
                                        [
                                            31.458023939342798,
                                            -22.500800573594095
                                        ],
                                        [
                                            31.448733053481874,
                                            -22.495773704735146
                                        ],
                                        [
                                            31.442763595763495,
                                            -22.496267342246878
                                        ],
                                        [
                                            31.43562713033211,
                                            -22.49613269970174
                                        ],
                                        [
                                            31.42934343974488,
                                            -22.495279981766657
                                        ],
                                        [
                                            31.423598393943344,
                                            -22.49379879160372
                                        ],
                                        [
                                            31.41282639526516,
                                            -22.489220696421732
                                        ],
                                        [
                                            31.40407418323141,
                                            -22.483744911795547
                                        ],
                                        [
                                            31.39711727526275,
                                            -22.480917267862456
                                        ],
                                        [
                                            31.387871308153116,
                                            -22.47575573891701
                                        ],
                                        [
                                            31.38531299618217,
                                            -22.47584549172769
                                        ],
                                        [
                                            31.37831117310077,
                                            -22.479301498080787
                                        ],
                                        [
                                            31.370636135412767,
                                            -22.481680347347318
                                        ],
                                        [
                                            31.363948558790046,
                                            -22.482757492399642
                                        ],
                                        [
                                            31.357799540585425,
                                            -22.483026835067943
                                        ],
                                        [
                                            31.35124655921651,
                                            -22.48275748470095
                                        ],
                                        [
                                            31.34397549860047,
                                            -22.48150076456751
                                        ],
                                        [
                                            31.33881386929528,
                                            -22.47992983651028
                                        ],
                                        [
                                            31.330959336180175,
                                            -22.47692270385564
                                        ],
                                        [
                                            31.324989848740323,
                                            -22.477192003632876
                                        ],
                                        [
                                            31.346174778485842,
                                            -22.53975930508339
                                        ],
                                        [
                                            31.364352502628453,
                                            -22.59519014364431
                                        ],
                                        [
                                            31.55780556371505,
                                            -23.17140601327735
                                        ]
                                    ]
                                ]
                            },
                            "properties": {
                                "EVI": 0.25926045039307144,
                                "NDVI": 0.5197547703577462,
                                "Name": "Limpopo National Park North",
                                "area": 230556.62087644372,
                                "Project": "Limpopo NP Project",
                                "Fires/yr": 0.05573187830336481,
                                "SOC kg/m2": 5.350402129638235,
                                "Bare ground %": 0.02904032104178192,
                                "Grass cover %": 19.323132668446675,
                                "Woody cover %": 80.03607495795487,
                                "SOC change kg/m2": -0.027567216022700267,
                                "Grazing capacity LSU/ha": 0.23675119659125718
                            }
                        },
                        {
                            "id": "00000000000000000160",
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [
                                        [
                                            32.27907388869796,
                                            -22.631051939585756
                                        ],
                                        [
                                            32.43454961307,
                                            -22.87544141075221
                                        ],
                                        [
                                            32.47929825207802,
                                            -22.89613257142082
                                        ],
                                        [
                                            32.61744905757586,
                                            -23.001024843607684
                                        ],
                                        [
                                            32.62525871162802,
                                            -23.007353395194293
                                        ],
                                        [
                                            32.628400552803576,
                                            -23.009148752683355
                                        ],
                                        [
                                            32.63638978081317,
                                            -23.01471428227985
                                        ],
                                        [
                                            32.639666236223675,
                                            -23.0176765543418
                                        ],
                                        [
                                            32.64900194487402,
                                            -23.024184605729605
                                        ],
                                        [
                                            32.65214383708855,
                                            -23.025935038293575
                                        ],
                                        [
                                            32.65779906995656,
                                            -23.03082736687004
                                        ],
                                        [
                                            32.66165903097399,
                                            -23.032667546688376
                                        ],
                                        [
                                            32.66367883346723,
                                            -23.034732201890414
                                        ],
                                        [
                                            32.6706805881713,
                                            -23.038367782616387
                                        ],
                                        [
                                            32.67552794876101,
                                            -23.04245213482655
                                        ],
                                        [
                                            32.677188710364376,
                                            -23.0431702306281
                                        ],
                                        [
                                            32.67705406433936,
                                            -23.043574172774914
                                        ],
                                        [
                                            32.67840051663168,
                                            -23.044830899478875
                                        ],
                                        [
                                            32.68127309020628,
                                            -23.04635692409755
                                        ],
                                        [
                                            32.6824849343822,
                                            -23.048107373399635
                                        ],
                                        [
                                            32.6838763093174,
                                            -23.04922950592746
                                        ],
                                        [
                                            32.68814021880588,
                                            -23.051742967247616
                                        ],
                                        [
                                            32.689441792476174,
                                            -23.053044620762904
                                        ],
                                        [
                                            32.69451364338204,
                                            -23.055468284872568
                                        ],
                                        [
                                            32.70102171673643,
                                            -23.060674724868196
                                        ],
                                        [
                                            32.70173985986485,
                                            -23.060809417833408
                                        ],
                                        [
                                            32.703176130996134,
                                            -23.06368188518879
                                        ],
                                        [
                                            32.70631791454876,
                                            -23.066958382975706
                                        ],
                                        [
                                            32.70919048039046,
                                            -23.07535153547455
                                        ],
                                        [
                                            32.71601273768101,
                                            -23.088008660998447
                                        ],
                                        [
                                            32.71812220176223,
                                            -23.09326002584285
                                        ],
                                        [
                                            32.72247593030801,
                                            -23.09990269734296
                                        ],
                                        [
                                            32.72862492815219,
                                            -23.11098887599005
                                        ],
                                        [
                                            32.72983672822521,
                                            -23.11242521908493
                                        ],
                                        [
                                            32.73252977634513,
                                            -23.117541898886593
                                        ],
                                        [
                                            32.736165338829245,
                                            -23.12328694410489
                                        ],
                                        [
                                            32.739082723890036,
                                            -23.130064276620654
                                        ],
                                        [
                                            32.74460333475287,
                                            -23.14065680170629
                                        ],
                                        [
                                            32.75061774134943,
                                            -23.149947633967862
                                        ],
                                        [
                                            32.752861897496295,
                                            -23.154615446952004
                                        ],
                                        [
                                            32.75712576986829,
                                            -23.16143775902089
                                        ],
                                        [
                                            32.76188341763083,
                                            -23.170818309956218
                                        ],
                                        [
                                            32.76300550688354,
                                            -23.173960136219783
                                        ],
                                        [
                                            32.76390322105036,
                                            -23.178627997995434
                                        ],
                                        [
                                            32.764172456240566,
                                            -23.182802162102586
                                        ],
                                        [
                                            32.768974989288466,
                                            -23.20591705479063
                                        ],
                                        [
                                            32.77009708641674,
                                            -23.209417950655524
                                        ],
                                        [
                                            32.77068056513875,
                                            -23.216464660630457
                                        ],
                                        [
                                            32.773687731211695,
                                            -23.230019355338722
                                        ],
                                        [
                                            32.774720040717455,
                                            -23.237649558429403
                                        ],
                                        [
                                            32.775662604973974,
                                            -23.2409708736398
                                        ],
                                        [
                                            32.77656029349209,
                                            -23.246895520973567
                                        ],
                                        [
                                            32.77979187203114,
                                            -23.258250971964358
                                        ],
                                        [
                                            32.783517196636254,
                                            -23.28060285125134
                                        ],
                                        [
                                            32.785492051501215,
                                            -23.287469990129576
                                        ],
                                        [
                                            32.78638973924355,
                                            -23.293888267184297
                                        ],
                                        [
                                            32.78674881211757,
                                            -23.29393316181491
                                        ],
                                        [
                                            32.7869732104917,
                                            -23.29469617884044
                                        ],
                                        [
                                            32.78863388081142,
                                            -23.29460641364701
                                        ],
                                        [
                                            32.79303246785996,
                                            -23.29308039065591
                                        ],
                                        [
                                            32.80322096854431,
                                            -23.288816482503062
                                        ],
                                        [
                                            32.803894225038576,
                                            -23.287604678225804
                                        ],
                                        [
                                            32.80829275275251,
                                            -23.283699784388183
                                        ],
                                        [
                                            32.81381339191127,
                                            -23.280692631111847
                                        ],
                                        [
                                            32.81551898885679,
                                            -23.278852439901225
                                        ],
                                        [
                                            32.827053933709806,
                                            -23.27198525230172
                                        ],
                                        [
                                            32.83068955653358,
                                            -23.270908024771153
                                        ],
                                        [
                                            32.8336518223945,
                                            -23.269337145894475
                                        ],
                                        [
                                            32.835671573671,
                                            -23.26776622558952
                                        ],
                                        [
                                            32.839127615545515,
                                            -23.26583627107531
                                        ],
                                        [
                                            32.84101265599085,
                                            -23.26399606965421
                                        ],
                                        [
                                            32.845186850120086,
                                            -23.262245617082915
                                        ],
                                        [
                                            32.84577032680107,
                                            -23.260854165115877
                                        ],
                                        [
                                            32.8503035159109,
                                            -23.257039105772645
                                        ],
                                        [
                                            32.85236811180863,
                                            -23.253807563091932
                                        ],
                                        [
                                            32.856766682315325,
                                            -23.251608220103684
                                        ],
                                        [
                                            32.86094082714603,
                                            -23.250620856349467
                                        ],
                                        [
                                            32.863499180157326,
                                            -23.249364060005433
                                        ],
                                        [
                                            32.870321481516115,
                                            -23.24734435334073
                                        ],
                                        [
                                            32.87305932358521,
                                            -23.24599784593587
                                        ],
                                        [
                                            32.875438162444006,
                                            -23.242721322117603
                                        ],
                                        [
                                            32.87938785718758,
                                            -23.233789601551788
                                        ],
                                        [
                                            32.88095883078461,
                                            -23.227909886390947
                                        ],
                                        [
                                            32.88226042934417,
                                            -23.22557595242849
                                        ],
                                        [
                                            32.88306830667073,
                                            -23.222613613805372
                                        ],
                                        [
                                            32.88472903294718,
                                            -23.219561613658932
                                        ],
                                        [
                                            32.886838515808634,
                                            -23.213996037569515
                                        ],
                                        [
                                            32.8888134168872,
                                            -23.210450278971972
                                        ],
                                        [
                                            32.89087799780959,
                                            -23.208520329063315
                                        ],
                                        [
                                            32.89496239004963,
                                            -23.200620844485197
                                        ],
                                        [
                                            32.89603956568718,
                                            -23.196760908201092
                                        ],
                                        [
                                            32.900527916926414,
                                            -23.185629850265332
                                        ],
                                        [
                                            32.90084211636713,
                                            -23.181141468735238
                                        ],
                                        [
                                            32.90236811565995,
                                            -23.179346163648066
                                        ],
                                        [
                                            32.90290670822924,
                                            -23.179166600673792
                                        ],
                                        [
                                            32.903714591667764,
                                            -23.179121752274256
                                        ],
                                        [
                                            32.90488163761599,
                                            -23.180109185754223
                                        ],
                                        [
                                            32.91192826334189,
                                            -23.179974505658723
                                        ],
                                        [
                                            32.91336456767914,
                                            -23.179346121745347
                                        ],
                                        [
                                            32.9203214214897,
                                            -23.171985294664275
                                        ],
                                        [
                                            32.92086008970538,
                                            -23.17023487037142
                                        ],
                                        [
                                            32.92247581901185,
                                            -23.168259992831757
                                        ],
                                        [
                                            32.924450707233284,
                                            -23.16471424037733
                                        ],
                                        [
                                            32.92673976089294,
                                            -23.162425194277525
                                        ],
                                        [
                                            32.92790671099147,
                                            -23.160674710915494
                                        ],
                                        [
                                            32.93050996422359,
                                            -23.155558014070905
                                        ],
                                        [
                                            32.93504320380964,
                                            -23.152550802615053
                                        ],
                                        [
                                            32.93634478914314,
                                            -23.152550856371782
                                        ],
                                        [
                                            32.94554585617441,
                                            -23.156186352413318
                                        ],
                                        [
                                            32.94805932728546,
                                            -23.156320987202253
                                        ],
                                        [
                                            32.94891206707477,
                                            -23.156096597782515
                                        ],
                                        [
                                            32.94976488556327,
                                            -23.15515406298419
                                        ],
                                        [
                                            32.955285505771165,
                                            -23.15282015486416
                                        ],
                                        [
                                            32.95730530708595,
                                            -23.1516082907204
                                        ],
                                        [
                                            32.959908483311914,
                                            -23.15093505163875
                                        ],
                                        [
                                            32.972969587676076,
                                            -23.150037354946495
                                        ],
                                        [
                                            32.97727830368701,
                                            -23.150620880912182
                                        ],
                                        [
                                            32.97849021471486,
                                            -23.151428767448074
                                        ],
                                        [
                                            32.98288875822571,
                                            -23.15295476843426
                                        ],
                                        [
                                            32.984773850298694,
                                            -23.153179205614627
                                        ],
                                        [
                                            32.98625499975873,
                                            -23.154256421077594
                                        ],
                                        [
                                            32.99029451142292,
                                            -23.155602865689037
                                        ],
                                        [
                                            32.991371692609974,
                                            -23.156410780992708
                                        ],
                                        [
                                            32.99419937745756,
                                            -23.157443134708426
                                        ],
                                        [
                                            32.997565580656065,
                                            -23.157891904878674
                                        ],
                                        [
                                            33.00165000188422,
                                            -23.157757318021304
                                        ],
                                        [
                                            33.00416343502071,
                                            -23.159193592363458
                                        ],
                                        [
                                            33.00550991549839,
                                            -23.159418012457994
                                        ],
                                        [
                                            33.008202907716395,
                                            -23.161392846543276
                                        ],
                                        [
                                            33.00954941945097,
                                            -23.16152747702471
                                        ],
                                        [
                                            33.012466799016316,
                                            -23.161392816426492
                                        ],
                                        [
                                            33.0209946345189,
                                            -23.159597500001304
                                        ],
                                        [
                                            33.02359786562993,
                                            -23.15946289218004
                                        ],
                                        [
                                            33.02988157468069,
                                            -23.160809353920744
                                        ],
                                        [
                                            33.04357096748011,
                                            -23.16089910017049
                                        ],
                                        [
                                            33.04550094478078,
                                            -23.160584979031537
                                        ],
                                        [
                                            33.04868763118485,
                                            -23.159148699775223
                                        ],
                                        [
                                            33.05093183724187,
                                            -23.159058923718213
                                        ],
                                        [
                                            33.054612238909115,
                                            -23.160540093384416
                                        ],
                                        [
                                            33.05878637291344,
                                            -23.161392856697454
                                        ],
                                        [
                                            33.06049192397567,
                                            -23.16139286464997
                                        ],
                                        [
                                            33.0640826651494,
                                            -23.1598218891387
                                        ],
                                        [
                                            33.065563748908694,
                                            -23.158520327564837
                                        ],
                                        [
                                            33.06717953723926,
                                            -23.158206108928
                                        ],
                                        [
                                            33.07112929317631,
                                            -23.158879388156137
                                        ],
                                        [
                                            33.07386721380508,
                                            -23.15834077992782
                                        ],
                                        [
                                            33.076066459540534,
                                            -23.1583407939803
                                        ],
                                        [
                                            33.07763734393927,
                                            -23.158789590483774
                                        ],
                                        [
                                            33.08643447059548,
                                            -23.158879346316688
                                        ],
                                        [
                                            33.088947987743325,
                                            -23.157802167046356
                                        ],
                                        [
                                            33.0904740266547,
                                            -23.154705204621354
                                        ],
                                        [
                                            33.09343632571707,
                                            -23.15147363382479
                                        ],
                                        [
                                            33.0963088304977,
                                            -23.146581360633512
                                        ],
                                        [
                                            33.09918133753227,
                                            -23.143708842249396
                                        ],
                                        [
                                            33.11641651155651,
                                            -23.129480794902314
                                        ],
                                        [
                                            33.12086000268116,
                                            -23.12624919235724
                                        ],
                                        [
                                            33.12301434786992,
                                            -23.12427435448841
                                        ],
                                        [
                                            33.1259318172189,
                                            -23.12027970379257
                                        ],
                                        [
                                            33.12831062870203,
                                            -23.117900965921926
                                        ],
                                        [
                                            33.136075434699464,
                                            -23.112335417801603
                                        ],
                                        [
                                            33.14114723738179,
                                            -23.1080266076133
                                        ],
                                        [
                                            33.14657810421851,
                                            -23.102371340693544
                                        ],
                                        [
                                            33.15842731043869,
                                            -23.091644207741552
                                        ],
                                        [
                                            33.162062869138566,
                                            -23.087649614111214
                                        ],
                                        [
                                            33.17023159717342,
                                            -23.080558031296345
                                        ],
                                        [
                                            33.17691922759151,
                                            -23.073960172448803
                                        ],
                                        [
                                            33.179612180835726,
                                            -23.071985306235543
                                        ],
                                        [
                                            33.18293356230423,
                                            -23.07054905631934
                                        ],
                                        [
                                            33.195680446042054,
                                            -23.059597500637025
                                        ],
                                        [
                                            33.2029066476278,
                                            -23.054256395067586
                                        ],
                                        [
                                            33.20735008315627,
                                            -23.05044134468543
                                        ],
                                        [
                                            33.21480074469406,
                                            -23.040611897582032
                                        ],
                                        [
                                            33.22445062276626,
                                            -23.029795052720075
                                        ],
                                        [
                                            33.23347214504924,
                                            -23.018619107446472
                                        ],
                                        [
                                            33.2386786262528,
                                            -23.0111684986222
                                        ],
                                        [
                                            33.2459048175364,
                                            -23.004211565516542
                                        ],
                                        [
                                            33.24729616533165,
                                            -23.00237136198991
                                        ],
                                        [
                                            33.249719941205036,
                                            -22.995549053182103
                                        ],
                                        [
                                            33.25142543622312,
                                            -22.992137948716174
                                        ],
                                        [
                                            33.254522403037925,
                                            -22.984103886704833
                                        ],
                                        [
                                            33.257035900350594,
                                            -22.97903199703903
                                        ],
                                        [
                                            33.25901070882997,
                                            -22.973466493081414
                                        ],
                                        [
                                            33.26282583308587,
                                            -22.966913517724493
                                        ],
                                        [
                                            33.2659227798744,
                                            -22.95883452564634
                                        ],
                                        [
                                            33.26933394331798,
                                            -22.954660426341906
                                        ],
                                        [
                                            33.272251337009784,
                                            -22.952506010015476
                                        ],
                                        [
                                            33.272251337009784,
                                            -22.95214693032834
                                        ],
                                        [
                                            33.27368755097239,
                                            -22.951608356224767
                                        ],
                                        [
                                            33.27552783778634,
                                            -22.950261856810307
                                        ],
                                        [
                                            33.278894023507526,
                                            -22.949364202692443
                                        ],
                                        [
                                            33.28095869565294,
                                            -22.948107467851717
                                        ],
                                        [
                                            33.283113029753565,
                                            -22.945863326826075
                                        ],
                                        [
                                            33.28436984536986,
                                            -22.943753801609997
                                        ],
                                        [
                                            33.286434401091405,
                                            -22.942497038389135
                                        ],
                                        [
                                            33.290877883387694,
                                            -22.94020798951379
                                        ],
                                        [
                                            33.29487251723036,
                                            -22.93899615388994
                                        ],
                                        [
                                            33.310536768134675,
                                            -22.931231350595752
                                        ],
                                        [
                                            33.315339306653335,
                                            -22.92979507325861
                                        ],
                                        [
                                            33.317224368549084,
                                            -22.92880762501225
                                        ],
                                        [
                                            33.33235004200335,
                                            -22.92458857385902
                                        ],
                                        [
                                            33.33818488874912,
                                            -22.924274405157895
                                        ],
                                        [
                                            33.341281826593324,
                                            -22.923556304648898
                                        ],
                                        [
                                            33.34644339737756,
                                            -22.923331845853646
                                        ],
                                        [
                                            33.34837340343943,
                                            -22.922927916598358
                                        ],
                                        [
                                            33.352727056095425,
                                            -22.921177467832962
                                        ],
                                        [
                                            33.353938875859185,
                                            -22.920010515250745
                                        ],
                                        [
                                            33.357619361887465,
                                            -22.919875879754823
                                        ],
                                        [
                                            33.36107532422225,
                                            -22.91906799869594
                                        ],
                                        [
                                            33.36318490029064,
                                            -22.91897820504921
                                        ],
                                        [
                                            33.36946849588716,
                                            -22.917317528688656
                                        ],
                                        [
                                            33.37498918192856,
                                            -22.916419854061374
                                        ],
                                        [
                                            33.37669469785186,
                                            -22.91534268674082
                                        ],
                                        [
                                            33.380509808363364,
                                            -22.914130779426824
                                        ],
                                        [
                                            33.38818485074909,
                                            -22.909911739634694
                                        ],
                                        [
                                            33.39146136210798,
                                            -22.90874478749545
                                        ],
                                        [
                                            33.40236794122061,
                                            -22.902909988281984
                                        ],
                                        [
                                            33.40802330672178,
                                            -22.898601198997916
                                        ],
                                        [
                                            33.414890418642244,
                                            -22.895234946398876
                                        ],
                                        [
                                            33.42041106434555,
                                            -22.891509641848895
                                        ],
                                        [
                                            33.43176655834056,
                                            -22.885270798865992
                                        ],
                                        [
                                            33.438633681585706,
                                            -22.879660420731177
                                        ],
                                        [
                                            33.438633681585706,
                                            -22.878089524598867
                                        ],
                                        [
                                            33.42916332842288,
                                            -22.864355257624307
                                        ],
                                        [
                                            33.42265520107146,
                                            -22.853313923420814
                                        ],
                                        [
                                            33.418750386486856,
                                            -22.843260079206505
                                        ],
                                        [
                                            33.41637157153103,
                                            -22.839355276576786
                                        ],
                                        [
                                            33.41601247255694,
                                            -22.837874123745273
                                        ],
                                        [
                                            33.41008787285781,
                                            -22.826024922234986
                                        ],
                                        [
                                            33.4072153688505,
                                            -22.81879872128872
                                        ],
                                        [
                                            33.405464956101234,
                                            -22.815791488355856
                                        ],
                                        [
                                            33.40497121345702,
                                            -22.813996168366497
                                        ],
                                        [
                                            33.40147027429459,
                                            -22.80753299457032
                                        ],
                                        [
                                            33.39980961116543,
                                            -22.801518597101836
                                        ],
                                        [
                                            33.39868753911792,
                                            -22.799768171132076
                                        ],
                                        [
                                            33.39684728522167,
                                            -22.795190119015924
                                        ],
                                        [
                                            33.39666782777394,
                                            -22.79209312223254
                                        ],
                                        [
                                            33.39455830047698,
                                            -22.786527635922344
                                        ],
                                        [
                                            33.298238717515204,
                                            -22.701653281740388
                                        ],
                                        [
                                            33.21192818823524,
                                            -22.70174308517
                                        ],
                                        [
                                            33.21210773084713,
                                            -22.70089029218937
                                        ],
                                        [
                                            33.208786310614855,
                                            -22.701743081510216
                                        ],
                                        [
                                            33.20609338825566,
                                            -22.70120450150227
                                        ],
                                        [
                                            33.20438778665961,
                                            -22.69949892728996
                                        ],
                                        [
                                            33.20479174536491,
                                            -22.693304990419207
                                        ],
                                        [
                                            33.20586890325466,
                                            -22.69034274006491
                                        ],
                                        [
                                            33.20537525738094,
                                            -22.68630322912139
                                        ],
                                        [
                                            33.20645240884165,
                                            -22.68356534285086
                                        ],
                                        [
                                            33.207170531803676,
                                            -22.682937015432472
                                        ],
                                        [
                                            33.209055633067855,
                                            -22.682488119451357
                                        ],
                                        [
                                            33.210671466457384,
                                            -22.683296075373622
                                        ],
                                        [
                                            33.212646270962345,
                                            -22.683744893754845
                                        ],
                                        [
                                            33.214890513401755,
                                            -22.683655095505436
                                        ],
                                        [
                                            33.216820477794286,
                                            -22.682577892672153
                                        ],
                                        [
                                            33.217673216683885,
                                            -22.680243985498173
                                        ],
                                        [
                                            33.21583303698276,
                                            -22.675755667200534
                                        ],
                                        [
                                            33.21502512343921,
                                            -22.60789215409458
                                        ],
                                        [
                                            33.29989941552057,
                                            -22.60730863136416
                                        ],
                                        [
                                            33.297924581458396,
                                            -22.601743111375594
                                        ],
                                        [
                                            33.29568036797973,
                                            -22.599992705639426
                                        ],
                                        [
                                            33.2956354780404,
                                            -22.599588686041972
                                        ],
                                        [
                                            33.29316692773537,
                                            -22.59860124406962
                                        ],
                                        [
                                            33.290788099043844,
                                            -22.597120105916833
                                        ],
                                        [
                                            33.28993531497973,
                                            -22.596087828856195
                                        ],
                                        [
                                            33.28930698807049,
                                            -22.5942027484239
                                        ],
                                        [
                                            33.28773606732528,
                                            -22.592182934638853
                                        ],
                                        [
                                            33.28217055730515,
                                            -22.58895133771307
                                        ],
                                        [
                                            33.28073429738256,
                                            -22.588592334489523
                                        ],
                                        [
                                            33.280599606762785,
                                            -22.58778438457103
                                        ],
                                        [
                                            33.278131016781536,
                                            -22.585630008656604
                                        ],
                                        [
                                            33.27786171381893,
                                            -22.584463084160397
                                        ],
                                        [
                                            33.27561755055625,
                                            -22.580378683221298
                                        ],
                                        [
                                            33.276201067124134,
                                            -22.575486404196575
                                        ],
                                        [
                                            33.27584196064662,
                                            -22.57014526268643
                                        ],
                                        [
                                            33.270455975444335,
                                            -22.566554652100127
                                        ],
                                        [
                                            33.26753852787216,
                                            -22.562874155646156
                                        ],
                                        [
                                            33.26480069543509,
                                            -22.560629981600467
                                        ],
                                        [
                                            33.26237695229328,
                                            -22.55789213075228
                                        ],
                                        [
                                            33.26138954437544,
                                            -22.556141669446333
                                        ],
                                        [
                                            33.25923515725089,
                                            -22.548107542646935
                                        ],
                                        [
                                            33.259145429364665,
                                            -22.54370899120408
                                        ],
                                        [
                                            33.25959423936766,
                                            -22.542138069326082
                                        ],
                                        [
                                            33.25910052254049,
                                            -22.53854746617011
                                        ],
                                        [
                                            33.25537524077409,
                                            -22.534059094839886
                                        ],
                                        [
                                            33.25411847878937,
                                            -22.530737738602188
                                        ],
                                        [
                                            33.253624734184065,
                                            -22.526069874332542
                                        ],
                                        [
                                            33.25232312535531,
                                            -22.522793370538942
                                        ],
                                        [
                                            33.25088685305416,
                                            -22.510226120903656
                                        ],
                                        [
                                            33.249719941205036,
                                            -22.507533094021717
                                        ],
                                        [
                                            33.249001788504614,
                                            -22.504301486147895
                                        ],
                                        [
                                            33.24778994202651,
                                            -22.502326623154953
                                        ],
                                        [
                                            33.247655291487085,
                                            -22.501114748683765
                                        ],
                                        [
                                            33.24675764503774,
                                            -22.501339145083982
                                        ],
                                        [
                                            32.999719945985504,
                                            -22.4997682658679
                                        ],
                                        [
                                            32.99980973883808,
                                            -22.50196755755795
                                        ],
                                        [
                                            32.595366415110796,
                                            -22.501653345777285
                                        ],
                                        [
                                            32.594378969130474,
                                            -22.50273059261806
                                        ],
                                        [
                                            32.59186553748452,
                                            -22.503987339419105
                                        ],
                                        [
                                            32.58903791851035,
                                            -22.506051938926948
                                        ],
                                        [
                                            32.58612049385795,
                                            -22.506007078448278
                                        ],
                                        [
                                            32.577951698322465,
                                            -22.503089682579215
                                        ],
                                        [
                                            32.57651548979815,
                                            -22.502910066880585
                                        ],
                                        [
                                            32.56982781937097,
                                            -22.503403790697977
                                        ],
                                        [
                                            32.56762858727859,
                                            -22.505378722172406
                                        ],
                                        [
                                            32.56242207339225,
                                            -22.507847300140103
                                        ],
                                        [
                                            32.5434813392646,
                                            -22.507488199107794
                                        ],
                                        [
                                            32.541192298887594,
                                            -22.506725224462077
                                        ],
                                        [
                                            32.53849933190936,
                                            -22.507173985946466
                                        ],
                                        [
                                            32.53549209284562,
                                            -22.508924465732097
                                        ],
                                        [
                                            32.534459793660545,
                                            -22.509148910379114
                                        ],
                                        [
                                            32.52970222842941,
                                            -22.513053683987682
                                        ],
                                        [
                                            32.522700406199,
                                            -22.514579721938524
                                        ],
                                        [
                                            32.51726949973326,
                                            -22.51659948868335
                                        ],
                                        [
                                            32.515608841201725,
                                            -22.517766510628977
                                        ],
                                        [
                                            32.511659069728424,
                                            -22.517676729520932
                                        ],
                                        [
                                            32.50699120811005,
                                            -22.520235050250633
                                        ],
                                        [
                                            32.504926638127394,
                                            -22.520324835451277
                                        ],
                                        [
                                            32.50138082869434,
                                            -22.52176107009563
                                        ],
                                        [
                                            32.49675784108546,
                                            -22.526114803976295
                                        ],
                                        [
                                            32.48980095416779,
                                            -22.529391284851272
                                        ],
                                        [
                                            32.483517319511456,
                                            -22.533520501427585
                                        ],
                                        [
                                            32.47822108955334,
                                            -22.535360728562416
                                        ],
                                        [
                                            32.475662697659914,
                                            -22.537156068260366
                                        ],
                                        [
                                            32.473957154620656,
                                            -22.538996282633754
                                        ],
                                        [
                                            32.47323898199276,
                                            -22.540522273576634
                                        ],
                                        [
                                            32.47117434854523,
                                            -22.54209320251063
                                        ],
                                        [
                                            32.46331983519867,
                                            -22.547389409670696
                                        ],
                                        [
                                            32.46080634232127,
                                            -22.54958868784649
                                        ],
                                        [
                                            32.45245803401654,
                                            -22.553717993159395
                                        ],
                                        [
                                            32.45043825859763,
                                            -22.55582752695646
                                        ],
                                        [
                                            32.449450904244564,
                                            -22.55775747681651
                                        ],
                                        [
                                            32.445411371221915,
                                            -22.560630000164846
                                        ],
                                        [
                                            32.44137185520988,
                                            -22.562470276938146
                                        ],
                                        [
                                            32.437601666807815,
                                            -22.564849038532998
                                        ],
                                        [
                                            32.434908703157014,
                                            -22.565701854345207
                                        ],
                                        [
                                            32.43212589562902,
                                            -22.56745228855713
                                        ],
                                        [
                                            32.4287596773007,
                                            -22.568305029831542
                                        ],
                                        [
                                            32.424675277234684,
                                            -22.568305046643
                                        ],
                                        [
                                            32.4215783443807,
                                            -22.56924762511874
                                        ],
                                        [
                                            32.41879561538605,
                                            -22.56906804849502
                                        ],
                                        [
                                            32.41623724053394,
                                            -22.570369692533955
                                        ],
                                        [
                                            32.414307248763826,
                                            -22.572568984114433
                                        ],
                                        [
                                            32.411210269416515,
                                            -22.575082454023637
                                        ],
                                        [
                                            32.40622825876508,
                                            -22.580064521228802
                                        ],
                                        [
                                            32.40371477996395,
                                            -22.58307166191519
                                        ],
                                        [
                                            32.399405979914775,
                                            -22.58652771311691
                                        ],
                                        [
                                            32.39689251094692,
                                            -22.58975931724963
                                        ],
                                        [
                                            32.390923040866575,
                                            -22.59388851718534
                                        ],
                                        [
                                            32.38773633827974,
                                            -22.595549179758702
                                        ],
                                        [
                                            32.38235037908571,
                                            -22.60066593158643
                                        ],
                                        [
                                            32.378625014579875,
                                            -22.603269140481338
                                        ],
                                        [
                                            32.36852625816408,
                                            -22.608610292281618
                                        ],
                                        [
                                            32.365294697459454,
                                            -22.609956717732594
                                        ],
                                        [
                                            32.36143471289902,
                                            -22.609732315242304
                                        ],
                                        [
                                            32.35721566548297,
                                            -22.61040562310867
                                        ],
                                        [
                                            32.35030365515709,
                                            -22.6145797394052
                                        ],
                                        [
                                            32.34433422882932,
                                            -22.61570182473918
                                        ],
                                        [
                                            32.34186562714069,
                                            -22.61565692402832
                                        ],
                                        [
                                            32.33630012253627,
                                            -22.616868743289597
                                        ],
                                        [
                                            32.33068969735315,
                                            -22.617362497294657
                                        ],
                                        [
                                            32.326964327035995,
                                            -22.618709024961316
                                        ],
                                        [
                                            32.321219338696366,
                                            -22.61834994737324
                                        ],
                                        [
                                            32.316775864756735,
                                            -22.61763183112718
                                        ],
                                        [
                                            32.313993138546415,
                                            -22.616375039801493
                                        ],
                                        [
                                            32.30972920640252,
                                            -22.6151183529318
                                        ],
                                        [
                                            32.308966140659784,
                                            -22.61448995055398
                                        ],
                                        [
                                            32.305779475213996,
                                            -22.61547735914894
                                        ],
                                        [
                                            32.3008872208003,
                                            -22.61606089790498
                                        ],
                                        [
                                            32.29945093093136,
                                            -22.616823882646738
                                        ],
                                        [
                                            32.298239040837984,
                                            -22.61826019250568
                                        ],
                                        [
                                            32.295142117818706,
                                            -22.61821530821256
                                        ],
                                        [
                                            32.29303263555139,
                                            -22.619068076296802
                                        ],
                                        [
                                            32.28975611525481,
                                            -22.61897829290682
                                        ],
                                        [
                                            32.28764661260738,
                                            -22.62001060053884
                                        ],
                                        [
                                            32.286748930006446,
                                            -22.620953157803605
                                        ],
                                        [
                                            32.28324802524392,
                                            -22.623017793996773
                                        ],
                                        [
                                            32.279343170441585,
                                            -22.629795210835724
                                        ],
                                        [
                                            32.279343170441585,
                                            -22.631051883558964
                                        ],
                                        [
                                            32.28015109811294,
                                            -22.631769994231846
                                        ],
                                        [
                                            32.27907388869796,
                                            -22.631051939585756
                                        ]
                                    ]
                                ]
                            },
                            "properties": {
                                "EVI": 0.2392074538515231,
                                "NDVI": 0.419492955013871,
                                "Name": "Bahine National Park",
                                "area": 606620.3345166377,
                                "Project": "Limpopo NP Project",
                                "Fires/yr": 0.10121720344331443,
                                "SOC kg/m2": 4.927428033459717,
                                "Bare ground %": 0.4087688812800645,
                                "Grass cover %": 37.51254943654993,
                                "Woody cover %": 63.01788923142505,
                                "SOC change kg/m2": null,
                                "Grazing capacity LSU/ha": 0.16572197454601484
                            }
                        },
                        {
                            "id": "00000000000000000163",
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [
                                        [
                                            32.16870588033916,
                                            -23.827819951228477
                                        ],
                                        [
                                            32.17355326141922,
                                            -23.82741600515939
                                        ],
                                        [
                                            32.181632292600554,
                                            -23.82773013791502
                                        ],
                                        [
                                            32.18809547841674,
                                            -23.82687732980399
                                        ],
                                        [
                                            32.1970721196089,
                                            -23.82683244609123
                                        ],
                                        [
                                            32.2042534285086,
                                            -23.827550597955188
                                        ],
                                        [
                                            32.22095005284871,
                                            -23.828179008946318
                                        ],
                                        [
                                            32.22844557329961,
                                            -23.829256191565502
                                        ],
                                        [
                                            32.23454971551333,
                                            -23.829211305435287
                                        ],
                                        [
                                            32.241416804975856,
                                            -23.82966016353299
                                        ],
                                        [
                                            32.25039347562071,
                                            -23.831320838861327
                                        ],
                                        [
                                            32.26049223615536,
                                            -23.834642172439235
                                        ],
                                        [
                                            32.26704516062373,
                                            -23.83531545382404
                                        ],
                                        [
                                            32.27189258894488,
                                            -23.836213093763185
                                        ],
                                        [
                                            32.27799666837786,
                                            -23.837873803294965
                                        ],
                                        [
                                            32.28297875338391,
                                            -23.839713992475495
                                        ],
                                        [
                                            32.28984592457756,
                                            -23.843170001645202
                                        ],
                                        [
                                            32.296982321815285,
                                            -23.84810715942915
                                        ],
                                        [
                                            32.30537547979145,
                                            -23.850082009507545
                                        ],
                                        [
                                            32.30995360083917,
                                            -23.85183243956721
                                        ],
                                        [
                                            32.31560889325245,
                                            -23.854749875340957
                                        ],
                                        [
                                            32.321578382563125,
                                            -23.858475217793895
                                        ],
                                        [
                                            32.325258793160366,
                                            -23.861302865577038
                                        ],
                                        [
                                            32.33109359632005,
                                            -23.866644003416557
                                        ],
                                        [
                                            32.33468433742478,
                                            -23.870952702416552
                                        ],
                                        [
                                            32.338050535776084,
                                            -23.876069471858777
                                        ],
                                        [
                                            32.34092308795279,
                                            -23.88176960526217
                                        ],
                                        [
                                            32.34334674318146,
                                            -23.888681690272932
                                        ],
                                        [
                                            32.3444688734564,
                                            -23.893888136218592
                                        ],
                                        [
                                            32.34491768764188,
                                            -23.899184357590155
                                        ],
                                        [
                                            32.344603517912056,
                                            -23.90524361795946
                                        ],
                                        [
                                            32.34316721506905,
                                            -23.912828854915137
                                        ],
                                        [
                                            32.34128215149083,
                                            -23.918439254682962
                                        ],
                                        [
                                            32.34779022626703,
                                            -23.92081808375817
                                        ],
                                        [
                                            32.353714839263425,
                                            -23.9236906485803
                                        ],
                                        [
                                            32.35779922611676,
                                            -23.926069390856004
                                        ],
                                        [
                                            32.36233236817155,
                                            -23.929435699210657
                                        ],
                                        [
                                            32.368481386861376,
                                            -23.928313638277437
                                        ],
                                        [
                                            32.37786201353054,
                                            -23.927595474585406
                                        ],
                                        [
                                            32.3836968514763,
                                            -23.92768521964993
                                        ],
                                        [
                                            32.38993564533915,
                                            -23.928493104386714
                                        ],
                                        [
                                            32.396264134323644,
                                            -23.930108897981526
                                        ],
                                        [
                                            32.40169501680631,
                                            -23.93221841853763
                                        ],
                                        [
                                            32.407350325029476,
                                            -23.935225609992948
                                        ],
                                        [
                                            32.41251195212218,
                                            -23.93890603158903
                                        ],
                                        [
                                            32.41794277308224,
                                            -23.93778397781811
                                        ],
                                        [
                                            32.42395719859413,
                                            -23.937245377520387
                                        ],
                                        [
                                            32.429836830530725,
                                            -23.93738005354805
                                        ],
                                        [
                                            32.435806336592364,
                                            -23.938187908006796
                                        ],
                                        [
                                            32.44123724807262,
                                            -23.93953437409442
                                        ],
                                        [
                                            32.44657837495112,
                                            -23.941509285319196
                                        ],
                                        [
                                            32.45160529269763,
                                            -23.94402273197808
                                        ],
                                        [
                                            32.45654238805562,
                                            -23.947164553177142
                                        ],
                                        [
                                            32.46130001028811,
                                            -23.95080011549994
                                        ],
                                        [
                                            32.46516004200475,
                                            -23.954570303638143
                                        ],
                                        [
                                            32.47135391730594,
                                            -23.96278394781572
                                        ],
                                        [
                                            32.47615638183413,
                                            -23.97171574318055
                                        ],
                                        [
                                            32.47826591396911,
                                            -23.976787539314966
                                        ],
                                        [
                                            32.48046522318389,
                                            -23.983654725328083
                                        ],
                                        [
                                            32.482215655386376,
                                            -23.986527222365016
                                        ],
                                        [
                                            32.48544724506235,
                                            -23.989175299483236
                                        ],
                                        [
                                            32.48948678574029,
                                            -23.993394366422738
                                        ],
                                        [
                                            32.49244906797537,
                                            -23.995010195688828
                                        ],
                                        [
                                            32.49689246308964,
                                            -23.996491313646818
                                        ],
                                        [
                                            32.504163606360976,
                                            -23.999633153476427
                                        ],
                                        [
                                            32.51224254850883,
                                            -24.00474986081033
                                        ],
                                        [
                                            32.517493969349616,
                                            -24.009058653945
                                        ],
                                        [
                                            32.5213090154166,
                                            -24.012873678855346
                                        ],
                                        [
                                            32.52777217315983,
                                            -24.02171574615447
                                        ],
                                        [
                                            32.53006125032185,
                                            -24.025889865283276
                                        ],
                                        [
                                            32.53194637545593,
                                            -24.030512867440926
                                        ],
                                        [
                                            32.534729112607415,
                                            -24.04195805527452
                                        ],
                                        [
                                            32.53499843085605,
                                            -24.050081921983217
                                        ],
                                        [
                                            32.53365191895166,
                                            -24.058250685965035
                                        ],
                                        [
                                            32.53432513392528,
                                            -24.06574620015163
                                        ],
                                        [
                                            32.533921239992914,
                                            -24.072209413822502
                                        ],
                                        [
                                            32.53917260178085,
                                            -24.07422911790733
                                        ],
                                        [
                                            32.542718331414015,
                                            -24.076024539761985
                                        ],
                                        [
                                            32.54949569898941,
                                            -24.080243532688648
                                        ],
                                        [
                                            32.55380452568137,
                                            -24.08351999034132
                                        ],
                                        [
                                            32.55986376649824,
                                            -24.08975881640506
                                        ],
                                        [
                                            32.56287090324843,
                                            -24.09397780432541
                                        ],
                                        [
                                            32.565159982935384,
                                            -24.098107083692828
                                        ],
                                        [
                                            32.57023183236732,
                                            -24.094695938047273
                                        ],
                                        [
                                            32.56726952278159,
                                            -24.08711068000346
                                        ],
                                        [
                                            32.5657435063552,
                                            -24.07907653782852
                                        ],
                                        [
                                            32.565429308483345,
                                            -24.073376419220924
                                        ],
                                        [
                                            32.56556392784751,
                                            -24.061302767416517
                                        ],
                                        [
                                            32.5659678711844,
                                            -24.056410499823652
                                        ],
                                        [
                                            32.56408276003689,
                                            -24.048107115149115
                                        ],
                                        [
                                            32.56376864342376,
                                            -24.039713874593712
                                        ],
                                        [
                                            32.557978630595976,
                                            -24.035450020917327
                                        ],
                                        [
                                            32.55232336242349,
                                            -24.02992936092599
                                        ],
                                        [
                                            32.5485082469163,
                                            -24.0254410082289
                                        ],
                                        [
                                            32.54590506036512,
                                            -24.021446434510263
                                        ],
                                        [
                                            32.54065369381661,
                                            -24.016823482816655
                                        ],
                                        [
                                            32.536479582423496,
                                            -24.01229024210444
                                        ],
                                        [
                                            32.53351725816922,
                                            -24.008340504387096
                                        ],
                                        [
                                            32.5286249826605,
                                            -24.000351301843985
                                        ],
                                        [
                                            32.523687844664956,
                                            -23.98980369305748
                                        ],
                                        [
                                            32.52108455403197,
                                            -23.982532618013785
                                        ],
                                        [
                                            32.51969322796611,
                                            -23.975261490788313
                                        ],
                                        [
                                            32.5196034420757,
                                            -23.967990459860832
                                        ],
                                        [
                                            32.521174338643945,
                                            -23.956410525510925
                                        ],
                                        [
                                            32.52404688732908,
                                            -23.94761340007288
                                        ],
                                        [
                                            32.52691944298904,
                                            -23.941554164126625
                                        ],
                                        [
                                            32.52934311897218,
                                            -23.933071234864922
                                        ],
                                        [
                                            32.53149749813408,
                                            -23.928538020950242
                                        ],
                                        [
                                            32.535851181051086,
                                            -23.921491326527278
                                        ],
                                        [
                                            32.541282066127756,
                                            -23.91498324891144
                                        ],
                                        [
                                            32.546174349625474,
                                            -23.91031537721564
                                        ],
                                        [
                                            32.5472067049593,
                                            -23.906634991447852
                                        ],
                                        [
                                            32.546398756808614,
                                            -23.89976785040496
                                        ],
                                        [
                                            32.54657828220572,
                                            -23.894247178471925
                                        ],
                                        [
                                            32.54734134798785,
                                            -23.889579330838846
                                        ],
                                        [
                                            32.547116942843196,
                                            -23.888367438270123
                                        ],
                                        [
                                            32.545142070332595,
                                            -23.881724710012467
                                        ],
                                        [
                                            32.54051904211228,
                                            -23.881141271987445
                                        ],
                                        [
                                            32.53275426342692,
                                            -23.879435726415828
                                        ],
                                        [
                                            32.52633596019509,
                                            -23.87719151649411
                                        ],
                                        [
                                            32.521174338643945,
                                            -23.874633185724388
                                        ],
                                        [
                                            32.51228744463935,
                                            -23.869112504013195
                                        ],
                                        [
                                            32.50640778624625,
                                            -23.86395097253212
                                        ],
                                        [
                                            32.500213832511385,
                                            -23.860719388682597
                                        ],
                                        [
                                            32.495501159174225,
                                            -23.85766726723458
                                        ],
                                        [
                                            32.491012799493646,
                                            -23.853941958250356
                                        ],
                                        [
                                            32.484818881042614,
                                            -23.84729928994726
                                        ],
                                        [
                                            32.48145263015574,
                                            -23.842451894567613
                                        ],
                                        [
                                            32.478355735476555,
                                            -23.836841455389525
                                        ],
                                        [
                                            32.47611155651295,
                                            -23.83109637492567
                                        ],
                                        [
                                            32.474720148249126,
                                            -23.825082005775545
                                        ],
                                        [
                                            32.47427128341718,
                                            -23.820548819556862
                                        ],
                                        [
                                            32.47440593443226,
                                            -23.81489353987589
                                        ],
                                        [
                                            32.47745803513087,
                                            -23.79783790009033
                                        ],
                                        [
                                            32.46951373315813,
                                            -23.791913304345062
                                        ],
                                        [
                                            32.46340958317439,
                                            -23.785674510951043
                                        ],
                                        [
                                            32.4570809960288,
                                            -23.777056954032062
                                        ],
                                        [
                                            32.45398407030896,
                                            -23.771401651309255
                                        ],
                                        [
                                            32.452009246395754,
                                            -23.76659913635418
                                        ],
                                        [
                                            32.45003438522818,
                                            -23.757936618156588
                                        ],
                                        [
                                            32.4487327361124,
                                            -23.741823547115438
                                        ],
                                        [
                                            32.449002017342515,
                                            -23.733205974648275
                                        ],
                                        [
                                            32.44998946231862,
                                            -23.727236500755616
                                        ],
                                        [
                                            32.442853040684184,
                                            -23.717766114845286
                                        ],
                                        [
                                            32.44051911002561,
                                            -23.71350221091606
                                        ],
                                        [
                                            32.438140285796905,
                                            -23.70793661672684
                                        ],
                                        [
                                            32.435178019915256,
                                            -23.696985110688704
                                        ],
                                        [
                                            32.43401097563373,
                                            -23.68545011078031
                                        ],
                                        [
                                            32.43437006756533,
                                            -23.67391512532183
                                        ],
                                        [
                                            32.435178019915256,
                                            -23.66790077103646
                                        ],
                                        [
                                            32.4365693492105,
                                            -23.6624249591257
                                        ],
                                        [
                                            32.43854420502263,
                                            -23.65744298106466
                                        ],
                                        [
                                            32.44074348549502,
                                            -23.653358555419647
                                        ],
                                        [
                                            32.44375069247954,
                                            -23.649004848165717
                                        ],
                                        [
                                            32.446982261649545,
                                            -23.64532447919971
                                        ],
                                        [
                                            32.44572558574968,
                                            -23.64011801584761
                                        ],
                                        [
                                            32.44289788025857,
                                            -23.63127598587257
                                        ],
                                        [
                                            32.44213491371065,
                                            -23.625889994504803
                                        ],
                                        [
                                            32.4420451474929,
                                            -23.621581181905768
                                        ],
                                        [
                                            32.4353126348338,
                                            -23.617631437429832
                                        ],
                                        [
                                            32.43068966260067,
                                            -23.614175430011684
                                        ],
                                        [
                                            32.4229697676326,
                                            -23.60721850003169
                                        ],
                                        [
                                            32.41753886095546,
                                            -23.601159316979867
                                        ],
                                        [
                                            32.41444189045428,
                                            -23.59640163708144
                                        ],
                                        [
                                            32.40928035815404,
                                            -23.586213120298023
                                        ],
                                        [
                                            32.406003809504554,
                                            -23.57817906554734
                                        ],
                                        [
                                            32.404298256035474,
                                            -23.57131193295051
                                        ],
                                        [
                                            32.40362506731385,
                                            -23.563053395726378
                                        ],
                                        [
                                            32.403669923648465,
                                            -23.557936680979378
                                        ],
                                        [
                                            32.40416360135032,
                                            -23.552730266931242
                                        ],
                                        [
                                            32.405151036228155,
                                            -23.548107228627497
                                        ],
                                        [
                                            32.40703616842476,
                                            -23.542721278805256
                                        ],
                                        [
                                            32.409190563829185,
                                            -23.538367615466314
                                        ],
                                        [
                                            32.41228751627974,
                                            -23.53360993326132
                                        ],
                                        [
                                            32.41592302407819,
                                            -23.529346065652728
                                        ],
                                        [
                                            32.41291588357805,
                                            -23.523600981382373
                                        ],
                                        [
                                            32.4104472452822,
                                            -23.516105456732046
                                        ],
                                        [
                                            32.40954965424481,
                                            -23.510360418256653
                                        ],
                                        [
                                            32.40932521207584,
                                            -23.50133889832029
                                        ],
                                        [
                                            32.40223364715551,
                                            -23.49891520441817
                                        ],
                                        [
                                            32.39720669785143,
                                            -23.496715877725475
                                        ],
                                        [
                                            32.3921797676969,
                                            -23.49379851943573
                                        ],
                                        [
                                            32.38643469475703,
                                            -23.489669258382584
                                        ],
                                        [
                                            32.377099006958645,
                                            -23.480961891978914
                                        ],
                                        [
                                            32.36300564784804,
                                            -23.463681760720863
                                        ],
                                        [
                                            32.35492670013259,
                                            -23.458834381693716
                                        ],
                                        [
                                            32.34859815152549,
                                            -23.4532688709143
                                        ],
                                        [
                                            32.34222468747935,
                                            -23.445908010005972
                                        ],
                                        [
                                            32.33800565152951,
                                            -23.43931016970306
                                        ],
                                        [
                                            32.33288898209612,
                                            -23.432532816493907
                                        ],
                                        [
                                            32.32997158367232,
                                            -23.427101893950663
                                        ],
                                        [
                                            32.32804156956343,
                                            -23.421760762868207
                                        ],
                                        [
                                            32.323373670144655,
                                            -23.41704807632045
                                        ],
                                        [
                                            32.31991765392561,
                                            -23.412380180878046
                                        ],
                                        [
                                            32.31749398137568,
                                            -23.408026511456626
                                        ],
                                        [
                                            32.31197338892172,
                                            -23.400037276271544
                                        ],
                                        [
                                            32.30878664077894,
                                            -23.392676415012122
                                        ],
                                        [
                                            32.30263761333537,
                                            -23.3901629807941
                                        ],
                                        [
                                            32.2968477033652,
                                            -23.387110927085562
                                        ],
                                        [
                                            32.28975611525481,
                                            -23.38239812106838
                                        ],
                                        [
                                            32.276560415343965,
                                            -23.36987570797649
                                        ],
                                        [
                                            32.27310443318336,
                                            -23.36731740292075
                                        ],
                                        [
                                            32.268301887227004,
                                            -23.363008604603547
                                        ],
                                        [
                                            32.25568972756176,
                                            -23.348915213061172
                                        ],
                                        [
                                            32.251829735177104,
                                            -23.342855937910635
                                        ],
                                        [
                                            32.24689258769618,
                                            -23.332712316243505
                                        ],
                                        [
                                            32.244693340886535,
                                            -23.325531046713873
                                        ],
                                        [
                                            32.24352635753609,
                                            -23.31722763640889
                                        ],
                                        [
                                            32.240608929919674,
                                            -23.310270683484536
                                        ],
                                        [
                                            32.222969797503005,
                                            -23.300351465631884
                                        ],
                                        [
                                            32.21466634180736,
                                            -23.294022936930137
                                        ],
                                        [
                                            32.21524990602356,
                                            -23.299453851337717
                                        ],
                                        [
                                            32.218212181308914,
                                            -23.309552536439252
                                        ],
                                        [
                                            32.22543838985328,
                                            -23.319696181351325
                                        ],
                                        [
                                            32.22718881014888,
                                            -23.33374469882544
                                        ],
                                        [
                                            32.23019603093887,
                                            -23.341015789537554
                                        ],
                                        [
                                            32.23867893815641,
                                            -23.34106066453711
                                        ],
                                        [
                                            32.23863409850018,
                                            -23.34837657200117
                                        ],
                                        [
                                            32.2471170281179,
                                            -23.357398160755633
                                        ],
                                        [
                                            32.253131388202604,
                                            -23.36246993132022
                                        ],
                                        [
                                            32.267090074879135,
                                            -23.37207501192267
                                        ],
                                        [
                                            32.27247610007106,
                                            -23.38051306978939
                                        ],
                                        [
                                            32.2718028510017,
                                            -23.39227250150902
                                        ],
                                        [
                                            32.2674940427067,
                                            -23.403448383969888
                                        ],
                                        [
                                            32.26318523320546,
                                            -23.41184160738729
                                        ],
                                        [
                                            32.25317622176945,
                                            -23.4206387472711
                                        ],
                                        [
                                            32.25811342464172,
                                            -23.43096188326382
                                        ],
                                        [
                                            32.27557299095684,
                                            -23.470952863703836
                                        ],
                                        [
                                            32.29276330195272,
                                            -23.51220062474656
                                        ],
                                        [
                                            32.33553707513439,
                                            -23.56987564094127
                                        ],
                                        [
                                            32.3186609321318,
                                            -23.66691331904977
                                        ],
                                        [
                                            32.25829292351271,
                                            -23.729570409768137
                                        ],
                                        [
                                            32.19603979559958,
                                            -23.74963325717109
                                        ],
                                        [
                                            32.19379568411803,
                                            -23.76731725383481
                                        ],
                                        [
                                            32.1847740798239,
                                            -23.79927410908711
                                        ],
                                        [
                                            32.16870588033916,
                                            -23.827819951228477
                                        ]
                                    ]
                                ]
                            },
                            "properties": {
                                "EVI": 0.239825442857685,
                                "NDVI": 0.44441955502633373,
                                "Name": "Limpopo National Park South",
                                "area": 100064.36819934876,
                                "Project": "Limpopo NP Project",
                                "Fires/yr": 0.0860878121802374,
                                "SOC kg/m2": 5.008402435793404,
                                "Bare ground %": 0.15300576024279827,
                                "Grass cover %": 28.895045459511444,
                                "Woody cover %": 68.57461496838371,
                                "SOC change kg/m2": null,
                                "Grazing capacity LSU/ha": 0.18563616429268626
                            }
                        },
                        {
                            "id": "00000000000000000183",
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [
                                    [
                                        [
                                            32.6216952837754,
                                            -23.057204460192278
                                        ],
                                        [
                                            32.6346579041104,
                                            -23.057217834058218
                                        ],
                                        [
                                            32.645025273051246,
                                            -23.057226759677278
                                        ],
                                        [
                                            32.65280196765965,
                                            -23.057235628431126
                                        ],
                                        [
                                            32.66576454733655,
                                            -23.05724462160488
                                        ],
                                        [
                                            32.67354570587336,
                                            -23.054863412729755
                                        ],
                                        [
                                            32.68391759688614,
                                            -23.05009661687218
                                        ],
                                        [
                                            32.6942938678097,
                                            -23.04532545092368
                                        ],
                                        [
                                            32.7046613309936,
                                            -23.045334342316895
                                        ],
                                        [
                                            32.71503765267891,
                                            -23.03579188174009
                                        ],
                                        [
                                            32.72540508002663,
                                            -23.033410719116617
                                        ],
                                        [
                                            32.73059542061041,
                                            -23.02625384633464
                                        ],
                                        [
                                            32.74096290434,
                                            -23.016715770298212
                                        ],
                                        [
                                            32.753925427449495,
                                            -23.00956340487706
                                        ],
                                        [
                                            32.76169772220716,
                                            -23.00240658030166
                                        ],
                                        [
                                            32.77206505416192,
                                            -22.992864085034007
                                        ],
                                        [
                                            32.78501879249419,
                                            -22.983326055219706
                                        ],
                                        [
                                            32.79279103442872,
                                            -22.97616916647042
                                        ],
                                        [
                                            32.79797242787131,
                                            -22.969016818384574
                                        ],
                                        [
                                            32.80833097677521,
                                            -22.961859910935043
                                        ],
                                        [
                                            32.81869388968689,
                                            -22.954703127667
                                        ],
                                        [
                                            32.8264571795124,
                                            -22.94516509213884
                                        ],
                                        [
                                            32.83940646226065,
                                            -22.940389369295666
                                        ],
                                        [
                                            32.84976051122445,
                                            -22.933237003385173
                                        ],
                                        [
                                            32.85752373752958,
                                            -22.926080099665672
                                        ],
                                        [
                                            32.86528705461134,
                                            -22.916537678804175
                                        ],
                                        [
                                            32.87822739771689,
                                            -22.906990688979075
                                        ],
                                        [
                                            32.891167711869116,
                                            -22.897448189657982
                                        ],
                                        [
                                            32.898926542451164,
                                            -22.88790578037567
                                        ],
                                        [
                                            32.906685375959505,
                                            -22.880748917801377
                                        ],
                                        [
                                            32.91444421192779,
                                            -22.873592042490476
                                        ],
                                        [
                                            32.92220304988964,
                                            -22.86881636308039
                                        ],
                                        [
                                            32.93254815035967,
                                            -22.85926941260941
                                        ],
                                        [
                                            32.94548395569237,
                                            -22.854493725805877
                                        ],
                                        [
                                            32.955833527910194,
                                            -22.849713577738154
                                        ],
                                        [
                                            32.963587955465776,
                                            -22.84017106089651
                                        ],
                                        [
                                            32.9661608837037,
                                            -22.83062862943084
                                        ],
                                        [
                                            32.958393073876564,
                                            -22.825866264099936
                                        ],
                                        [
                                            32.948034567719326,
                                            -22.81871836556263
                                        ],
                                        [
                                            32.93509427703697,
                                            -22.816346133027505
                                        ],
                                        [
                                            32.9247402384334,
                                            -22.809198140323982
                                        ],
                                        [
                                            32.914386248209546,
                                            -22.802050228376576
                                        ],
                                        [
                                            32.90661399078355,
                                            -22.790131058634287
                                        ],
                                        [
                                            32.898850679089,
                                            -22.78298314694377
                                        ],
                                        [
                                            32.89108745565297,
                                            -22.77583514086294
                                        ],
                                        [
                                            32.880737824043294,
                                            -22.766301582135167
                                        ],
                                        [
                                            32.87556084534007,
                                            -22.759149226882016
                                        ],
                                        [
                                            32.86780201946231,
                                            -22.749615680744725
                                        ],
                                        [
                                            32.86003872398421,
                                            -22.740082081189694
                                        ],
                                        [
                                            32.84969803537897,
                                            -22.73293418652203
                                        ],
                                        [
                                            32.844525486412586,
                                            -22.72339613539013
                                        ],
                                        [
                                            32.83935293063616,
                                            -22.71624373185329
                                        ],
                                        [
                                            32.83159854940039,
                                            -22.709091389130727
                                        ],
                                        [
                                            32.818671594624014,
                                            -22.701938981287817
                                        ],
                                        [
                                            32.813503483764066,
                                            -22.692405395708995
                                        ],
                                        [
                                            32.805749101027466,
                                            -22.68525300581878
                                        ],
                                        [
                                            32.79799472749031,
                                            -22.675715007490584
                                        ],
                                        [
                                            32.79541293284098,
                                            -22.66855811910311
                                        ],
                                        [
                                            32.78766302142001,
                                            -22.65663893189202
                                        ],
                                        [
                                            32.78249496553245,
                                            -22.64948203809218
                                        ],
                                        [
                                            32.77733129687837,
                                            -22.639944028481185
                                        ],
                                        [
                                            32.76699955495626,
                                            -22.630401571098357
                                        ],
                                        [
                                            32.75925410766977,
                                            -22.620863568606467
                                        ],
                                        [
                                            32.7515086737282,
                                            -22.611321126640554
                                        ],
                                        [
                                            32.743758687918884,
                                            -22.606549899424657
                                        ],
                                        [
                                            32.73601776158725,
                                            -22.594621770310283
                                        ],
                                        [
                                            32.73085854063553,
                                            -22.585079314564176
                                        ],
                                        [
                                            32.7205313027647,
                                            -22.577917981662857
                                        ],
                                        [
                                            32.712790251388945,
                                            -22.56837549343153
                                        ],
                                        [
                                            32.70504482174478,
                                            -22.561214168187263
                                        ],
                                        [
                                            32.69730380407217,
                                            -22.55643846314318
                                        ],
                                        [
                                            32.68697653708851,
                                            -22.55404391976864
                                        ],
                                        [
                                            32.67664926318894,
                                            -22.549263791524112
                                        ],
                                        [
                                            32.66890377155357,
                                            -22.546873735444148
                                        ],
                                        [
                                            32.655994699003024,
                                            -22.5468559127035
                                        ],
                                        [
                                            32.6456629270696,
                                            -22.54684696760758
                                        ],
                                        [
                                            32.637921996977944,
                                            -22.542066784334047
                                        ],
                                        [
                                            32.62501282811185,
                                            -22.53966335822915
                                        ],
                                        [
                                            32.6121037664675,
                                            -22.539649955417026
                                        ],
                                        [
                                            32.6017719893021,
                                            -22.539636632106962
                                        ],
                                        [
                                            32.588858466701645,
                                            -22.53961432685053
                                        ],
                                        [
                                            32.57852669385187,
                                            -22.53959646780935
                                        ],
                                        [
                                            32.5681994118362,
                                            -22.53719302979551
                                        ],
                                        [
                                            32.56046293980464,
                                            -22.530022758535466
                                        ],
                                        [
                                            32.547549353861584,
                                            -22.53000050492061
                                        ],
                                        [
                                            32.53722209244157,
                                            -22.525206898254385
                                        ],
                                        [
                                            32.53721760390591,
                                            -22.529978195193685
                                        ],
                                        [
                                            32.529467685205724,
                                            -22.529964802991852
                                        ],
                                        [
                                            32.521699922394674,
                                            -22.539493889121914
                                        ],
                                        [
                                            32.51651847267711,
                                            -22.549023007629874
                                        ],
                                        [
                                            32.508755182410745,
                                            -22.556161992033108
                                        ],
                                        [
                                            32.50100081161642,
                                            -22.55853422797662
                                        ],
                                        [
                                            32.49065571548515,
                                            -22.563283198094606
                                        ],
                                        [
                                            32.48032392986299,
                                            -22.56326088943574
                                        ],
                                        [
                                            32.46997885668914,
                                            -22.568005386086647
                                        ],
                                        [
                                            32.45962481222147,
                                            -22.57513993732121
                                        ],
                                        [
                                            32.44928417011182,
                                            -22.57749878759975
                                        ],
                                        [
                                            32.44151639785474,
                                            -22.58463786338334
                                        ],
                                        [
                                            32.428584960725544,
                                            -22.58698778033092
                                        ],
                                        [
                                            32.41823097216315,
                                            -22.594117906449164
                                        ],
                                        [
                                            32.4104676410611,
                                            -22.59648122990497
                                        ],
                                        [
                                            32.40010469287762,
                                            -22.603611340314718
                                        ],
                                        [
                                            32.38974625588894,
                                            -22.61073692254423
                                        ],
                                        [
                                            32.37938775076141,
                                            -22.615476939903875
                                        ],
                                        [
                                            32.369029265025915,
                                            -22.620217001852936
                                        ],
                                        [
                                            32.35867520951148,
                                            -22.622571406381212
                                        ],
                                        [
                                            32.3483211764528,
                                            -22.624925792376064
                                        ],
                                        [
                                            32.335385295243434,
                                            -22.62488571933329
                                        ],
                                        [
                                            32.325026819749745,
                                            -22.627240088146383
                                        ],
                                        [
                                            32.31726354795324,
                                            -22.627213363740914
                                        ],
                                        [
                                            32.30432767978688,
                                            -22.62716875526563
                                        ],
                                        [
                                            32.29654212923229,
                                            -22.634298813984735
                                        ],
                                        [
                                            32.291333823865976,
                                            -22.643823473831706
                                        ],
                                        [
                                            32.286134521382415,
                                            -22.65096700364029
                                        ],
                                        [
                                            32.28092631179584,
                                            -22.66049164331282
                                        ],
                                        [
                                            32.27312736497864,
                                            -22.67000734998627
                                        ],
                                        [
                                            32.27050540669551,
                                            -22.679540903957154
                                        ],
                                        [
                                            32.265297211174726,
                                            -22.686679920306972
                                        ],
                                        [
                                            32.25491190679955,
                                            -22.69380113220492
                                        ],
                                        [
                                            32.24970372833639,
                                            -22.700940091891827
                                        ],
                                        [
                                            32.23932287855658,
                                            -22.705675711059143
                                        ],
                                        [
                                            32.2289332283992,
                                            -22.712796834269675
                                        ],
                                        [
                                            32.21856135624969,
                                            -22.715142348393293
                                        ],
                                        [
                                            32.208185015336646,
                                            -22.717487797090364
                                        ],
                                        [
                                            32.1977908696573,
                                            -22.724608975507703
                                        ],
                                        [
                                            32.18999633118135,
                                            -22.729349077333513
                                        ],
                                        [
                                            32.182188408451935,
                                            -22.736479130654978
                                        ],
                                        [
                                            32.17179876043108,
                                            -22.74121021232801
                                        ],
                                        [
                                            32.161404556571156,
                                            -22.745941383024938
                                        ],
                                        [
                                            32.15100596991852,
                                            -22.75067244123561
                                        ],
                                        [
                                            32.14061625655478,
                                            -22.753013527614286
                                        ],
                                        [
                                            32.130226581793515,
                                            -22.755358945407842
                                        ],
                                        [
                                            32.119823427963716,
                                            -22.760090104732882
                                        ],
                                        [
                                            32.109420399020415,
                                            -22.764816745505517
                                        ],
                                        [
                                            32.10935349192923,
                                            -22.776753754992736
                                        ],
                                        [
                                            32.11972533010155,
                                            -22.779183975774835
                                        ],
                                        [
                                            32.12747530665612,
                                            -22.78637648132495
                                        ],
                                        [
                                            32.13001697402668,
                                            -22.79593230326659
                                        ],
                                        [
                                            32.12995449887564,
                                            -22.80786490801165
                                        ],
                                        [
                                            32.132500700248315,
                                            -22.817425171773152
                                        ],
                                        [
                                            32.14025062603267,
                                            -22.82461325426912
                                        ],
                                        [
                                            32.14539195310982,
                                            -22.834182535306063
                                        ],
                                        [
                                            32.15054663650672,
                                            -22.841361644883353
                                        ],
                                        [
                                            32.155692496886005,
                                            -22.85092646610504
                                        ],
                                        [
                                            32.16082485758016,
                                            -22.86049570614387
                                        ],
                                        [
                                            32.16597958179992,
                                            -22.867670366051865
                                        ],
                                        [
                                            32.17110755401563,
                                            -22.87962523656882
                                        ],
                                        [
                                            32.17626230505969,
                                            -22.886804373439087
                                        ],
                                        [
                                            32.18399435771331,
                                            -22.89637805805503
                                        ],
                                        [
                                            32.19432610368352,
                                            -22.905960675662165
                                        ],
                                        [
                                            32.20208499772959,
                                            -22.9107586190219
                                        ],
                                        [
                                            32.20984826562838,
                                            -22.915561067673814
                                        ],
                                        [
                                            32.21757140380132,
                                            -22.92752042422523
                                        ],
                                        [
                                            32.22791653469107,
                                            -22.93471291560216
                                        ],
                                        [
                                            32.235679833502644,
                                            -22.939506489204764
                                        ],
                                        [
                                            32.24342975754159,
                                            -22.946694582741056
                                        ],
                                        [
                                            32.2537748952183,
                                            -22.953882650659835
                                        ],
                                        [
                                            32.26412439527113,
                                            -22.961075195486412
                                        ],
                                        [
                                            32.27449184117439,
                                            -22.9634919931429
                                        ],
                                        [
                                            32.284850317156895,
                                            -22.968289939786874
                                        ],
                                        [
                                            32.29782627871228,
                                            -22.9683256783296
                                        ],
                                        [
                                            32.30561190813436,
                                            -22.968343512336354
                                        ],
                                        [
                                            32.31860574640215,
                                            -22.9636034437101
                                        ],
                                        [
                                            32.32900437553112,
                                            -22.958858939116872
                                        ],
                                        [
                                            32.33163967911166,
                                            -22.949316494220206
                                        ],
                                        [
                                            32.33686572365647,
                                            -22.93978291669134
                                        ],
                                        [
                                            32.34725987873698,
                                            -22.935038460024888
                                        ],
                                        [
                                            32.357645143595626,
                                            -22.93028951681518
                                        ],
                                        [
                                            32.370643401135105,
                                            -22.920778229952678
                                        ],
                                        [
                                            32.37844243427399,
                                            -22.913643670845477
                                        ],
                                        [
                                            32.388827656036874,
                                            -22.908894740470792
                                        ],
                                        [
                                            32.39402692750514,
                                            -22.90413686790741
                                        ],
                                        [
                                            32.404407760071436,
                                            -22.899387917897247
                                        ],
                                        [
                                            32.41478411117576,
                                            -22.897024652049527
                                        ],
                                        [
                                            32.41998339566471,
                                            -22.892262268708343
                                        ],
                                        [
                                            32.43554116875097,
                                            -22.887526758511118
                                        ],
                                        [
                                            32.445890770462995,
                                            -22.892320290852048
                                        ],
                                        [
                                            32.45624479192386,
                                            -22.894723740161105
                                        ],
                                        [
                                            32.466598825526056,
                                            -22.897131630176478
                                        ],
                                        [
                                            32.474357653555856,
                                            -22.90191177166226
                                        ],
                                        [
                                            32.487297943385066,
                                            -22.906705349917587
                                        ],
                                        [
                                            32.48727125832751,
                                            -22.91624781840481
                                        ],
                                        [
                                            32.48206745533657,
                                            -22.92577693002425
                                        ],
                                        [
                                            32.48204068257786,
                                            -22.93531937925875
                                        ],
                                        [
                                            32.479423223630405,
                                            -22.944857396291084
                                        ],
                                        [
                                            32.474210478796714,
                                            -22.954390942005432
                                        ],
                                        [
                                            32.47159748771475,
                                            -22.96154332583124
                                        ],
                                        [
                                            32.47160197907866,
                                            -22.959157691962833
                                        ],
                                        [
                                            32.471633159503554,
                                            -22.949615270399246
                                        ],
                                        [
                                            32.471646547217766,
                                            -22.944844034765875
                                        ],
                                        [
                                            32.46388769067856,
                                            -22.940059427796992
                                        ],
                                        [
                                            32.46645172621643,
                                            -22.949606314178272
                                        ],
                                        [
                                            32.46901120739571,
                                            -22.95915329209955
                                        ],
                                        [
                                            32.471575203637116,
                                            -22.96870022210553
                                        ],
                                        [
                                            32.4715439368225,
                                            -22.978247149714022
                                        ],
                                        [
                                            32.471517247738525,
                                            -22.987789632254696
                                        ],
                                        [
                                            32.471481575910154,
                                            -22.999722210638122
                                        ],
                                        [
                                            32.468859619999215,
                                            -23.00926019645374
                                        ],
                                        [
                                            32.468823947263694,
                                            -23.021192726371524
                                        ],
                                        [
                                            32.46878378303117,
                                            -23.033125290565284
                                        ],
                                        [
                                            32.46874811026977,
                                            -23.042676693203084
                                        ],
                                        [
                                            32.46872582558456,
                                            -23.04983797959099
                                        ],
                                        [
                                            32.468685661314325,
                                            -23.06177506482327
                                        ],
                                        [
                                            32.46864998851944,
                                            -23.07132640834626
                                        ],
                                        [
                                            32.468618807204486,
                                            -23.080877828010987
                                        ],
                                        [
                                            32.46857423777418,
                                            -23.092819301370124
                                        ],
                                        [
                                            32.47113815836322,
                                            -23.102375154615622
                                        ],
                                        [
                                            32.47629293052635,
                                            -23.111935413763877
                                        ],
                                        [
                                            32.48144321645366,
                                            -23.12388583178738
                                        ],
                                        [
                                            32.48141195259297,
                                            -23.13344173827965
                                        ],
                                        [
                                            32.489175293459844,
                                            -23.140620872121772
                                        ],
                                        [
                                            32.49698762234884,
                                            -23.133463982127072
                                        ],
                                        [
                                            32.50739512028147,
                                            -23.126311566442865
                                        ],
                                        [
                                            32.51521195413433,
                                            -23.116764629146672
                                        ],
                                        [
                                            32.5204291240166,
                                            -23.107217717460813
                                        ],
                                        [
                                            32.52564629122282,
                                            -23.097675207852863
                                        ],
                                        [
                                            32.5334451800505,
                                            -23.090522830139882
                                        ],
                                        [
                                            32.54383936409189,
                                            -23.083374920610435
                                        ],
                                        [
                                            32.55163835394238,
                                            -23.07622253599304
                                        ],
                                        [
                                            32.55943727519293,
                                            -23.069070131536506
                                        ],
                                        [
                                            32.569822555628676,
                                            -23.06430782527028
                                        ],
                                        [
                                            32.577612601321746,
                                            -23.05954105980456
                                        ],
                                        [
                                            32.58798449742976,
                                            -23.05955442218318
                                        ],
                                        [
                                            32.598360787761315,
                                            -23.057177706360807
                                        ],
                                        [
                                            32.60873267153311,
                                            -23.05719105986933
                                        ],
                                        [
                                            32.6216952837754,
                                            -23.057204460192278
                                        ]
                                    ]
                                ]
                            },
                            "properties": {
                                "EVI": 0.24575563565766614,
                                "NDVI": 0.4519704500218608,
                                "Name": "BNP western polygon",
                                "area": 310735.1568372569,
                                "Project": "Bahine National Park",
                                "Fires/yr": 0.11686049208719268,
                                "SOC kg/m2": 4.966504563716609,
                                "Bare ground %": 0.04609113970664324,
                                "Grass cover %": 31.471741345746928,
                                "Woody cover %": 69.51890281264933,
                                "SOC change kg/m2": null,
                                "Grazing capacity LSU/ha": 0.1898632793671469
                            }
                        }
                    ],
                    "properties": {
                        "system:asset_size": 632325
                    }
                }
            }
        },
        {
            "id": "4",
            "order": 1,
            "type": "map",
            "title": "Limpopo NP - Map 2018",
            "size": 2,
            "height": "large",
            "content": null,
            "config": {},
            "hasData": true,
            "data": {
                "id": "666f6770-5e13-46b5-89db-4ab564a11b21",
                "name": "Limpopo_NP_ndvi_temporal_annual_2018.tif",
                "size": 2579355,
                "status": "COMPLETED",
                "analysis": {
                    "year": 2018,
                    "month": null,
                    "quarter": null,
                    "variable": "NDVI",
                    "landscape": "Limpopo NP",
                    "locations": [
                        {
                            "lat": -23.549351331972545,
                            "lon": 31.858681110593636,
                            "community": "00000000000000000174",
                            "communityName": "Machamba 2",
                            "communityFeatureId": 449
                        },
                        {
                            "lat": -22.820242922752385,
                            "lon": 32.639018435357144,
                            "community": "00000000000000000160",
                            "communityName": "Bahine National Park",
                            "communityFeatureId": 429
                        }
                    ],
                    "analysisType": "Temporal",
                    "temporalResolution": "Annual"
                },
                "url": "cog://http://dev.local:8000/api/serve-cog/666f6770-5e13-46b5-89db-4ab564a11b21/",
                "bounds": [
                    31.548114126050294,
                    -23.955610601016105,
                    33.43888813606506,
                    -22.499476748383703
                ]
            }
        },
        {
            "id": "5",
            "order": 2,
            "type": "map",
            "title": "Limpopo NP - Map 2020",
            "size": 2,
            "height": "large",
            "content": null,
            "config": {},
            "hasData": true,
            "data": {
                "id": "5ae148f2-4d77-4a84-95aa-a593a97c449a",
                "name": "Limpopo_NP_ndvi_temporal_annual_2020.tif",
                "size": 2550681,
                "status": "COMPLETED",
                "analysis": {
                    "year": 2020,
                    "month": null,
                    "quarter": null,
                    "variable": "NDVI",
                    "landscape": "Limpopo NP",
                    "locations": [
                        {
                            "lat": -23.549351331972545,
                            "lon": 31.858681110593636,
                            "community": "00000000000000000174",
                            "communityName": "Machamba 2",
                            "communityFeatureId": 449
                        },
                        {
                            "lat": -22.820242922752385,
                            "lon": 32.639018435357144,
                            "community": "00000000000000000160",
                            "communityName": "Bahine National Park",
                            "communityFeatureId": 429
                        }
                    ],
                    "analysisType": "Temporal",
                    "temporalResolution": "Annual"
                },
                "url": "cog://http://dev.local:8000/api/serve-cog/5ae148f2-4d77-4a84-95aa-a593a97c449a/",
                "bounds": [
                    31.548114126050294,
                    -23.955610601016105,
                    33.43888813606506,
                    -22.499476748383703
                ]
            }
        }
    ],
    "metadata": {
        "totalWidgets": 2,
        "totalColumns": 1,
        "averageHeight": 2
    }
}
