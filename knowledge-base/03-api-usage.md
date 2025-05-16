# API Usage

## REST API

The Creatomate REST API is asynchronous and is best used for server-to-server communication. It allows you to:
- Create renders (videos/images)
- Check the status of a render
- List all renders
- Receive webhooks when a render is complete

### Authentication
All REST API requests require the `Authorization` header with your secret API key:

```
Authorization: Bearer YOUR_API_KEY
```

---

## POST /v1/renders Endpoint

This endpoint allows you to start one or multiple renders. You can provide a template ID, tags, or a template source. The response is an array of render objects.

### Request Parameters
- `output_format` (string, optional): jpg, png, gif, or mp4
- `frame_rate` (number, optional): 1-60 for mp4, 1-15 for gif
- `render_scale` (number, optional): Default 1.0 (100%)
- `max_width` (number, optional): Maximum width, maintains aspect ratio
- `max_height` (number, optional): Maximum height, maintains aspect ratio
- `template_id` (string, optional): The ID of the template to use
- `tags` (array of strings, optional): Template tags
- `source` (object, optional): Provide template source directly
- `modifications` (object, optional): Modifications to apply to the template
- `webhook_url` (string, optional): URL to call when render succeeds or fails
- `metadata` (string, optional): Custom data to identify renders later

### Example Request (cURL)
```bash
curl -X POST https://api.creatomate.com/v1/renders \
  -H 'Authorization: Bearer API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "tags": ["instagram"],
    "modifications": {
      "my-element.text": "A different text"
    }
  }'
```

### Example Request (Voiceover Video)
```bash
curl -s -X POST https://api.creatomate.com/v1/renders \
  -H 'Authorization: Bearer [Your-API-Key]' \
  -H 'Content-Type: application/json' \
  --data-binary @- << EOF
{
  "template_id": "[Your-Template-ID]",
  "modifications": {
    "Image-1": "https://cdn.creatomate.com/demo/better-sleep-1.jpg",
    "Voiceover-1": "The 3 Best Tips for Better Sleep",
    "Image-2": "https://cdn.creatomate.com/demo/better-sleep-2.jpg",
    "Voiceover-2": "Create a Relaxing Bedtime Routine: Wind down before bed with activities like reading, taking a warm bath, or practicing relaxation techniques.",
    "Image-3": "https://cdn.creatomate.com/demo/better-sleep-3.jpg",
    "Voiceover-3": "Maintain a Consistent Sleep Schedule: Go to bed and wake up at the same time every day, even on weekends, to regulate your body's internal clock.",
    "Image-4": "https://cdn.creatomate.com/demo/better-sleep-4.jpg",
    "Voiceover-4": "Exercise Regularly: Stay active during the day, but avoid vigorous exercise close to bedtime for better sleep quality."
  }
}
EOF
```

### Example Response
```json
[
  {
    "id": "e05f847e-2236-4da6-84d5-bb8bdbb0eeca",
    "status": "planned",
    "url": "https://cdn.creatomate.com/renders/e05f847e-2236-4da6-84d5-bb8bdbb0eeca.mp4",
    "template_id": "9e90d011-52e6-49dc-8a7a-5f25058c2568",
    "template_name": "My Template 1",
    "template_tags": ["instagram"],
    "output_format": "mp4",
    "modifications": {
      "my-element.text": "A different text"
    }
  },
  {
    "id": "8fdf79bc-b330-4e95-8715-b262f0b5ac9d",
    "status": "planned",
    "url": "https://cdn.creatomate.com/renders/8fdf79bc-b330-4e95-8715-b262f0b5ac9d.mp4",
    "template_id": "1ad534f0-fe6d-4150-b8cc-90db357e3a7e",
    "template_name": "My Template 2",
    "template_tags": ["instagram"],
    "output_format": "mp4",
    "modifications": {
      "my-element.text": "A different text"
    }
  }
]
```

---

## Render Object Schema

| Field           | Type     | Description                                      |
|-----------------|----------|--------------------------------------------------|
| id              | string   | Unique render ID                                 |
| status          | string   | planned, processing, completed, failed           |
| url             | string   | URL to the rendered video/image                  |
| template_id     | string   | ID of the template used                          |
| template_name   | string   | Name of the template                             |
| template_tags   | array    | Tags associated with the template                |
| output_format   | string   | mp4, gif, jpg, png                               |
| modifications   | object   | Modifications applied to the template            |
| snapshot_url    | string   | (optional) URL to a snapshot image               |
| metadata        | string   | (optional) Custom metadata provided in request   |

---

## GET /v1/renders and GET /v1/renders/{id}

- `GET /v1/renders` returns a list of render objects.
- `GET /v1/renders/{id}` returns a single render object.

### Example Response (Single Render)
```json
{
  "id": "a862048b-d0dc-4029-a4ef-e172e8ded827",
  "status": "completed",
  "url": "https://cdn.creatomate.com/renders/a862048b-d0dc-4029-a4ef-e172e8ded827.mp4",
  "snapshot_url": "https://cdn.creatomate.com/snapshots/a862048b-d0dc-4029-a4ef-e172e8ded827.jpg",
  "template_id": "9e90d011-52e6-49dc-8a7a-5f25058c2568",
  "template_name": "My Template",
  "template_tags": ["instagram"],
  "output_format": "mp4",
  "modifications": {
    "my-element.text": "A different text"
  },
  "metadata": "custom-database-id"
}
```

---

## Error Response Example
```json
{
  "error": {
    "type": "invalid_request",
    "message": "The template_id field is required."
  }
}
```

---

## References
- [Creatomate API Docs](https://creatomate.com/docs/api/introduction)
- [POST /v1/renders Endpoint](https://creatomate.com/docs/api/rest-api/post-v1-renders)
- [REST API Reference](https://creatomate.com/docs/api/rest-api/introduction)
- [Direct API Reference](https://creatomate.com/docs/api/direct-api/introduction)
- [Node.js SDK on GitHub](https://github.com/creatomate/creatomate-node)

## Direct API

The Direct API is synchronous and is best used for client-side rendering. All parameters are passed in the URL, and the result is returned in the same request. Use this for lightweight, quick renders in the browser.

### Example: Direct API URL
```
https://api.creatomate.com/v1/direct?template_id=YOUR_TEMPLATE_ID&modifications[Title]=Your%20Text%20Here&modifications[Image]=https://example.com/image.jpg
```

- [Direct API Docs](https://creatomate.com/docs/api/direct-api/introduction)

## Request & Response Structure
- All requests use JSON format.
- Responses include status, result URL, and error messages if any.

### Example Response (JSON)
```json
{
  "id": "render_1234567890",
  "status": "completed",
  "result_url": "https://cdn.creatomate.com/renders/render_1234567890.mp4",
  "error": null
}
```

## References
- [Creatomate API Docs](https://creatomate.com/docs/api/introduction)
- [REST API Reference](https://creatomate.com/docs/api/rest-api/introduction)
- [Direct API Reference](https://creatomate.com/docs/api/direct-api/introduction)
- [Node.js SDK on GitHub](https://github.com/creatomate/creatomate-node) 