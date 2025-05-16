# JavaScript Preview SDK

The Creatomate Preview SDK allows you to embed interactive video and image previews in your web application before generating the final media file. This is ideal for building editors, live previews, and user-driven customization experiences.

## Installation

### Using NPM
```bash
npm install @creatomate/preview
```

### Using CDN
You can load the SDK directly from a CDN in your HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/creatomate-preview.min.js"></script>
```

## Initialization in React

```jsx
import { useEffect } from 'react';

export default function PreviewComponent() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@creatomate/preview@1.6.0/dist/creatomate-preview.min.js';
    script.onload = () => {
      const preview = new window.Creatomate.Preview({
        token: process.env.VITE_CREATOMATE_TOKEN,
        templateId: 'YOUR_TEMPLATE_ID',
        container: document.getElementById('preview-container'),
        mode: 'interactive',
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="preview-container" style={{ width: 400, height: 700 }} />;
}
```

## Usage Example

- Allow users to edit text, images, or colors in a template and see changes live.
- Drag-and-drop elements for interactive editing.
- Use the SDK to collect user modifications before sending a render request to the API.

## Best Practices
- Use the public token for the Preview SDK (never the secret API key).
- Clean up the preview instance when the component unmounts.
- Use the latest SDK version for new features and bug fixes.
- For production, consider loading from a CDN for reliability and caching.

## References
- [Preview SDK on NPM](https://www.npmjs.com/package/@creatomate/preview)
- [Creatomate Developer Portal](https://creatomate.com/developers)
- For up-to-date usage and advanced examples, see the NPM page and example repositories from the Creatomate GitHub organization. 