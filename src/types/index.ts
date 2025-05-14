
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  preview_image_url: string;
  creatomate_template_id: string;
  variables: Record<string, any>;
  platforms: Platform[];
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Platform {
  id: string;
  name: string;
  width: number;
  height: number;
  aspect_ratio: string;
}

export interface ContentPack {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  file_type: 'image' | 'video';
  file_url: string;
  thumbnail_url: string;
  user_id: string | null;
  content_pack_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  // Add source_url field to fix the build error
  source_url?: string;
}

export interface RenderJob {
  id: string;
  user_id: string;
  template_id: string;
  variables: Record<string, any>;
  platforms: Platform[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  creatomate_render_ids: string[];
  output_urls: Record<string, string>;
  created_at: string;
  updated_at: string;
  snapshot_url?: string;
  name?: string;
}

export interface Statistics {
  id: string;
  date: string;
  renders_count: number;
  active_users: number;
  storage_used: number;
  processing_time: number;
  platform_breakdown: Record<string, number>;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'media' | 'color';
  default: string;
  value: string;
  options?: Record<string, any>;
}

export interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface SideNavItem extends NavItem {
  items?: NavItem[];
}

// Export CreatomatePreviewSDK interface
export interface CreatomatePreviewSDK {
  Preview: new (config: {
    token: string;
    templateId?: string;
    container: HTMLElement;
    format?: string;
    mode?: 'player' | 'interactive';
    modifications?: Record<string, any>;
  }) => {
    onReady: () => void;
    onError: (error: Error) => void;
    onTimeUpdate: (time: number) => void;
    onPlay: () => void;
    onPause: () => void;
    loadTemplate: (templateId: string) => Promise<void>;
    setModifications: (modifications: Record<string, any>) => void;
    setTime: (time: number) => Promise<void>;
    play: () => void;
    pause: () => void;
    dispose: () => void;
    on: (event: string, callback: any) => void;
    isPlaying: () => boolean;
  };
}
