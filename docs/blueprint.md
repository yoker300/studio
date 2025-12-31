# **App Name**: SmartList

## Core Features:

- Device Detection: Detects the device type (phone/watch) and renders the appropriate interface. Pure black background with high contrast text will be used in the watch layout.
- Bottom Navigation: Implements a bottom navigation bar for phone interface with Lists, Recipes, and Settings tabs.
- List Management: Allows users to create, edit, and delete shopping lists.
- Item Management: Allows users to add, edit, check, and categorize items in a shopping list.
- AI Smart Add: Uses Gemini to parse voice input and extract items for the shopping list, adding a new tool to streamline the list creation process.
- Recipe Integration: Allows users to manage recipes and add ingredients from recipes to shopping lists with intelligent merging.
- Settings Customization: Allows users to customize the app's appearance, profile, smart quantities, and store presets.

## Style Guidelines:

- Primary color: Soft blue (#A0D2EB) for lists to evoke a sense of calm and organization.
- Background color: Very light blue (#F0F8FF) providing a clean backdrop, which will be black in the watch version.
- Accent color: Pale yellow (#FAFAD2) to highlight interactive elements without causing distraction.
- Headline font: 'Space Grotesk' sans-serif font to ensure clarity for primary content such as headers and titles.
- Body font: 'Inter' sans-serif for body text, enhancing readability for general information and detailed item descriptions.
- Use Lucide-React icons for a consistent and clean look throughout the app. Icons will be simple and easily recognizable.
- Responsive layout using Tailwind CSS, adapting to both phone and watch interfaces. Clear and concise structure for item and recipe information.