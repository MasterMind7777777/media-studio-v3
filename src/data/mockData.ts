
import { ContentPack, MediaAsset, Platform, RenderJob, Template, User } from "@/types";

export const mockCurrentUser: User = {
  id: "user-1",
  email: "user@example.com",
  name: "Demo User",
  role: "user",
  created_at: new Date().toISOString(),
};

export const mockAdminUser: User = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  created_at: new Date().toISOString(),
};

export const mockPlatforms: Platform[] = [
  {
    id: "instagram-story",
    name: "Instagram Story",
    width: 1080,
    height: 1920,
    aspect_ratio: "9:16",
  },
  {
    id: "instagram-post",
    name: "Instagram Post",
    width: 1080,
    height: 1080,
    aspect_ratio: "1:1",
  },
  {
    id: "facebook-post",
    name: "Facebook Post",
    width: 1200,
    height: 630,
    aspect_ratio: "1.91:1",
  },
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    width: 1280,
    height: 720,
    aspect_ratio: "16:9",
  },
  {
    id: "tiktok-video",
    name: "TikTok Video",
    width: 1080,
    height: 1920,
    aspect_ratio: "9:16",
  },
];

export const mockTemplates: Template[] = [
  {
    id: "template-1",
    name: "Dynamic Product Showcase",
    description: "Showcase your products with dynamic animations and clean layout",
    preview_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    creatomate_template_id: "abcd1234",
    variables: {
      title: {
        type: "text",
        default: "Your Product Name",
      },
      subtitle: {
        type: "text",
        default: "Perfect for any occasion",
      },
      product_image: {
        type: "media",
        default: "product-placeholder.jpg",
      },
      background_color: {
        type: "color",
        default: "#7c3aed",
      },
    },
    platforms: [mockPlatforms[0], mockPlatforms[1]],
    category: "Products",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "template-2",
    name: "Event Promotion",
    description: "Promote your upcoming events with this eye-catching template",
    preview_image_url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81",
    creatomate_template_id: "efgh5678",
    variables: {
      event_name: {
        type: "text",
        default: "Your Event Name",
      },
      date: {
        type: "text",
        default: "June 15, 2023",
      },
      location: {
        type: "text",
        default: "City Event Center",
      },
      event_image: {
        type: "media",
        default: "event-placeholder.jpg",
      },
      overlay_color: {
        type: "color",
        default: "#4f46e5",
      },
    },
    platforms: [mockPlatforms[0], mockPlatforms[2]],
    category: "Events",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "template-3",
    name: "Company Introduction",
    description: "Introduce your company with this professional template",
    preview_image_url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    creatomate_template_id: "ijkl9012",
    variables: {
      company_name: {
        type: "text",
        default: "Your Company",
      },
      tagline: {
        type: "text",
        default: "Building the future",
      },
      logo: {
        type: "media",
        default: "logo-placeholder.png",
      },
      team_photo: {
        type: "media",
        default: "team-placeholder.jpg",
      },
      brand_color: {
        type: "color",
        default: "#6d28d9",
      },
    },
    platforms: [mockPlatforms[2], mockPlatforms[3]],
    category: "Corporate",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "template-4",
    name: "Social Media Quotes",
    description: "Share inspirational quotes with this elegant template",
    preview_image_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    creatomate_template_id: "mnop3456",
    variables: {
      quote: {
        type: "text",
        default: "Your inspirational quote goes here",
      },
      author: {
        type: "text",
        default: "Quote Author",
      },
      background_image: {
        type: "media",
        default: "quote-background.jpg",
      },
      text_color: {
        type: "color",
        default: "#ffffff",
      },
    },
    platforms: [mockPlatforms[1], mockPlatforms[4]],
    category: "Social Media",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "template-5",
    name: "Product Demo",
    description: "Demonstrate your product features in action",
    preview_image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    creatomate_template_id: "qrst7890",
    variables: {
      product_name: {
        type: "text",
        default: "Your Product",
      },
      feature_highlights: {
        type: "text",
        default: "Key Features • Benefits • Value",
      },
      product_video: {
        type: "media",
        default: "product-video-placeholder.mp4",
      },
      logo: {
        type: "media",
        default: "logo-placeholder.png",
      },
      accent_color: {
        type: "color",
        default: "#8b5cf6",
      },
    },
    platforms: [mockPlatforms[3], mockPlatforms[4]],
    category: "Products",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "template-6",
    name: "Season Sale Announcement",
    description: "Announce your seasonal sales with this dynamic template",
    preview_image_url: "https://images.unsplash.com/photo-1487958449943-2429e8be8625",
    creatomate_template_id: "uvwx1234",
    variables: {
      sale_title: {
        type: "text",
        default: "SUMMER SALE",
      },
      discount: {
        type: "text",
        default: "50% OFF",
      },
      dates: {
        type: "text",
        default: "June 1-15, 2023",
      },
      product_image: {
        type: "media",
        default: "sale-product-placeholder.jpg",
      },
      background_color: {
        type: "color",
        default: "#5b21b6",
      },
    },
    platforms: [mockPlatforms[0], mockPlatforms[1], mockPlatforms[2]],
    category: "Retail",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const mockContentPacks: ContentPack[] = [
  {
    id: "pack-1",
    name: "Nature Collection",
    description: "High-quality nature imagery for your projects",
    category: "Nature",
    thumbnail_url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716",
    is_active: true,
    created_by: "admin-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "pack-2",
    name: "Urban Scenes",
    description: "Modern urban photography for city-themed content",
    category: "Urban",
    thumbnail_url: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e",
    is_active: true,
    created_by: "admin-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "pack-3",
    name: "Product Mockups",
    description: "Professional product mockups for e-commerce",
    category: "Products",
    thumbnail_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    is_active: true,
    created_by: "admin-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "pack-4",
    name: "Business & Office",
    description: "Professional business and office imagery",
    category: "Business",
    thumbnail_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    is_active: true,
    created_by: "admin-1",
    created_at: new Date().toISOString(),
  },
];

export const mockMediaAssets: MediaAsset[] = [
  {
    id: "asset-1",
    name: "Mountain Landscape",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    thumbnail_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200",
    user_id: null,
    content_pack_id: "pack-1",
    metadata: {
      width: 1920,
      height: 1080,
      size: 2451234,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "asset-2",
    name: "City Skyline",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e",
    thumbnail_url: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=200",
    user_id: null,
    content_pack_id: "pack-2",
    metadata: {
      width: 1920,
      height: 1080,
      size: 3152678,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "asset-3",
    name: "Product Showcase",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    thumbnail_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200",
    user_id: null,
    content_pack_id: "pack-3",
    metadata: {
      width: 1080,
      height: 1080,
      size: 1876543,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "asset-4",
    name: "Business Meeting",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    thumbnail_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200",
    user_id: null,
    content_pack_id: "pack-4",
    metadata: {
      width: 1920,
      height: 1280,
      size: 2987654,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "asset-5",
    name: "My Project Logo",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    thumbnail_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200",
    user_id: "user-1",
    content_pack_id: null,
    metadata: {
      width: 800,
      height: 600,
      size: 983245,
    },
    created_at: new Date().toISOString(),
  },
  {
    id: "asset-6",
    name: "Product Demo Video",
    file_type: "video",
    file_url: "https://example.com/product-demo.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200",
    user_id: "user-1",
    content_pack_id: null,
    metadata: {
      width: 1920,
      height: 1080,
      duration: 45.3,
      size: 24531678,
    },
    created_at: new Date().toISOString(),
  },
];

export const mockRenderJobs: RenderJob[] = [
  {
    id: "render-1",
    user_id: "user-1",
    template_id: "template-1",
    variables: {
      title: "Summer Collection",
      subtitle: "Available now in stores",
      product_image: "asset-5",
      background_color: "#6d28d9",
    },
    platforms: [mockPlatforms[0], mockPlatforms[1]],
    status: "completed",
    creatomate_render_ids: ["cr-123456", "cr-123457"],
    output_urls: {
      "instagram-story": "https://example.com/renders/summer-collection-story.mp4",
      "instagram-post": "https://example.com/renders/summer-collection-post.mp4",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "render-2",
    user_id: "user-1",
    template_id: "template-2",
    variables: {
      event_name: "Tech Conference 2023",
      date: "October 15-17, 2023",
      location: "San Francisco Convention Center",
      event_image: "asset-4",
      overlay_color: "#4f46e5",
    },
    platforms: [mockPlatforms[0], mockPlatforms[2]],
    status: "processing",
    creatomate_render_ids: ["cr-234567", "cr-234568"],
    output_urls: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "render-3",
    user_id: "user-1",
    template_id: "template-4",
    variables: {
      quote: "The best way to predict the future is to create it.",
      author: "Peter Drucker",
      background_image: "asset-1",
      text_color: "#ffffff",
    },
    platforms: [mockPlatforms[1]],
    status: "completed",
    creatomate_render_ids: ["cr-345678"],
    output_urls: {
      "instagram-post": "https://example.com/renders/quote-post.mp4",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
