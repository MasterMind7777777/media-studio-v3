
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaNavigation } from "@/components/Media/MediaNavigation";
import { MediaGallery } from "@/components/Media/MediaGallery";
import { MediaAsset } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelect: (media: MediaAsset) => void;
  title?: string;
}

export function MediaSelectionDialog({
  open,
  onOpenChange,
  onMediaSelect,
  title = "Select Media"
}: MediaSelectionDialogProps) {
  const [mediaTab, setMediaTab] = useState<string>("all-uploads");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-2">
          <MediaNavigation 
            activeTab={mediaTab} 
            onTabChange={setMediaTab}
            className="mb-4"
          />
          
          <div className="mt-4">
            {mediaTab === "all-uploads" && (
              <MediaGallery 
                onMediaSelect={(media) => {
                  onMediaSelect(media);
                  onOpenChange(false); // Close dialog after selection
                }}
              />
            )}
            
            {mediaTab === "recent-uploads" && (
              <div className="mt-4">
                <h3 className="font-medium mb-4">Recent Uploads</h3>
                <MediaGallery 
                  onMediaSelect={(media) => {
                    onMediaSelect(media);
                    onOpenChange(false); // Close dialog after selection
                  }}
                />
              </div>
            )}
            
            {mediaTab === "content-packs" && (
              <div className="mt-4">
                <Tabs defaultValue="nature">
                  <TabsList>
                    <TabsTrigger value="nature">Nature</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="urban">Urban</TabsTrigger>
                  </TabsList>
                  <TabsContent value="nature" className="mt-4">
                    <MediaGallery 
                      contentPackId="nature"
                      onMediaSelect={(media) => {
                        onMediaSelect(media);
                        onOpenChange(false);
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="business" className="mt-4">
                    <MediaGallery 
                      contentPackId="business"
                      onMediaSelect={(media) => {
                        onMediaSelect(media);
                        onOpenChange(false);
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="urban" className="mt-4">
                    <MediaGallery 
                      contentPackId="urban"
                      onMediaSelect={(media) => {
                        onMediaSelect(media);
                        onOpenChange(false);
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
