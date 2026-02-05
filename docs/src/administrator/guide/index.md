---
title: Africa Rangeland Watch
summary: Understand and monitor the impact of sustainable rangeland management in Africa.
    - Ketan Bamniya
    
date: 22/01/2025
some_url: https://github.com/kartoza/africa_rangeland_watch
copyright: Copyright 2023, Africa Rangeland Watch
contact: Perushan Rajah, prajah@conservation.org
license: This program is free software; you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
context_id: 1234
---

# Administrator guide

This guide provides instructions for administrators on how to manage and configure the Africa Rangeland Watch platform.

## Managing Base Maps

Base maps provide the background map layers that users see in the application. As an administrator, you can add, edit, and manage base maps through the Django admin interface.

### Adding a New Base Map

Follow these steps to add a new base map to the platform:

1. **Access the Base Maps Section**
   - Log in to the Django admin interface
   - In the left sidebar, locate and click on **"Base Maps"** under the Frontend section
![alt text](../img/image.png)

2. **Create a New Base Map**
   - Click the **"Add Base Map"** button in the top right corner
![alt text](../img/image-1.png)
3. **Fill in the Required Fields**
   - **Name**: Enter a descriptive name for the base map (e.g., "OpenStreetMap", "Satellite Imagery")
   - **URL**: Enter the tile server URL for the base map
     - Format: `https://example.com/{z}/{x}/{y}.png`
     - The URL should include `{z}`, `{x}`, and `{y}` placeholders for zoom level and tile coordinates
   - **Thumbnail** (optional): Upload a preview image that represents the base map
     - This helps users identify the base map visually
     - Recommended size: 200x200 pixels or similar square format
   - **Default**: Check this box if you want this base map to be the default selection
     - **Note**: Only one base map can be set as default at a time. If you check this box, any previously default base map will automatically be unmarked.

4. **Save the Base Map**
   - Click the **"Save"** button at the bottom of the form
   - The base map will be immediately available in the frontend
![alt text](../img/image-2.png)

5. **Verify on Frontend**
   - Navigate to the main map interface
   - Open the base map selector on the bottom left
   - Your new base map should appear in the list and be selectable by users
![alt text](../img/image-3.png)
### Common Base Map Tile Servers

Here are some popular tile server URLs you can use:

- **OpenStreetMap**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **EOX Sentinel-2 Cloudless**: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg`

### Tips and Best Practices

- Always test the tile server URL before adding it to ensure it works correctly
- Use descriptive names that clearly indicate what the base map shows
- Upload thumbnails for all base maps to improve user experience
- Only set one base map as default to avoid confusion
- Ensure tile server URLs are from reliable sources with good uptime
