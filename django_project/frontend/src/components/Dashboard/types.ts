// Widget types
export type WidgetType = 'chart' | 'table' | 'map' | 'text';
export type GridSize = 1 | 2 | 3 | 4;
export type WidgetHeight = 'small' | 'medium' | 'large' | 'xlarge';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: GridSize;
  height: WidgetHeight;
  data?: any; // AnalysisResult
  content?: string;
  description?: string;
  config?: any; // Additional configuration for the widget
}

// Height configurations
export const heightConfig = {
  small: { minH: '200px', maxH: '250px', rows: 1 },
  medium: { minH: '300px', maxH: '350px', rows: 2 },
  large: { minH: '400px', maxH: '450px', rows: 3 },
  xlarge: { minH: '500px', maxH: '550px', rows: 4 },
};

// Size constraints based on widget type
export const widgetConstraints = {
  chart: { 
    minWidth: 2 as GridSize,
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'medium' as WidgetHeight
  },
  table: { 
    minWidth: 2 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'large' as WidgetHeight
  },
  map: { 
    minWidth: 2 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'medium' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'large' as WidgetHeight
  },
  text: { 
    minWidth: 1 as GridSize, 
    maxWidth: 4 as GridSize, 
    minHeight: 'small' as WidgetHeight,
    maxHeight: 'xlarge' as WidgetHeight,
    recommendedHeight: 'medium' as WidgetHeight
  },
};

// Sample data for widgets
export const chartData = [
  { month: 'Jan', sales: 4000, revenue: 2400 },
  { month: 'Feb', sales: 3000, revenue: 1398 },
  { month: 'Mar', sales: 2000, revenue: 9800 },
  { month: 'Apr', sales: 2780, revenue: 3908 },
  { month: 'May', sales: 1890, revenue: 4800 },
  { month: 'Jun', sales: 2390, revenue: 3800 },
];

export const tableData = [
  { id: 1, name: 'John Doe', role: 'Developer', status: 'Active', salary: '$75,000' },
  { id: 2, name: 'Jane Smith', role: 'Designer', status: 'Active', salary: '$65,000' },
  { id: 3, name: 'Bob Johnson', role: 'Manager', status: 'Inactive', salary: '$85,000' },
  { id: 4, name: 'Alice Brown', role: 'Developer', status: 'Active', salary: '$70,000' },
];

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
