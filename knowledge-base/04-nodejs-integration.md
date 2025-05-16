# Node.js Integration

## Installing the Official SDK

Install the Creatomate Node.js SDK in your project:

```bash
npm install creatomate
```

- [creatomate-node on GitHub](https://github.com/creatomate/creatomate-node)
- [Node.js Examples](https://github.com/creatomate/node-examples)

## Basic Usage Example

```js
const Creatomate = require('creatomate');
const client = new Creatomate.Client('YOUR_API_KEY');

client.render({
  templateId: 'YOUR_TEMPLATE_ID',
  modifications: {
    Title: 'Your Text Here',
    Image: 'https://example.com/image.jpg',
  },
}).then(result => {
  console.log('Render started:', result);
}).catch(error => {
  console.error('Error:', error);
});
```

## Advanced Usage: Custom Source

You can build a video/image from scratch using the SDK's Source and Element classes:

```js
const Creatomate = require('creatomate');
const client = new Creatomate.Client('YOUR_API_KEY');

const source = new Creatomate.Source({
  outputFormat: 'mp4',
  width: 1280,
  height: 720,
  elements: [
    new Creatomate.Video({
      track: 1,
      source: 'https://creatomate-static.s3.amazonaws.com/demo/video1.mp4',
    }),
    new Creatomate.Text({
      text: 'Your text overlay here',
      width: '100%',
      height: '100%',
      xAlignment: '50%',
      yAlignment: '100%',
      font: new Creatomate.Font('Aileron', 800, 'normal', '8.48 vh'),
      fillColor: '#ffffff',
    }),
  ],
});

client.render({ source })
  .then(renders => console.log('Your video is ready:', renders))
  .catch(error => console.error('Error:', error));
```

## Error Handling

Always handle errors in your API calls:

```js
client.render({
  templateId: 'INVALID_ID',
  modifications: {}
}).catch(error => {
  // Handle error
  console.error('API Error:', error.message);
});
```

---

## Advanced Scenarios & Use Cases

The official [Creatomate Node.js examples](https://github.com/Creatomate/node-examples) repository provides a wide range of advanced scenarios. Here are some practical use cases for your project:

### Video Processing
- Concatenate multiple videos
- Trim a video
- Add a responsive overlay or watermark
- Overlay text on video
- Transcode any video to MP4 (H.264)
- Render a template with dynamic data
- Generate story videos for Instagram, YouTube, or TikTok
- Auto-generate videos using ChatGPT
- Text-to-speech video (e.g., with AWS Polly or ElevenLabs)
- Generate subtitles or animated captions
- Turn images into a video slideshow
- Blur the background of a video
- Add a progress bar
- Add intro/outro scenes
- Add audio tracks
- Take a screenshot or snapshot of a video
- Convert video to GIF
- Picture-in-picture, split screen, or video walls

### Example Variables
- `Title`, `Subtitle`, `Caption` (dynamic text)
- `Image`, `BackgroundImage`, `Logo` (dynamic images)
- `VideoSource`, `OverlayVideo`
- `VoiceoverText`, `AudioTrack`
- `ProgressBarColor`, `ProgressBarPosition`
- `WatermarkImage`, `WatermarkOpacity`
- `IntroScene`, `OutroScene`
- `FontStyle`, `FontColor`, `FontSize`
- `TransitionType`, `TransitionDuration`
- `StartTime`, `EndTime` (for trimming)
- `OutputFormat` (mp4, gif, jpg, png)
- `AspectRatio` (for stories, posts, etc.)

### How to Use These in Your Project
- **Dynamic Templates:** Personalize videos for each user or campaign.
- **Batch Processing:** Automate the creation of many videos at once (e.g., for marketing, social media, or e-commerce).
- **AI Integration:** Combine with AI-generated content (text, images, voice) for fully automated video production.
- **Media Library:** Allow users to upload and edit their own media, then process it with Creatomate.

---

## References
- [creatomate-node on GitHub](https://github.com/creatomate/creatomate-node)
- [Node.js Examples](https://github.com/creatomate/node-examples) 