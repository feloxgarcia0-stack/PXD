import React from 'react';
import { X } from 'lucide-react';
import { NoteImage } from '../types';

interface ImagePreviewProps {
  image: NoteImage;
  onRemove: (id: string) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onRemove }) => {
  return (
    <div className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
      <img 
        src={image.url} 
        alt="Preview" 
        className="w-full h-full object-cover"
      />
      <button
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-md backdrop-blur-sm"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
        <p className="text-xs text-white truncate px-1">Imagen adjunta</p>
      </div>
    </div>
  );
};

export default ImagePreview;