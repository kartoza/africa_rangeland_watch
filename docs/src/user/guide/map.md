---
title: PROJECT_TITLE
summary: PROJECT_SUMMARY
    - PERSON_1
    - PERSON_2
date: DATE
some_url: PROJECT_GITHUB_URL
copyright: Copyright 2023, PROJECT_OWNER
contact: PROJECT_CONTACT
license: This program is free software; you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
#context_id: 1234
---

# MAP: Africa RangeLand Watch (ARW)

Click on the 1️⃣ `MAP` option in the navigation bar to access the interactive map feature.

[![Home Page](./img/guide-map-img-1.png)](./img/guide-map-img-1.png)

After clicking on the `MAP` option, you will be redirected to the interactive map page.
The image below illustrates the interactive map page of the ARW platform.

[![Map Page](./img/guide-map-img-2.png)](./img/guide-map-img-2.png)

## How to access the interactive map feature?

### Layers

The interactive map feature allows you to view and interact with various layers of informations.

To access the layers, click on the 1️⃣ `Layers`, this section is selected by default. This section allows you to apply various types of layers on the map, enabling customised visualisation. This is how it looks.

[![Layer Section](./img/guide-map-img-3.png)](./img/guide-map-img-3.png)

To apply layers to the map, you can choose layers from the 1️⃣ `Baseline` option. In the 2️⃣ `Near-real time` option, you can further refine their view by selecting a specific landscape through the `Zoom to landscape` drop-down menu. Moreover, additional variables can be applied by checking the corresponding boxes from the available options listed at the bottom of the layer's section.

[![Layer Section Parts](./img/guide-map-img-4.png)](./img/guide-map-img-4.png)

### Variables

#### EVI 

The enhanced vegetation index (EVI) is a spectral index calculated from satellite data in the near-infrared, red and blue wavelengths (Liu and Huete, 1995). EVI is a good proxy for vegetation vigour, greenness, biomass and cover. Relative to NDVI (see below), EVI simultaneously corrects for atmospheric and soil effects and does not saturate over high vegetation biomass. It has been used to map rangeland restoration and degradation trends over South Africa in Venter et al., 2020. We calculate baseline EVI at 250m resolution from the MOD13Q1 dataset derived from the MODIS satellites. For NRT and analysis EVI at the landscape scale, we calculate EVI from cloud-masked mosaics of Sentinel-2 imagery at 10m resolution.

#### NDVI

The normalised difference vegetation index (NDVI) is very similar to the EVI however it is more sensitive to sparse vegetation (Tucker 1979). It is therefore good for use in arid areas where one does not expect high levels of vegetation greenness. We calculate baseline EVI at 250m resolution from the MOD13Q1 dataset derived from the MODIS satellites. For NRT and analysis of EVI at the landscape scale, we calculate EVI from cloud-masked mosaics of Sentinel-2 imagery at 10m resolution.

#### Bare Grounds cover 

Bare ground cover refers to the proportion of the landscape where the surface is exposed without significant vegetation, such as grass or woody plants. These areas may consist of soil, sand, or rock and are important in ecological assessments as they affect processes like erosion, water infiltration, and habitat stability.


### Analysis?

Analysis allows you to select specific landscape from the 1️⃣ `Select Landscape` drop down menu.

[![Analysis Section](./img/guide-map-img-5.png)](./img/guide-map-img-5.png)

After selecting the landscape you will be able to select the analysis type from the 1️⃣ `Select analysis type` drop down menu. 

[![Analysis Type](./img/guide-map-img-6.png)](./img/guide-map-img-6.png)

Available options in `Select analysis type` are:

#### How to do Baseline Analysis?

* **Baseline:** After selecting this option you have to select the polygons from the map and then you can go for the analysis.

#### How to do Temporial Analysis?

* **Temporal:** After selecting the temporal you will be able to select to the following options:
    - **Select temporal resolution:** You can choose whether to use the `Annual` or `Quarterly` option based on their preference.

    - **Select variable:** You can choose the variable they want to analyse from the available options.

    - **Select reference period:** This feature allows you to select a time period based on their preference. If they choose the Quarterly option, they can further specify the desired quarter for a more focused analysis.

    - **Select comparison period:** You can also choose the time period for the comparison.

    [![Temporal Analysis Type](./img/guide-map-img-7.png)](./img/guide-map-img-7.png)

#### How to do Spatial Analysis?

* **Spatial:** After selecting this option, you can choose a specific variable. Next, you need to select a polygon from the map. Once the selections are made, you can proceed with the analysis.

    [![Spatial Analysis Type](./img/guide-map-img-8.png)](./img/guide-map-img-8.png)

#### How to do BACI Analysis?

* **BACI:** This option allows you to directly go for analysis by clicking on the  `Run Analysis` button.

    [![Spatial Analysis Type](./img/guide-map-img-8.png)](./img/guide-map-img-8.png)

After filling in the necessary details, you can proceed with the analysis by clicking on the 3️⃣ `Run Analysis` button. If you wish to reset the form, simply click on the 2️⃣ `Reset Form` button.