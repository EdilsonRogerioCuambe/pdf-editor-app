"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pen, Type, Upload as UploadIcon } from "lucide-react";
import { useState } from 'react';
import { SignatureDrawPad } from './signature-pads/draw-pad';
import { SignatureTypePad } from './signature-pads/type-pad';
import { SignatureUploadPad } from './signature-pads/upload-pad';

interface SignatureCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: string) => void;
}

export function SignatureCreationModal({ open, onOpenChange, onSave }: SignatureCreationModalProps) {
  const [activeTab, setActiveTab] = useState('draw');

  const handleSave = (data: string) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[95vw] h-[600px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
           <DialogTitle className="text-xl">Create Signature</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="draw" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
           <div className="px-6 border-b bg-gray-50/50">
               <TabsList className="bg-transparent h-12 w-full justify-start gap-4">
                  <TabsTrigger value="draw" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                      <Pen className="w-4 h-4 mr-2" /> Draw
                  </TabsTrigger>
                  <TabsTrigger value="type" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                      <Type className="w-4 h-4 mr-2" /> Type
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:shadow-sm border-b-2 border-transparent data-[state=active]:border-primary rounded-none h-full px-4">
                      <UploadIcon className="w-4 h-4 mr-2" /> Upload
                  </TabsTrigger>
               </TabsList>
           </div>

           <div className="flex-1 bg-gray-50 p-6 overflow-y-auto overflow-x-hidden">
              <TabsContent value="draw" className="h-full m-0 data-[state=active]:flex flex-col">
                  <SignatureDrawPad onSave={handleSave} onCancel={() => onOpenChange(false)} />
              </TabsContent>
              <TabsContent value="type" className="h-full m-0 data-[state=active]:flex flex-col">
                  <SignatureTypePad onSave={handleSave} onCancel={() => onOpenChange(false)} />
              </TabsContent>
              <TabsContent value="upload" className="h-full m-0 data-[state=active]:flex flex-col">
                  <SignatureUploadPad onSave={handleSave} onCancel={() => onOpenChange(false)} />
              </TabsContent>
           </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
