// Widget descriptions
export const widgetDescriptions = {
  chart: {
    title: 'Chart Widget',
    description: 'Displays data in visual format with bars, lines, or other chart types. Perfect for showing trends, comparisons, and analytics.',
    features: [
      'Interactive data visualization',
      'Responsive design adapts to widget size',
      'Supports multiple data series',
      'Color-coded legends and labels'
    ],
    dataSource: 'Sales and revenue data from company database',
    lastUpdated: 'Real-time updates every 5 minutes'
  },
  table: {
    title: 'Table Widget',
    description: 'Shows structured data in rows and columns with sorting and filtering capabilities. Ideal for detailed data inspection.',
    features: [
      'Sortable columns',
      'Status badges and formatting',
      'Scrollable content for large datasets',
      'Fixed header for easy navigation'
    ],
    dataSource: 'Employee management system',
    lastUpdated: 'Updated daily at midnight'
  },
  map: {
    title: 'Map Widget',
    description: 'Visualizes geographic data and user distribution across different locations. Shows regional performance and reach.',
    features: [
      'Interactive map placeholder',
      'Location-based metrics',
      'Color-coded regions',
      'User count by geography'
    ],
    dataSource: 'User analytics and location tracking',
    lastUpdated: 'Updated hourly'
  },
  text: {
    title: 'Text Widget',
    description: 'Flexible text content with markdown-like formatting. Perfect for notes, announcements, and documentation.',
    features: [
      'Inline editing capability',
      'Markdown formatting support',
      'Headers, bold, italic text',
      'Bullet points and numbered lists'
    ],
    dataSource: 'User-created content',
    lastUpdated: 'Updated when edited'
  }
};

// Sample text content for text widgets
export const sampleTextContent = {
  notes: `# Project Notes

## Key Updates
- Dashboard implementation is progressing well
- Added drag-and-drop functionality
- Responsive design completed

## Next Steps
1. Add more widget types
2. Implement data persistence
3. Add user preferences

*Last updated: Today*`,
  
  announcement: `🎉 **Team Announcement**

We're excited to announce the launch of our new dashboard system! 

**Features:**
- Drag & drop widgets
- Customizable sizes
- Real-time data updates
- Mobile responsive design

For questions, contact the development team.`,
  
  metrics: `## Key Performance Indicators

**This Quarter:**
- Revenue: ↗️ +15%
- Users: ↗️ +23%
- Satisfaction: ↗️ +8%

**Goals for Next Quarter:**
- Improve user retention
- Expand feature set
- Optimize performance`,
};
