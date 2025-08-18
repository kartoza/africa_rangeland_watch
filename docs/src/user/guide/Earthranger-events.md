---
title: Africa Rangeland Watch
summary: Understand and monitor the impact of sustainable rangeland management in Africa.
    - Jeff Osundwa
    
date: 12/05/2025
some_url: https://github.com/kartoza/africa_rangeland_watch
copyright: Copyright 2023, Africa Rangeland Watch
contact: Perushan Rajah, prajah@conservation.org
license: This program is free software; you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
context_id: 
---

# Earthranger events

## 0. Creating an EarthRanger Access Token

Before adding EarthRanger settings in Africa Rangeland Watch, you will need an **access token** from the EarthRanger Administration panel.

### Step 1 – Log into EarthRanger Administration
1. Go to your EarthRanger Admin URL in a browser.  
2. Enter your **Username** (1️⃣) and **Password** (2️⃣), then click **Log in**.  

[![Login to EarthRanger](./img/guide-earthranger-events-img-14.png)](./img/guide-earthranger-events-img-14.png)

---

[![Access DAS Tokens](./img/guide-earthranger-events-img-15.png)](./img/guide-earthranger-events-img-15.png)

---

### Step 2 – Open DAS Access Tokens
1. In the dashboard, scroll to the **DAS Configuration** section.  
2. Click **Change** next to **DAS Access Tokens**.  

[![Access DAS Tokens](./img/guide-earthranger-events-img-16.png)](./img/guide-earthranger-events-img-16.png)

---

### Step 3 – Add a New Token
1. On the DAS Access Token page, click **Add DAS Access Token** in the top right corner.

[![Add DAS token](./img/guide-earthranger-events-img-17.png)](./img/guide-earthranger-events-img-17.png)

---

### Step 4 – Fill in Token Details
On the **Add DAS Access Token** page, fill out:
1. **Token** (1️⃣) – Your generated token string.  
2. **Expires in** (2️⃣) – Set the expiry date and time.  
3. **Scope** (3️⃣) – Define access permissions (e.g., `read write`).  
4. **User** (4️⃣) – Select the associated user.  
5. **Application** (5️⃣) – Choose the application this token is for (e.g., `DAS Web`).  
6. Click **Save** (6️⃣) to store the token.

[![Create Token](./img/guide-earthranger-events-img-18.png)](./img/guide-earthranger-events-img-18.png)

---

### Step 5 – Verify Token Creation
Once saved, you should see the new token listed in the **DAS Access Tokens** table.

You can now copy this token and use it when creating a new EarthRanger setting in Africa Rangeland Watch.

## 1. Creating a New EarthRanger Setting

1. In the left-hand menu, click on **1️⃣ `EarthRanger Events`**.  
   [![EarthRanger Events Menu](./img/guide-earthranger-events-img-4.png)](./img/guide-earthranger-events-img-4.png)

2. Click the **`New`** button to open the creation form.  
   [![Click New Button](./img/guide-earthranger-events-img-5.png)](./img/guide-earthranger-events-img-5.png)

3. Fill out the form:  
   - **1️⃣ Name** – A label for your setting.  
   - **2️⃣ EarthRanger URL** – The URL to your EarthRanger instance.  
   - **3️⃣ Token/Key** – Your authentication token or key.  
   - **4️⃣ Privacy** – Choose *Private* or *Public*.  
   - **5️⃣ Is Active** – Tick to enable the setting immediately.  
   - **6️⃣ Create** – Click to save.  

   [![New EarthRanger Setting Form](./img/guide-earthranger-events-img-6.png)](./img/guide-earthranger-events-img-6.png)

4. After creating, a **success notification** will confirm your setting has been added.  
   [![Setting Created Notification](./img/guide-earthranger-events-img-7.png)](./img/guide-earthranger-events-img-7.png)

---

## 2. Managing Existing EarthRanger Settings

- **View** – Click the blue eye icon to see details.  
- **Edit** – Click the yellow pencil icon to update the setting.  
- **Delete** – Click the red trash icon to remove it.  

[![Manage EarthRanger Settings](./img/guide-earthranger-events-img-8.png)](./img/guide-earthranger-events-img-8.png)

[![EarthRanger Events](./img/guide-earthranger-events-img-9.png)](./img/guide-earthranger-events-img-9.png)

---

## 3. Viewing the EarthRanger Event List

You can also view EarthRanger events in list format from the **EarthRanger Events** page.  
The list shows:

- Event type  
- Date/time  
- Reporter  
- Location  
- Priority indicator  

[![Priority Indicators](./img/guide-earthranger-events-img-3.png)](./img/guide-earthranger-events-img-3.png)

[![Expanded Event Details](./img/guide-earthranger-events-img-2.png)](./img/guide-earthranger-events-img-2.png)

In the expanded view:

1. **Priority Indicator** (1️⃣) – A coloured dot showing the urgency level of the event:  
   - 🔴 Red – Low or no priority.  
   - 🟢 Green – High priority.  

2. **Action Button** (2️⃣) – The **`Hide Details`** button collapses the expanded view and returns to the default table view.  

3. **Additional Information** (3️⃣) – Contextual details about the event:  
   - **Comment** – Notes or description provided by the reporter, explaining the context or purpose of the event.  
     Example: “Checking quality of work. For work that SEF team has done looking if they still follow clearing procedures.”  
   - **Village** – The nearest settlement or community to the event location.

---

## 4. Enabling EarthRanger Events on the Map

1. Go to the **Layers** tab.
2. Expand the **EarthRanger** section and tick **`EarthRanger Events`**.  
   [![Enable EarthRanger Events](./img/guide-earthranger-events-img-10.png)](./img/guide-earthranger-events-img-10.png)

3. The map will display clusters of event locations.  
   [![EarthRanger Events on Map](./img/guide-earthranger-events-img-11.png)](./img/guide-earthranger-events-img-11.png)

---

## 5. Viewing Event Details

To view more information about an event:

1. Click on the EarthRacnger poinst on the map.

    [![Event List](./img/guide-earthranger-events-img-12.png)](./img/guide-earthranger-events-img-12.png)

2. An event detail panel will open, showing:  
   - **Event title and status**  
   - **Reported by** – Name of reporter  
   - **Location** – Coordinates  
   - **Time** – Event occurrence date/time  
   - **Additional details** – Species, livestock affected, injuries/kills, comments, village name, etc.  

   [![Event Details Panel](./img/guide-earthranger-events-img-13.png)](./img/guide-earthranger-events-img-13.png)
