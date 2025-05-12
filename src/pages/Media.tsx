
import { useState } from "react";
import { MediaNavigation } from "@/components/Media/MediaNavigation";
import { MediaGallery } from "@/components/Media/MediaGallery";
import { MediaUploader } from "@/components/Media/MediaUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMediaAssets } from "@/hooks/api";
import { MediaAsset } from "@/types";

export default function Media() {
  const [activeTab, setActiveTab] = useState<string>("all-uploads");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAsset | null>(null);
  
  const { data: mediaAssets, isLoading } = useMediaAssets();
  
  // Filter media assets based on search query
  const filteredAssets = searchQuery && mediaAssets 
    ? mediaAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mediaAssets;
  
  // Recent uploads - last 5
  const recentUploads = mediaAssets 
    ? [...mediaAssets]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    : [];
    
  const handleMediaSelect = (media: MediaAsset) => {
    setSelectedMedia(media);
  };
  
  const handleUploadComplete = () => {
    setShowUploader(false);
    setActiveTab("recent-uploads");
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground">
          Manage your uploads and access content packs
        </p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64">
          <MediaNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            mediaCount={mediaAssets?.length || 0}
            recentUploadsCount={recentUploads.length}
          />
        </div>
        
        <div className="flex-1">
          {showUploader ? (
            <div className="bg-background border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload New Media</h2>
              <MediaUploader
                onMediaSelected={handleUploadComplete}
              />
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploader(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    className="pl-9"
                    placeholder="Search media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  className="gap-2"
                  onClick={() => setShowUploader(true)}
                >
                  <Upload className="h-4 w-4" />
                  Upload New
                </Button>
              </div>
              
              <div className="bg-background border rounded-lg p-6">
                {activeTab === "all-uploads" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">All Uploads</h2>
                    <MediaGallery 
                      mediaAssets={filteredAssets} 
                      isLoading={isLoading}
                      onMediaSelect={handleMediaSelect}
                      selectedMediaId={selectedMedia?.id}
                    />
                  </div>
                )}
                
                {activeTab === "recent-uploads" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
                    <MediaGallery 
                      mediaAssets={recentUploads}
                      isLoading={isLoading}
                      onMediaSelect={handleMediaSelect}
                      selectedMediaId={selectedMedia?.id}
                    />
                  </div>
                )}
                
                {activeTab === "content-packs" && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Content Packs</h2>
                    <Tabs defaultValue="nature">
                      <TabsList>
                        <TabsTrigger value="nature">Nature</TabsTrigger>
                        <TabsTrigger value="business">Business</TabsTrigger>
                        <TabsTrigger value="urban">Urban</TabsTrigger>
                      </TabsList>
                      <TabsContent value="nature" className="mt-4">
                        <MediaGallery 
                          contentPackId="nature"
                          onMediaSelect={handleMediaSelect}
                          selectedMediaId={selectedMedia?.id}
                        />
                      </TabsContent>
                      <TabsContent value="business" className="mt-4">
                        <MediaGallery 
                          contentPackId="business"
                          onMediaSelect={handleMediaSelect}
                          selectedMediaId={selectedMedia?.id}
                        />
                      </TabsContent>
                      <TabsContent value="urban" className="mt-4">
                        <MediaGallery 
                          contentPackId="urban"
                          onMediaSelect={handleMediaSelect}
                          selectedMediaId={selectedMedia?.id}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
