"use client";

import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransformedJob } from "@/lib/jobs-data-service";

interface JobContentViewerProps {
  selectedJob: TransformedJob | null;
  onClose: () => void;
}

export function JobContentViewer({ selectedJob, onClose }: JobContentViewerProps) {
  if (!selectedJob || !selectedJob.link) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <p className="text-gray-600 font-nunito">No job selected</p>
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with job info and close button */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/globe.svg"
            alt="Company logo"
            className="w-8 h-8 rounded object-cover flex-shrink-0"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{selectedJob.title}</h3>
            <p className="text-sm text-gray-600">{selectedJob.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedJob.link && window.open(selectedJob.link, '_blank')}
            className="flex items-center gap-2"
            disabled={!selectedJob.link}
          >
            <ExternalLink className="w-3 h-3" />
            Open in New Tab
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Iframe content */}
      <div className="flex-1 relative">
        <iframe
          src={selectedJob.link}
          className="w-full h-full border-0"
          title={`Job: ${selectedJob.title}`}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          onError={() => {
            // Fallback for when iframe fails to load
            return (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center p-8">
                  <p className="text-gray-600 font-nunito mb-4">
                    Unable to load job content in iframe
                  </p>
                  <Button
                    onClick={() => selectedJob.link && window.open(selectedJob.link, '_blank')}
                    className="flex items-center gap-2"
                    disabled={!selectedJob.link}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Job in New Tab
                  </Button>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
